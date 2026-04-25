/**
 * 保存文章 API (server/api/admin/save-post.post.ts)
 *
 * 用途：用户在页面手动输入文章内容 + 文件名，点击"保存"按钮后调用。
 * 请求：POST /api/admin/save-post  { filename, content }
 * 返回：{ success, path }
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { validateFilename } from '@serverUtils/filename-validator';

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

  return { success: true, path: `/blog/${baseName}` };
});
