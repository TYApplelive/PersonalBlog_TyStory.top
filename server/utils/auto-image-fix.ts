/**
 * 博客文章本地图片自动修复工具 (server/utils/auto-image-fix.ts)
 *
 * 核心场景：用户将带有本地图片路径的 md 文件放入 content/blog/，
 * 程序自动检测本地图片、找到文件、上传图床或引用本地、替换 md 路径。
 *
 * 处理策略：
 *   ① images 目录已有该图片 → 直接用 ./images/xxx.jpg 替换（不上传）
 *   ② images 没有 → 用 md 原始绝对路径读取 → 上传图床 → 替换为云端 URL
 */

import { readFile, writeFile, access } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import type { ImgBedConfig } from '#shared/utils/imgbed-config';
import { extractImages, getLocalImages, replaceImagePath } from '#shared/utils/markdown-parser';
import { createModuleLogger } from '#shared/utils/logger';

const log = createModuleLogger('imgFix');
const LOCAL_IMAGES_DIR = 'content/blog/images';

export interface ImageFixResult {
  fixed: boolean;
  totalLocal: number;
  uploaded: number;
  localRefed: number;
  errors: Array<{ path: string; error: string }>;
}

async function fileExists(fp: string): Promise<boolean> {
  try {
    await access(fp);
    return true;
  } catch {
    return false;
  }
}

export async function ensureArticleImagesFixed(
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
    const imageName = basename(img.path);

    log.info(`处理第 ${i + 1}/${localImages.length}: "${img.path}"`);

    try {
      // 策略①：images 目录已有？→ 引用本地，不上传
      const localImgPath = resolve(process.cwd(), LOCAL_IMAGES_DIR, imageName);
      if (await fileExists(localImgPath)) {
        const replacement = `./images/${imageName}`;
        processedContent = replaceImagePath(processedContent, img.path, replacement);
        localRefCount++;
        log.debug(`images 已存在 → 本地引用: "${replacement}"`);
        continue;
      }

      // 策略②：images 没有 → 直接用 md 原始路径读取 → 上传图床
      log.debug(`images 不存在 → 尝试读取原始路径: "${img.path}"`);

      let buffer: Buffer;
      try {
        buffer = await readFile(img.path);
        log.debug(`读取成功 (${(buffer.length / 1024).toFixed(1)} KB)`);
      } catch (err: any) {
        errors.push({ path: img.path, error: `读取失败: ${err?.message || '异常'}` });
        continue;
      }

      if (!imgBedConfig) {
        errors.push({ path: img.path, error: '图床配置为空' });
        continue;
      }

      log.info('上传到图床...');
      const { uploadToImgBed } = await import('./image-upload');
      const result = await uploadToImgBed(buffer, imageName || 'image.jpg', imgBedConfig);

      if (!result.success || !result.url) {
        errors.push({ path: img.path, error: result.error || '上传失败' });
        log.error(`上传失败: ${result.error}`);
        continue;
      }

      processedContent = replaceImagePath(processedContent, img.path, result.url);
      uploadCount++;
      log.info(`上传成功 → "${result.url}"`);
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
