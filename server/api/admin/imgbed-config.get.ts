/**
 * 获取图床配置 API (server/api/admin/imgbed-config.get.ts)
 */

import { getServerImgBedConfig } from '@serverUtils/imgbed-config.server';

export default defineEventHandler(async () => {
  return await getServerImgBedConfig();
});
