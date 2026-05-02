/**
 * 保存文章 API (server/api/admin/save-post.post.ts)
 *
 * 用途：用户在页面手动输入文章内容 + 文件名，点击"保存"按钮后调用。
 * 请求：POST /api/admin/save-post  { filename, content }
 * 返回：{ success, path }
 *
 * 保存成功后：
 * 1. 清理未被引用的本地图片（用户在编辑中删除的图片）
 * 2. 后台异步将本地图片（./images/...）上传到图床并替换路径
 */

import { writeFile, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { validateFilename } from '@serverUtils/filename-validator';
import { processMarkdownImages } from '@serverUtils/markdown-image-processor';
import { getServerImgBedConfig } from '@serverUtils/imgbed-config.server';

const IMAGES_DIR = join(process.cwd(), 'content', 'blog', 'images');

/**
 * 扫描内容中引用的所有本地图片文件名，删除未被引用的文件。
 * 这处理用户在编辑中删除图片、但本地文件还留着的场景。
 */
async function cleanUnreferencedImages(content: string) {
  const referenced = new Set<string>();

  // 匹配 ./images/picture-1.jpg 格式
  const localRefRegex = /\]\(\.\/images\/([^)]+)\)/g;
  let match;
  while ((match = localRefRegex.exec(content)) !== null) {
    if (match[1]) referenced.add(match[1]);
  }

  // 匹配 /api/blog-images/picture-1.jpg 格式
  const apiRefRegex = /\]\(\/api\/blog-images\/([^)]+)\)/g;
  while ((match = apiRefRegex.exec(content)) !== null) {
    if (match[1]) referenced.add(match[1]);
  }

  try {
    const files = await readdir(IMAGES_DIR);
    for (const file of files) {
      if (!referenced.has(file)) {
        await unlink(join(IMAGES_DIR, file)).catch(() => {});
      }
    }
  } catch {
    // 目录可能不存在
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ filename: string; content: string }>(event);

  if (!body?.filename || !body?.content) {
    throw createError({ statusCode: 400, message: '缺少 filename 或 content' });
  }

  // 校验文件名合法性
  const baseName = validateFilename(body.filename);

  // 写入 content/blog/
  const filePath = join(process.cwd(), 'content', 'blog', `${baseName}.md`);
  try {
    await writeFile(filePath, body.content, 'utf-8');
  } catch (err: any) {
    throw createError({ statusCode: 500, message: `写入文件失败: ${err.message}` });
  }

  // 清理不再被引用的本地图片（用户在编辑中删除的图）
  await cleanUnreferencedImages(body.content);

  // 后台异步处理本地图片 → 上传图床并替换路径
  processLocalImagesAsync(filePath, body.content, baseName);

  return { success: true, path: `/blog/${baseName}` };
});

async function processLocalImagesAsync(filePath: string, content: string, baseName: string) {
  try {
    const config = await getServerImgBedConfig();
    if (!config.token) return; // 图床未配置，跳过

    const contentDir = join(process.cwd(), 'content', 'blog');
    const result = await processMarkdownImages(content, config, { baseDir: contentDir });

    if (result.uploadedCount > 0 && result.processedContent !== content) {
      await writeFile(filePath, result.processedContent, 'utf-8');
      console.log(`[后台图片上传] ${baseName}: ${result.uploadedCount} 张图片已上传到图床`);
    }
  } catch (err) {
    console.error(`[后台图片上传] ${baseName} 处理失败:`, err);
  }
}
