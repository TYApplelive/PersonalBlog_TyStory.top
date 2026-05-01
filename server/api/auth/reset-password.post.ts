/**
 * 重置密码 API (server/api/auth/reset-password.post.ts)
 *
 * 接收 token + 新密码，验证后更新密码。
 */
import { getUserByResetToken, clearResetToken, updatePassword } from "@serverUtils/auth-db";

export default defineEventHandler(async (event) => {
  const { token, password } = await readBody(event) as {
    token?: string;
    password?: string;
  };

  if (!token || !password) {
    throw createError({ statusCode: 400, statusMessage: "参数不完整" });
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: "密码长度不能少于 6 位" });
  }

  // 验证 token
  const user = await getUserByResetToken(token);
  if (!user) {
    console.warn("[Auth] 重置密码失败：token 无效或已过期");
    throw createError({ statusCode: 400, statusMessage: "重置链接无效或已过期，请重新申请" });
  }

  // 更新密码并清除 token
  await updatePassword(user.id, password);
  await clearResetToken(user.id);

  console.log(`[Auth] 密码重置成功: ${user.email} (ID:${user.id})`);
  return { success: true, message: "密码已重置，请使用新密码登录。" };
});
