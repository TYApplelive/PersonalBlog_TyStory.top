/**
 * PATCH /api/admin/users/[id] — 更新用户信息
 *
 * 请求体：{ displayName?, role?, password? }
 * 响应：更新后的用户记录
 */
import { requireAdminSession } from "@serverUtils/auth";
import { updateUser } from "@serverUtils/auth-db";

export default defineEventHandler(async (event) => {
  await requireAdminSession(event);

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "缺少用户 ID" });
  }

  const body = await readBody(event);
  const { displayName, role, password } = body || {};

  // 验证角色
  if (role && !["admin", "user"].includes(role)) {
    throw createError({ statusCode: 400, message: "无效的角色，支持 admin 或 user" });
  }

  console.log(`[Users API] 更新用户 ID:${id}`);

  const user = await updateUser(id, { displayName, role, password });
  if (!user) {
    console.warn(`[Users API] 用户不存在: ID:${id}`);
    throw createError({ statusCode: 404, message: "用户不存在" });
  }

  console.log(`[Users API] 用户更新成功: ID:${id}`);
  return { success: true, user };
});
