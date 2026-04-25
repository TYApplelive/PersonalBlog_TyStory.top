/**
 * 保存图床配置 API (server/api/admin/imgbed-config.post.ts)
 */

import type { ImgBedConfig } from '#shared/utils/imgbed-config';
import { saveServerImgBedConfig } from '@serverUtils/imgbed-config.server';

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<ImgBedConfig>>(event);
  return await saveServerImgBedConfig(body ?? {});
});
