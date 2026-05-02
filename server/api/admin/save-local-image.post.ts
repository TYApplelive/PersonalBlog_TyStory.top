/**
 * 本地图片保存 API
 *
 * 接受 multipart/form-data 中的 file（图片），保存到 content/blog/images/。
 * 如果已有相同内容的图片，直接复用现有文件不重复保存。
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const IMAGES_DIR = join(process.cwd(), 'content', 'blog', 'images');

async function findExistingImage(buffer: Buffer, ext: string): Promise<string | null> {
  try {
    const files = await readdir(IMAGES_DIR);
    for (const file of files) {
      if (!file.endsWith(ext)) continue;
      const existingBuffer = await readFile(join(IMAGES_DIR, file));
      if (buffer.equals(existingBuffer)) {
        return file;
      }
    }
  } catch {
    // 目录可能还不存在
  }
  return null;
}

async function getNextImageNumber(): Promise<number> {
  try {
    await mkdir(IMAGES_DIR, { recursive: true });
    const files = await readdir(IMAGES_DIR);
    let maxNum = 0;
    for (const file of files) {
      const match = file.match(/^picture-(\d+)\./);
      if (match) {
        const num = parseInt(match[1] ?? '0', 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return maxNum + 1;
  } catch {
    return 1;
  }
}

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);
  if (!form?.length) {
    throw createError({ statusCode: 400, message: '未收到文件' });
  }

  const filePart = form.find((p) => p.name === 'file');
  if (!filePart?.data || !filePart.filename) {
    throw createError({ statusCode: 400, message: '缺少 file 字段' });
  }

  const ext = extname(filePart.filename) || '.png';
  const buffer = filePart.data;

  await mkdir(IMAGES_DIR, { recursive: true });

  // 检查是否已有相同内容的图片，有则直接复用
  const existingName = await findExistingImage(buffer, ext);
  if (existingName) {
    return { success: true, path: `./images/${existingName}`, filename: existingName };
  }

  const nextNum = await getNextImageNumber();
  const savedName = `picture-${nextNum}${ext}`;
  const filePath = join(IMAGES_DIR, savedName);

  await writeFile(filePath, buffer);

  return { success: true, path: `./images/${savedName}`, filename: savedName };
});
