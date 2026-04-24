/**
 * 单篇博客文章 API (server/api/blog/[slug].get.ts)
 *
 * 请求方式：GET /api/blog/:slug
 * 返回：queryCollection 查询到的完整 blog 文档对象
 */

import { queryCollection } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) return null

  // 拼出目标 path，如 /blog/nuxt-guide
  const targetPath = `/blog/${slug}`
  const doc = await queryCollection(event, 'blog')
    .path(targetPath)
    .first()

  return doc ?? null
})
