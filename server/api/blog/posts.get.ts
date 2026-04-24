/**
 * 博客文章列表 API (server/api/blog/posts.get.ts)
 *
 * 耦合关系：
 *   - @nuxt/content/server         → queryCollection 查询 blog 集合
 *   - content.config.ts            → blog collection 定义
 *   - server/utils/auto-image-fix.ts → ensureArticleImagesFixed 自动修复本地图片
 *   - server/utils/imgbed-config.server.ts → getServerImgBedConfig 图床配置
 *   - app/pages/blog/index.vue     → 前端通过 useFetch 调用此 API
 *   - app/pages/admin/posts.vue    → 管理后台文章列表调用此 API
 *
 * 请求方式：GET /api/blog/posts
 * 返回：{ title, date, description, readTime, tags, path }[]
 *
 * 自动修复：加载时检查每篇文章的本地图片，缺失则上传图床并替换路径。
 */

import { queryCollection } from '@nuxt/content/server';
import { resolve } from 'node:path';
import { ensureArticleImagesFixed, type ImageFixResult } from '@serverUtils/auto-image-fix';
import { createModuleLogger } from '#shared/utils/logger';

const log = createModuleLogger('postsAPI');

export default defineEventHandler(async (event) => {
  log.separator('开始获取博客列表');

  // 步骤①：从 Nuxt Content 查询所有文章
  log.info('正在查询 blog 集合...');
  const docs = await queryCollection(event, 'blog')
    .order('date', 'DESC')
    .all();
  log.info(`查询到 ${docs.length} 篇文章`);

  // 步骤②：获取图床配置
  log.info('获取图床配置...');
  const imgBedConfig = await getServerImgBedConfig();
  log.debug(`图床地址: ${imgBedConfig.apiUrl}`);
  log.debug(`Token 长度: ${imgBedConfig.token?.length || 0}`);

  // 步骤③：对每篇文章启动后台自动修复
  const contentDir = resolve(process.cwd(), 'content');
  let fixTaskCount = 0;

  for (const doc of docs) {
    // doc.path 是路由路径（如 /blog/nuxt-guide），不是文件路径
    // doc.stem 是文件 stem（如 blog/1.nuxt-guide），拼接 .md 即为真实文件
    const stem = (doc as any).stem;
    if (!stem) {
      log.warn(`跳过（无 stem）: ${doc.title}`);
      continue;
    }

    const filePath = resolve(contentDir, `${stem}.md`);
    fixTaskCount++;

    log.info(`启动自动修复任务 #${fixTaskCount}: "${doc.title}"`);
    log.debug(`stem=${stem} → ${filePath}`);

    ensureArticleImagesFixed(filePath, imgBedConfig).then((result: ImageFixResult) => {
      if (result.fixed || result.errors.length > 0) {
        log.info(
          `修复结果 [${doc.title}]: ` +
          `本地${result.totalLocal}张 | 上传${result.uploaded}张 | 本地引用${result.localRefed}张` +
          (result.errors.length ? ` | 错误${result.errors.length}` : ''),
        );
      } else {
        log.debug(`无需修复 [${doc.title}]`);
      }
    }).catch((err: unknown) => {
      log.error(`修复任务异常 [${doc.title}]: ${(err as Error)?.message}`);
    });
  }

  // 步骤④：立即返回列表数据（图片修复在后台进行）
  log.info(`返回 ${docs.length} 篇文章列表数据（${fixTaskCount} 个修复任务已在后台运行）`);
  log.separator('列表请求结束');

  return docs.map(doc => ({
    title: doc.title ?? '',
    date: doc.date ?? '',
    description: doc.description ?? '',
    readTime: doc.readTime ?? '',
    tags: doc.tags ?? [],
    path: doc.path ?? '',
  }));
});
