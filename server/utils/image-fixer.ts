/**
 * 博客图片修复统一模块 (server/utils/image-fixer.ts)
 *
 * 合并原 auto-image-fix / image-fixer / blog-image-repair 三模块，
 * 提供单篇修复、扫描结果修复、全量修复三种入口。
 *
 * 本地优先策略：
 *   ① images 目录已有同名文件 → 替换为 ./images/xxx（不上传）
 *   ② 本地无同名文件 → 读取原始路径 → 上传图床 → 替换为云端 URL
 *
 * 防重复上传：内置 uploadedCache 缓存
 */

import { readFile, writeFile, access, readdir } from 'node:fs/promises';
import { basename, resolve, join, parse } from 'node:path';
import type { ImgBedConfig } from '#shared/utils/imgbed-config';
import { normalizeImgBedBaseUrl } from '#shared/utils/imgbed-config';
import { extractImages, getLocalImages, replaceImagePath } from '#shared/utils/markdown-parser';
import { uploadToImgBed } from './image-upload';
import { createModuleLogger } from '#shared/utils/logger';

const log = createModuleLogger('imgFix');
const LOCAL_IMAGES_DIR = 'content/blog/images';
const BLOG_DIR = join(process.cwd(), 'content', 'blog');

// 已上传图片缓存：避免同一图片重复上传
const uploadedCache = new Map<string, string>();

async function fileExists(fp: string): Promise<boolean> {
  try { await access(fp); return true; } catch { return false; }
}

function isImgBedUrl(url: string, apiUrl: string): boolean {
  return /^https?:\/\//i.test(url) && url.startsWith(normalizeImgBedBaseUrl(apiUrl));
}

// --- 接口定义 ---

/** 单篇文章修复结果 */
export interface ImageFixResult {
  fixed: boolean;
  totalLocal: number;
  uploaded: number;
  localRefed: number;
  errors: Array<{ path: string; error: string }>;
}

/** 扫描结果条目 */
export interface FixItem {
  postPath: string;
  stem: string;
  localImages: Array<{ path: string; pathType: string }>;
}

/** 批量修复结果 */
export interface FixResult {
  totalItems: number;
  fixedPosts: number;
  uploadedCount: number;
  localRefCount: number;
  skippedCount: number;
  errors: Array<{ postPath: string; imagePath: string; error: string }>;
}

// --- 核心逻辑：处理单张图片的本地优先替换 ---

/**
 * 处理单张本地图片：本地优先策略
 * 返回 { replacement, source } 或 null（跳过/失败时由调用方记录错误）
 */
async function resolveImageReplacement(
  imgPath: string,
  imgBedConfig: ImgBedConfig | undefined,
  errors: Array<{ path: string; error: string }>,
): Promise<{ replacement: string; source: 'local' | 'cache' | 'upload' } | null> {
  const imageName = basename(imgPath);

  // 策略①：路径已是 ./images/xxx 且文件存在 → 跳过
  if (imgPath.startsWith('./images/') || imgPath.startsWith('images/')) {
    const localPath = resolve(process.cwd(), LOCAL_IMAGES_DIR, imageName);
    if (await fileExists(localPath)) {
      log.debug(`已是本地引用且存在: ${imgPath}`);
      return null; // 跳过，无需替换
    }
  }

  // 策略②：本地 images/ 有同名文件 → 替换为 ./images/xxx
  const localImgPath = resolve(process.cwd(), LOCAL_IMAGES_DIR, imageName);
  if (await fileExists(localImgPath)) {
    const replacement = `./images/${imageName}`;
    log.debug(`本地引用: ${imgPath} → ${replacement}`);
    return { replacement, source: 'local' };
  }

  // 策略③：检查上传缓存 → 避免重复上传
  if (uploadedCache.has(imgPath)) {
    const cachedUrl = uploadedCache.get(imgPath)!;
    log.debug(`缓存命中: ${imgPath} → ${cachedUrl}`);
    return { replacement: cachedUrl, source: 'cache' };
  }

  // 策略④：读取原始路径 → 上传图床
  let buffer: Buffer;
  try {
    buffer = await readFile(imgPath);
  } catch {
    errors.push({ path: imgPath, error: '文件不存在' });
    return null;
  }

  if (!imgBedConfig) {
    errors.push({ path: imgPath, error: '图床配置为空' });
    return null;
  }

  const result = await uploadToImgBed(buffer, imageName || 'image.jpg', imgBedConfig);
  if (result.success && result.url) {
    uploadedCache.set(imgPath, result.url);
    log.info(`上传成功: ${imgPath} → ${result.url}`);
    return { replacement: result.url, source: 'upload' };
  }

  errors.push({ path: imgPath, error: result.error || '上传失败' });
  log.error(`上传失败: ${result.error}`);
  return null;
}

// --- 公开 API ---

/**
 * 修复单篇文章的本地图片
 * 来源：原 auto-image-fix.ts 的 ensureArticleImagesFixed
 */
export async function fixSinglePost(
  filePath: string,
  imgBedConfig?: ImgBedConfig,
): Promise<ImageFixResult> {
  log.separator('开始处理文章');
  log.info(`文件路径: ${filePath}`);

  let rawContent: string;
  try {
    rawContent = await readFile(filePath, 'utf-8');
    log.debug(`读取成功 (${rawContent.length} 字符)`);
  } catch (err) {
    log.error(`读取失败: ${(err as Error).message}`);
    return { fixed: false, totalLocal: 0, uploaded: 0, localRefed: 0, errors: [] };
  }

  const allImages = extractImages(rawContent);
  const localImages = getLocalImages(allImages);
  log.info(`总图片: ${allImages.length} | 本地: ${localImages.length}`);

  if (localImages.length === 0) {
    log.debug('无需处理');
    return { fixed: false, totalLocal: 0, uploaded: 0, localRefed: 0, errors: [] };
  }

  localImages.forEach((img, idx) => {
    log.debug(`[${idx + 1}] "${img.path}" (${img.pathType})`);
  });

  const errors: Array<{ path: string; error: string }> = [];
  let processedContent = rawContent;
  let uploadCount = 0;
  let localRefCount = 0;

  for (let i = 0; i < localImages.length; i++) {
    const img = localImages[i];
    log.info(`处理第 ${i + 1}/${localImages.length}: "${img.path}"`);

    try {
      const result = await resolveImageReplacement(img.path, imgBedConfig, errors);
      if (!result) continue;

      processedContent = replaceImagePath(processedContent, img.path, result.replacement);
      if (result.source === 'local') localRefCount++;
      else uploadCount++;
    } catch (err: any) {
      errors.push({ path: img.path, error: err?.message || '异常' });
      log.error(`异常: ${err?.message}`);
    }
  }

  // 有修改则写回文件
  const totalChanged = uploadCount + localRefCount;
  if (totalChanged > 0 && processedContent !== rawContent) {
    log.info(`写回文件 (上传${uploadCount} + 本地引用${localRefCount})...`);
    try {
      await writeFile(filePath, processedContent, 'utf-8');
      log.info('写入成功');
    } catch (err: any) {
      errors.push({ path: filePath, error: `写入失败: ${err?.message}` });
      log.error(`写入失败: ${err?.message}`);
    }
  } else {
    log.debug('无需修改');
  }

  log.separator('完成');
  log.info(`本地${localImages.length} | 上传${uploadCount} | 本地引用${localRefCount} | 错误${errors.length}`);
  errors.forEach(e => log.warn(`${e.path}: ${e.error}`));

  return {
    fixed: totalChanged > 0,
    totalLocal: localImages.length,
    uploaded: uploadCount,
    localRefed: localRefCount,
    errors,
  };
}

/**
 * 根据扫描结果批量修复本地图片
 * 来源：原 image-fixer.ts 的 fixScannedImages
 */
export async function fixScannedImages(
  items: FixItem[],
  imgBedConfig: ImgBedConfig,
): Promise<FixResult> {
  const errors: Array<{ postPath: string; imagePath: string; error: string }> = [];
  let fixedPosts = 0;
  let uploadedCount = 0;
  let localRefCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    const filePath = resolve(process.cwd(), 'content', `${item.stem}.md`);
    log.info(`处理文章: ${item.stem}`);

    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch (err) {
      log.error(`读取失败: ${(err as Error).message}`);
      continue;
    }

    let processedContent = content;
    let postChanged = false;

    for (const img of item.localImages) {
      log.debug(`处理图片: ${img.path}`);

      try {
        // 判断是否已是本地引用且文件存在（跳过计数）
        const imageName = basename(img.path);
        if ((img.path.startsWith('./images/') || img.path.startsWith('images/'))) {
          const localPath = resolve(process.cwd(), LOCAL_IMAGES_DIR, imageName);
          if (await fileExists(localPath)) {
            log.debug(`已是本地引用且存在: ${img.path}`);
            skippedCount++;
            continue;
          }
        }

        const imgErrors: Array<{ path: string; error: string }> = [];
        const result = await resolveImageReplacement(img.path, imgBedConfig, imgErrors);

        // 将 imgErrors 转换为批量错误格式
        imgErrors.forEach(e => errors.push({ postPath: item.postPath, imagePath: e.path, error: e.error }));

        if (!result) continue;

        processedContent = replaceImagePath(processedContent, img.path, result.replacement);
        if (result.source === 'local') localRefCount++;
        else uploadedCount++;
        postChanged = true;
      } catch (err) {
        errors.push({ postPath: item.postPath, imagePath: img.path, error: (err as Error).message });
      }
    }

    // 写回文件
    if (postChanged && processedContent !== content) {
      try {
        await writeFile(filePath, processedContent, 'utf-8');
        fixedPosts++;
        log.info(`文章已更新: ${item.stem}`);
      } catch (err) {
        errors.push({ postPath: item.postPath, imagePath: filePath, error: `写入失败: ${(err as Error).message}` });
      }
    }
  }

  log.info(`替换完成: 修复${fixedPosts}篇 | 上传${uploadedCount} | 本地引用${localRefCount} | 跳过${skippedCount} | 错误${errors.length}`);

  return {
    totalItems: items.length,
    fixedPosts,
    uploadedCount,
    localRefCount,
    skippedCount,
    errors,
  };
}

/**
 * 修复所有博客文章的本地图片
 * 来源：原 blog-image-repair.ts 的 repairBlogMarkdownImages
 */
export async function fixAllPosts(imgBedConfig: ImgBedConfig): Promise<FixResult> {
  // 列出所有 markdown 文件
  const entries = await readdir(BLOG_DIR, { withFileTypes: true });
  const markdownFiles = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => join(BLOG_DIR, entry.name));

  const errors: Array<{ postPath: string; imagePath: string; error: string }> = [];
  let fixedPosts = 0;
  let uploadedCount = 0;
  let localRefCount = 0;
  let skippedCount = 0;

  for (const markdownFile of markdownFiles) {
    const originalContent = await readFile(markdownFile, 'utf-8');
    const extractedImages = extractImages(originalContent);
    let nextContent = originalContent;
    let postChanged = false;

    for (const image of extractedImages) {
      // 跳过已是图床 URL 的图片
      if (isImgBedUrl(image.path, imgBedConfig.apiUrl)) {
        continue;
      }

      // 跳过非本地路径（其他外部 URL）
      if (/^https?:\/\//i.test(image.path)) {
        continue;
      }

      log.debug(`处理图片: ${image.path}`);

      try {
        // 判断是否已是本地引用且文件存在
        const imageName = basename(image.path);
        if ((image.path.startsWith('./images/') || image.path.startsWith('images/'))) {
          const localPath = resolve(process.cwd(), LOCAL_IMAGES_DIR, imageName);
          if (await fileExists(localPath)) {
            skippedCount++;
            continue;
          }
        }

        const imgErrors: Array<{ path: string; error: string }> = [];
        const result = await resolveImageReplacement(image.path, imgBedConfig, imgErrors);

        imgErrors.forEach(e => errors.push({ postPath: markdownFile, imagePath: e.path, error: e.error }));

        if (!result) continue;

        nextContent = replaceImagePath(nextContent, image.path, result.replacement);
        if (result.source === 'local') localRefCount++;
        else uploadedCount++;
        postChanged = true;
      } catch (err) {
        errors.push({ postPath: markdownFile, imagePath: image.path, error: (err as Error).message });
      }
    }

    if (postChanged && nextContent !== originalContent) {
      try {
        await writeFile(markdownFile, nextContent, 'utf-8');
        fixedPosts++;
        log.info(`文章已更新: ${parse(markdownFile).name}`);
      } catch (err) {
        errors.push({ postPath: markdownFile, imagePath: markdownFile, error: `写入失败: ${(err as Error).message}` });
      }
    }
  }

  log.info(`全量修复完成: 扫描${markdownFiles.length}篇 | 修复${fixedPosts}篇 | 上传${uploadedCount} | 本地引用${localRefCount} | 跳过${skippedCount} | 错误${errors.length}`);

  return {
    totalItems: markdownFiles.length,
    fixedPosts,
    uploadedCount,
    localRefCount,
    skippedCount,
    errors,
  };
}
