import { resetServerImgBedConfig } from "../../utils/imgbed-config.server";

export default defineEventHandler(async () => {
  return await resetServerImgBedConfig();
});
