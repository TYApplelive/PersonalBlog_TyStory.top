import { getServerImgBedConfig } from "../../utils/imgbed-config.server";

export default defineEventHandler(async () => {
  return await getServerImgBedConfig();
});
