import type { ImgBedConfig } from "#shared/utils/imgbed-config";

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<ImgBedConfig>>(event);
  return await saveServerImgBedConfig(body ?? {});
});
