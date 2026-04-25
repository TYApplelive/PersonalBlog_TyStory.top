import { getUserById } from "@serverUtils/auth-db";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const sessionUser = session?.user;

  if (!sessionUser) {
    return {
      loggedIn: false,
      user: null,
      session: null,
    };
  }

  // 以数据库为准返回最新角色和登录时间。
  const dbUser = await getUserById(String(sessionUser.id || ""));
  return {
    loggedIn: true,
    user: dbUser
      ? {
          id: dbUser.id,
          username: dbUser.username,
          displayName: dbUser.displayName,
          role: dbUser.role,
          lastLoginAt: dbUser.lastLoginAt,
        }
      : sessionUser,
    session: {
      loggedInAt: String(session.loggedInAt || ""),
    },
  };
});
