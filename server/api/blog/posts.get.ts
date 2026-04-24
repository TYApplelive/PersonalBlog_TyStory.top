/**
 * 博客文章列表 API (server/api/blog/posts.get.ts)
 *
 * 耦合关系：
 *   - app/utils/blog-content.ts → 调用 getAllBlogPosts
 *
 * 请求方式：GET /api/blog/posts
 * 返回：BlogContentPost[]
 */

import { getAllBlogPosts } from "~/utils/blog-content";

export default defineEventHandler(async () => {
  return getAllBlogPosts();
});
