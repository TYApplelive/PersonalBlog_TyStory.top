/**
 * 删除文章 API (server/api/admin/posts/[slug].delete.ts)
 *
 * 请求：DELETE /api/admin/posts/:slug
 * 返回：{ success, deletedPath }
 */

import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { queryCollection } from '@nuxt/content/server';
import { validateFilename } from '@serverUtils/filename-validator';
import { createModuleLogger } from '#shared/utils/logger';
import { requireAdminSession } from '@serverUtils/auth';

const log = createModuleLogger('deletePost');

export default defineEventHandler(async (event) => {
  await requireAdminSession(event);

  const slug = getRouterParam(event, 'slug');
  if (!slug) {
    throw createError({ statusCode: 400, message: '缺少文章 slug' });
  }

  const decodedSlug = decodeURIComponent(slug);
  const safeSlug = validateFilename(decodedSlug);
  const targetPath = `/blog/${safeSlug}`;

  // 先按 content path 精确定位文档，再删除真实源文件，避免 slug 与文件名不一致导致删不掉。
  const doc = await queryCollection(event, 'blog')
    .path(targetPath)
    .first();
  if (!doc?.stem) {
    throw createError({ statusCode: 404, message: `文章不存在: ${safeSlug}` });
  }

  const filePath = resolve(process.cwd(), 'content', `${doc.stem}.md`);
  log.info(`删除文章: ${filePath}`);

  try {
    await unlink(filePath);
    log.info(`删除成功: ${doc.stem}.md`);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      throw createError({ statusCode: 404, message: `源文件不存在: ${doc.stem}.md` });
    }
    throw createError({ statusCode: 500, message: `删除失败: ${err.message}` });
  }

  return { success: true, deletedPath: targetPath };
});
