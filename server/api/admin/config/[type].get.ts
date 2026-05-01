/**
 * GET /api/admin/config/[type] — 读取指定类型的配置
 *
 * 支持的类型：site | navigation | footer | blog | system | imgbed
 * 返回配置 JSON 或 null（文件不存在时）
 */
import { readConfig, type ConfigType } from "@serverUtils/config-persistence";

const VALID_TYPES = new Set<string>(["site", "navigation", "footer", "blog", "system", "imgbed"]);

export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, "type") as ConfigType | undefined;

  if (!type || !VALID_TYPES.has(type)) {
    console.warn(`[Config API] 无效的配置类型: ${type}`);
    throw createError({
      statusCode: 400,
      message: `无效的配置类型: ${type}，支持: ${[...VALID_TYPES].join(", ")}`,
    });
  }

  console.log(`[Config API] GET 请求: ${type}`);
  const data = await readConfig(type);

  if (data === null) {
    console.warn(`[Config API] 配置 ${type}.json 不存在`);
    throw createError({
      statusCode: 404,
      message: `配置 ${type}.json 不存在`,
    });
  }

  return data;
});
