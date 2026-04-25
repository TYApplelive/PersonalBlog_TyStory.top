import { authenticateLocalUser } from "@serverUtils/auth-db";

interface LoginBody {
  username: string;
  password: string;
}

const ATTEMPT_LIMIT = 8;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; expiresAt: number }>();

function getClientKey(event: Parameters<typeof getRequestIP>[0]) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
  return `ip:${ip}`;
}

function registerFailedAttempt(key: string) {
  const now = Date.now();
  const state = loginAttempts.get(key);
  if (!state || state.expiresAt <= now) {
    loginAttempts.set(key, { count: 1, expiresAt: now + ATTEMPT_WINDOW_MS });
    return;
  }
  state.count += 1;
  loginAttempts.set(key, state);
}

function clearAttempts(key: string) {
  loginAttempts.delete(key);
}

function isBlocked(key: string) {
  const now = Date.now();
  const state = loginAttempts.get(key);
  if (!state) return false;
  if (state.expiresAt <= now) {
    loginAttempts.delete(key);
    return false;
  }
  return state.count >= ATTEMPT_LIMIT;
}

export default defineEventHandler(async (event) => {
  const clientKey = getClientKey(event);
  if (isBlocked(clientKey)) {
    throw createError({ statusCode: 429, message: "登录尝试过多，请稍后再试" });
  }

  const body = await readBody<LoginBody>(event);
  const username = String(body?.username || "");
  const password = String(body?.password || "");

  if (!username || !password) {
    throw createError({ statusCode: 400, message: "请输入用户名和密码" });
  }

  const user = await authenticateLocalUser(username, password);
  if (!user) {
    registerFailedAttempt(clientKey);
    throw createError({ statusCode: 401, message: "用户名或密码错误" });
  }
  clearAttempts(clientKey);

  await setUserSession(event, {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    },
    loggedInAt: new Date().toISOString(),
  });

  return { success: true, user };
});
