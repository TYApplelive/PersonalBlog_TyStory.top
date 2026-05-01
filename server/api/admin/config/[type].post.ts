/**
 * POST /api/admin/config/[type] — 保存指定类型的配置
 *
 * 请求体为完整的配置 JSON 对象
 */
import { writeConfig, type ConfigType } from "@serverUtils/config-persistence";

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

  const body = await readBody(event);

  if (!body || typeof body !== "object") {
    throw createError({
      statusCode: 400,
      message: "请求体必须为有效的 JSON 对象",
    });
  }

  console.log(`[Config API] POST 请求: ${type}`);
  await writeConfig(type, body);

  return { success: true, type };
});
