/**
 * 上传并处理 Markdown 文件 API (server/api/admin/upload-and-process.post.ts)
 *
 * 用途：用户拖拽 .md 文件上传，系统自动处理本地图片后保存。
 * 请求：POST /api/admin/upload-and-process  (multipart/form-data)
 * 返回：{ success, path, uploadedCount, skippedCount, errors }
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { validateFilename } from '@serverUtils/filename-validator';

const DEFAULT_FILENAME = 'untitled';

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event);

  // 图床配置
  const imgBedApiUrl = formData.get('imgBedApiUrl') as string;
  const imgBedToken = formData.get('imgBedToken') as string;

  if (!imgBedApiUrl || !imgBedToken) {
    throw createError({ statusCode: 400, message: '缺少图床配置（apiUrl 或 token）' });
  }

  const imgBedConfig: ImgBedConfig = { apiUrl: imgBedApiUrl, token: imgBedToken };

  // 模式 A：上传 .md 文件 → 处理图片 → 保存
  const file = formData.get('file') as File | null;
  if (file) {
    const content = await file.text().catch(() => {
      throw createError({ statusCode: 400, message: '无法读取文件内容' });
    });

    const rawFilename = (formData.get('filename') as string) || '';
    const baseName = rawFilename ? validateFilename(rawFilename) : DEFAULT_FILENAME;
    const processResult = await processMarkdownImages(content, imgBedConfig);

    const filePath = join(process.cwd(), 'content', 'blog', `${baseName}.md`);
    try {
      await writeFile(filePath, processResult.processedContent, 'utf-8');
    } catch (err: any) {
      throw createError({ statusCode: 500, message: `写入文件失败: ${err.message}` });
    }

    return {
      success: true,
      path: `/blog/${baseName}`,
      totalImages: processResult.totalImages,
      localImages: processResult.localImages,
      uploadedCount: processResult.uploadedCount,
      skippedCount: processResult.skippedCount,
      errors: processResult.errors,
    };
  }

  // 模式 B：接收 Markdown 字符串 → 处理图片 → 返回（不保存）
  const rawContent = formData.get('content') as string | null;
  if (rawContent) {
    if (!rawContent.trim()) {
      throw createError({ statusCode: 400, message: '未提供 Markdown 内容' });
    }
    return await processMarkdownImages(rawContent, imgBedConfig);
  }

  throw createError({ statusCode: 400, message: '请提供 file（上传模式）或 content（处理模式）' });
});
