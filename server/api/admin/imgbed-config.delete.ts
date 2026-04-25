/**
 * 重置图床配置 API (server/api/admin/imgbed-config.delete.ts)
 */

import { resetServerImgBedConfig } from '@serverUtils/imgbed-config.server';

export default defineEventHandler(async () => {
  return await resetServerImgBedConfig();
});
