/**
 * POST /api/admin/users/create — 创建新用户
 *
 * 请求体：{ username, displayName, password, role? }
 * 响应：创建的用户记录
 */
import { requireAdminSession } from "@serverUtils/auth";
import { createUser } from "@serverUtils/auth-db";

export default defineEventHandler(async (event) => {
  await requireAdminSession(event);

  const body = await readBody(event);
  const { username, displayName, password, role } = body || {};

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: "用户名和密码为必填项",
    });
  }

  // 验证角色
  const validRoles = ["admin", "user"];
  const userRole = validRoles.includes(role) ? role : "user";

  console.log(`[Users API] 创建用户: ${username}, 角色: ${userRole}`);

  try {
    const user = await createUser(username, displayName || username, password, userRole);
    return { success: true, user };
  } catch (error: any) {
    console.error(`[Users API] 创建用户失败:`, error.message);
    throw createError({
      statusCode: 400,
      message: error.message || "创建用户失败",
    });
  }
});
