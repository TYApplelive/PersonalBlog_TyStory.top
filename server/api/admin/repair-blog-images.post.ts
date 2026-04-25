/**
 * 批量修复博客图片 API (server/api/admin/repair-blog-images.post.ts)
 *
 * 请求方式：POST /api/admin/repair-blog-images
 * 返回：FixResult
 */

import { getServerImgBedConfig } from '@serverUtils/imgbed-config.server';
import { fixAllPosts } from '@serverUtils/image-fixer';

export default defineEventHandler(async () => {
  const imgBedConfig = await getServerImgBedConfig();
  if (!imgBedConfig.apiUrl || !imgBedConfig.token) {
    throw createError({ statusCode: 400, message: 'Img bed API URL and token are required' });
  }

  return await fixAllPosts(imgBedConfig);
});
