/**
 * 忘记密码 API (server/api/auth/forgot-password.post.ts)
 *
 * 接收邮箱，发送重置链接。无论邮箱是否存在都返回成功（防枚举）。
 */
import { findUserByEmail, setResetToken } from "@serverUtils/auth-db";
import { sendPasswordResetEmail, generateResetToken } from "@serverUtils/mail";

export default defineEventHandler(async (event) => {
  const { email } = await readBody(event) as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: "邮箱格式不正确" });
  }

  // 查找用户
  const user = await findUserByEmail(email);

  if (user) {
    // 生成 token，30 分钟过期
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    await setResetToken(user.id, token, expiresAt);

    console.log(`[Auth] 发送重置密码邮件 -> ${email}`);
    await sendPasswordResetEmail(email, token, event).catch((err) => {
      console.error("[Auth] 发送邮件失败:", err.message);
    });
  } else {
    console.log(`[Auth] 重置密码请求但邮箱未注册: ${email}`);
  }

  // 无论邮箱是否存在，都返回成功（防止枚举用户）
  return {
    success: true,
    message: "如果该邮箱已注册，你将收到密码重置邮件。",
  };
});
