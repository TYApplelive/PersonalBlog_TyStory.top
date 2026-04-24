/**
 * 博客文章列表 API (server/api/blog/posts.get.ts)
 *
 * 请求方式：GET /api/blog/posts
 * 返回：列表 DTO（title, date, excerpt, readTime, tags, path）
 */

import { queryCollection } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  const docs = await queryCollection(event, 'blog')
    .order('date', 'DESC')
    .all()

  // 映射为列表 DTO，只返回前端需要的字段
  return docs.map(doc => ({
    title: doc.title ?? '',
    date: doc.date ?? '',
    excerpt: doc.excerpt ?? '',
    readTime: doc.readTime ?? '',
    tags: doc.tags ?? [],
    path: doc.path ?? '',
  }))
})
