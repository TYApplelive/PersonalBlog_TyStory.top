/**
 * Nuxt Content 配置文件
 *
 * 关联文件:
 *   - content/blog/*.md → 博客文章源文件
 *   - server/api/blog/posts.get.ts → 列表 API
 *   - server/api/blog/[slug].get.ts → 详情 API
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
        excerpt: z.string(),
        readTime: z.string(),
        tags: z.array(z.string()).optional(),
      }),
    }),
  },
});
