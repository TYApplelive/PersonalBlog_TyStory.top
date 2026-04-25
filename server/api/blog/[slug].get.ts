/**
 * 单篇博客文章 API (server/api/blog/[slug].get.ts)
 *
 * 耦合关系：
 *   - @nuxt/content/server         → queryCollection 按 path 查询 blog 集合
 *   - content.config.ts            → blog collection 定义
 *   - app/pages/blog/[slug].vue    → 前端通过 useFetch 调用此 API
 *
 * 请求方式：GET /api/blog/:slug
 * 返回：queryCollection 查询到的完整 blog 文档对象
 */

import { queryCollection } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  const slug = decodeURIComponent(getRouterParam(event, 'slug') ?? '')
  if (!slug) return null

  // 拼出目标 path，如 /blog/nuxt-guide
  const targetPath = `/blog/${slug}`
  const doc = await queryCollection(event, 'blog')
    .path(targetPath)
    .first()

  return doc ?? null
})
