/**
 * DELETE /api/admin/users/[id] — 删除用户
 *
 * 响应：{ success: true }
 * 注意：不能删除自己
 */
import { requireAdminSession } from "@serverUtils/auth";
import { deleteUser, getUserById } from "@serverUtils/auth-db";

export default defineEventHandler(async (event) => {
  const session = await requireAdminSession(event);

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "缺少用户 ID" });
  }

  // 防止删除自己
  if (session.user?.id === id) {
    throw createError({ statusCode: 403, message: "不能删除自己的账号" });
  }

  // 检查目标用户是否存在
  const targetUser = await getUserById(id);
  if (!targetUser) {
    throw createError({ statusCode: 404, message: "用户不存在" });
  }

  console.log(`[Users API] 删除用户 ID:${id}, 用户名:${targetUser.username}`);

  const success = await deleteUser(id);
  if (!success) {
    console.error(`[Users API] 删除用户失败: ID:${id}`);
    throw createError({ statusCode: 500, message: "删除用户失败" });
  }

  console.log(`[Users API] 用户删除成功: ID:${id}`);
  return { success: true };
});
