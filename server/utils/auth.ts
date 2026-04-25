export type BlogUserRole = "admin" | "user";

export interface AuthSessionUser {
  id: string;
  username: string;
  displayName: string;
  role: BlogUserRole;
}

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export async function requireAdminSession(event: Parameters<typeof requireUserSession>[0]) {
  const session = await requireUserSession(event);
  if (session.user?.role !== "admin") {
    throw createError({ statusCode: 403, message: "需要管理员权限" });
  }
  return session;
}
