/**
 * 用户注册 API (server/api/auth/register.post.ts)
 *
 * 接收邮箱+密码，创建新用户（role="user"）。
 */
import { registerUser } from "@serverUtils/auth-db";

export default defineEventHandler(async (event) => {
  const { email, password, displayName } = await readBody(event) as {
    email?: string;
    password?: string;
    displayName?: string;
  };

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: "邮箱和密码为必填项" });
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: "密码长度不能少于 6 位" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: "邮箱格式不正确" });
  }

  try {
    const user = await registerUser(email, password, displayName);
    console.log(`[Auth] 新用户注册: ${user.email} (ID:${user.id})`);
    return { success: true };
  } catch (error: any) {
    console.error("[Auth] 注册失败:", error.message);
    throw createError({ statusCode: 400, statusMessage: error.message || "注册失败" });
  }
});
