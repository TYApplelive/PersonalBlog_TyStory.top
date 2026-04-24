/**
 * Nuxt Content 配置文件 (content.config.ts)
 *
 * 耦合关系：
 *   - @nuxt/content                   → defineContentConfig / defineCollection
 *   - content/blog/*.md               → blog 集合的数据源
 *   - server/api/blog/posts.get.ts    → queryCollection 查询 blog 集合
 *   - server/api/blog/[slug].get.ts   → queryCollection 按 path 查询 blog 集合
 *   - app/pages/blog/[slug].vue       → ContentRenderer 渲染 blog 文档
 */

import { defineContentConfig, defineCollection } from '@nuxt/content';
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string(),
        date: z.string(),
        description: z.string(),
        readTime: z.string(),
        tags: z.array(z.string()).optional(),
      }),
    }),
  },
});
