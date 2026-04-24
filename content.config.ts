/**
 * Nuxt Content 配置 (content.config.ts)
 *
 * 耦合关系：
 *   - content/blog/*.md → 博客 Markdown 文件
 *   - app/pages/blog/[id].vue → 博客详情页（手动查询渲染）
 */

import { defineContentConfig, defineCollection } from '@nuxt/content';

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
    }),
  },
});
