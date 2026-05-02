/**
 * 本地图片代理 API
 *
 * 将 /api/blog-images/picture-1.jpg 映射到 content/blog/images/picture-1.jpg
 * 供编辑器预览和已保存文章使用。
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const IMAGES_DIR = join(process.cwd(), 'content', 'blog', 'images');

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'path');
  if (!filename) {
    throw createError({ statusCode: 400, message: '缺少文件名' });
  }

  const filePath = join(IMAGES_DIR, filename);

  let data: Buffer;
  try {
    data = await readFile(filePath);
  } catch {
    throw createError({ statusCode: 404, message: '图片不存在' });
  }

  const ext = filename.split('.').pop()?.toLowerCase() || '';
  setHeader(event, 'Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
  return data;
});
