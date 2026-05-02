/**
 * 单张图片上传 API (server/api/admin/upload-image.post.ts)
 *
 * 接受 multipart/form-data 中的 file（图片），上传到图床，返回 URL。
 */

import { uploadToImgBed } from '@serverUtils/image-upload';
import { getServerImgBedConfig } from '@serverUtils/imgbed-config.server';

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);
  if (!form?.length) {
    throw createError({ statusCode: 400, message: '未收到文件' });
  }

  const filePart = form.find((p) => p.name === 'file');
  if (!filePart?.data || !filePart.filename) {
    throw createError({ statusCode: 400, message: '缺少 file 字段' });
  }

  const config = await getServerImgBedConfig();
  if (!config.token) {
    throw createError({ statusCode: 500, message: '图床未配置 token' });
  }

  const result = await uploadToImgBed(
    Buffer.from(filePart.data),
    filePart.filename,
    config,
  );

  if (!result.success) {
    throw createError({ statusCode: 502, message: result.error || '上传失败' });
  }

  return { success: true, url: result.url };
});
