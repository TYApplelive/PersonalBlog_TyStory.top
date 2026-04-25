/**
 * 博客文章列表 API (server/api/blog/posts.get.ts)
 *
 * 请求方式：GET /api/blog/posts
 * 返回：{ title, date, description, readTime, tags, path, stem }[]
 */

import { queryCollection } from '@nuxt/content/server';
import { createModuleLogger } from '#shared/utils/logger';

const log = createModuleLogger('postsAPI');

export default defineEventHandler(async (event) => {
  log.info('查询 blog 集合...');

  const docs = await queryCollection(event, 'blog')
    .order('date', 'DESC')
    .all();

  log.info(`返回 ${docs.length} 篇文章`);

  return docs.map((doc: any) => ({
    title: doc.title ?? '',
    date: doc.date ?? '',
    description: doc.description ?? '',
    readTime: doc.readTime ?? '',
    tags: doc.tags ?? [],
    path: doc.path ?? '',
    stem: doc.stem ?? '',
  }));
});
