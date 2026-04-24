/**
 * 保存文章 API (server/api/admin/save-post.post.ts)
 *
 * 耦合关系：
 *   - app/pages/admin/posts/new.vue → 手动填写模式「保存到博客」按钮调用
 *   - content/blog/*.md             → 写入目标文件
 *
 * 请求方式：POST /api/admin/save-post
 * 请求体：{ filename: string, content: string }
 * 返回：{ success: boolean, path: string }
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// 文件名合法性校验：只允许字母、数字、短横线、下划线
const SAFE_FILENAME = /^[a-zA-Z0-9_-]+$/;

export default defineEventHandler(async (event) => {
  const body = await readBody<{ filename: string; content: string }>(event);

  if (!body?.filename || !body?.content) {
    throw createError({ statusCode: 400, message: '缺少 filename 或 content' });
  }

  // 去掉可能的 .md 扩展名后再校验
  const baseName = body.filename.replace(/\.md$/i, '');

  if (!SAFE_FILENAME.test(baseName)) {
    throw createError({
      statusCode: 400,
      message: '文件名只能包含字母、数字、短横线和下划线',
    });
  }

  const filePath = join(process.cwd(), 'content', 'blog', `${baseName}.md`);

  try {
    await writeFile(filePath, body.content, 'utf-8');
  } catch (err: any) {
    throw createError({ statusCode: 500, message: `写入文件失败: ${err.message}` });
  }

  return { success: true, path: `/blog/${baseName}` };
});
