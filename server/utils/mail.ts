/**
 * 邮件发送工具 (server/utils/mail.ts)
 *
 * 基于 Resend API 发送邮件。
 * 无需额外依赖，直接使用 fetch 调用 Resend REST API。
 *
 * 耦合关系：
 *   - nuxt.config.ts runtimeConfig.resendApiKey
 *   - .env RESEND_API_KEY
 */
import { randomBytes } from "node:crypto";
import type { H3Event } from "h3";

const RESEND_API = "https://api.resend.com/emails";

interface ResendPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
}

/**
 * 调用 Resend API 发送邮件
 */
async function sendEmail(payload: ResendPayload): Promise<void> {
  const config = useRuntimeConfig();
  const apiKey = config.resendApiKey as string;

  if (!apiKey) {
    console.warn("[Mail] RESEND_API_KEY 未配置，跳过发信");
    return;
  }

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Resend API 错误 (${res.status}): ${errBody}`);
  }

  console.log(`[Mail] 邮件发送成功 -> ${payload.to}`);
}

/**
 * 生成密码重置链接并发送邮件
 * @param to 收件人邮箱
 * @param token 重置 token
 * @param event 可选 H3 事件对象，用于构造正确的基础 URL
 */
export async function sendPasswordResetEmail(to: string, token: string, event?: H3Event): Promise<void> {
  const baseUrl = getBaseUrl(event);
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  await sendEmail({
    from: "TY's Blog <noreply@email.tystory.top>",
    to,
    subject: "密码重置 - TY's Blog",
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:sans-serif;">
        <h2 style="color:#b78c4d;">密码重置</h2>
        <p>你好，</p>
        <p>我们收到了你的密码重置请求。请点击下方按钮设置新密码：</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#b78c4d;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">
          重置密码
        </a>
        <p style="color:#888;font-size:0.85rem;">链接有效期为 30 分钟。如果你没有请求重置密码，请忽略此邮件。</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#aaa;font-size:0.8rem;">TY's Blog</p>
      </div>
    `,
  });
}

/**
 * 生成加密随机 token
 */
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * 获取站点基础 URL
 */
function getBaseUrl(event?: H3Event): string {
  if (event) {
    const host = getRequestHeader(event, "host");
    if (host) {
      const proto = getRequestHeader(event, "x-forwarded-proto") || "http";
      return `${proto}://${host}`;
    }
  }
  return "http://localhost:3000";
}
