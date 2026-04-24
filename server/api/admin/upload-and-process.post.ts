/**
 * 上传并处理 Markdown 文件 API (server/api/admin/upload-and-process.post.ts)
 *
 * 耦合关系：
 *   - app/pages/admin/posts/new.vue → 上传模式「上传并处理」按钮调用
 *   - shared/utils/markdown-parser.ts → extractImages / getLocalImages / replaceImagePath
 *   - server/utils/image-upload.ts    → uploadToImgBed 上传图片到图床
 *   - shared/utils/imgbed-config.ts   → ImgBedConfig 类型
 *   - content/blog/*.md               → 写入目标文件
 *
 * 请求方式：POST /api/admin/upload-and-process (multipart/form-data)
 * 请求体：file(.md), imgBedApiUrl, imgBedToken, filename(可选)
 * 返回：{ success, path, uploadedCount, skippedCount, errors }
 *
 * 一次请求完成：接收 .md → 处理本地图片上传图床 → 替换路径 → 保存到 content/blog/
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// 文件名合法性校验
const SAFE_FILENAME = /^[a-zA-Z0-9_-]+$/;

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event);

  // 图床配置（两种模式都必须提供）
  const imgBedApiUrl = formData.get('imgBedApiUrl') as string;
  const imgBedToken = formData.get('imgBedToken') as string;

  if (!imgBedApiUrl || !imgBedToken) {
    throw createError({ statusCode: 400, message: '缺少图床配置（apiUrl 或 token）' });
  }

  const imgBedConfig: ImgBedConfig = { apiUrl: imgBedApiUrl, token: imgBedToken };

  // ========== 模式判断 ==========
  const file = formData.get('file') as File | null;
  const rawContent = formData.get('content') as string | null;

  if (file) {
    // ===== 模式 A：上传 .md 文件 → 处理图片 → 保存到 content/blog/ =====
    let content: string;
    try {
      content = await file.text();
    } catch {
      throw createError({ statusCode: 400, message: '无法读取文件内容' });
    }

    const baseName = getSafeFilename(formData);
    const processResult = await processMarkdownImages(content, imgBedConfig);

    // 写入 content/blog/
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

  if (rawContent) {
    // ===== 模式 B：接收 Markdown 字符串 → 处理图片 → 返回内容（不保存） =====
    if (!rawContent.trim()) {
      throw createError({ statusCode: 400, message: '未提供 Markdown 内容' });
    }

    const result = await processMarkdownImages(rawContent, imgBedConfig);
    return result;
  }

  throw createError({ statusCode: 400, message: '请提供 file（上传模式）或 content（处理模式）' });
});

// 从 FormData 中提取并校验安全文件名
function getSafeFilename(formData: FormData): string {
  const rawFilename = (formData.get('filename') as string) || '';
  const baseName = rawFilename.replace(/\.md$/i, '');

  if (!SAFE_FILENAME.test(baseName)) {
    throw createError({
      statusCode: 400,
      message: '文件名只能包含字母、数字、短横线和下划线',
    });
  }

  return baseName || 'untitled';
}
