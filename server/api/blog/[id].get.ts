/**
 * 单篇博客文章 API (server/api/blog/[id].get.ts)
 *
 * 耦合关系：
 *   - app/utils/blog-content.ts → 调用 getBlogPostById
 *
 * 请求方式：GET /api/blog/:id
 * 返回：BlogContentPost | null
 */

import { getBlogPostById } from "~/utils/blog-content";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isFinite(id)) return null;
  return getBlogPostById(id);
});
