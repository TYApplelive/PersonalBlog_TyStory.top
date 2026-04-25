const protectedApiPrefixes = ["/api/admin", "/api/process-markdown"];

export default defineEventHandler(async (event) => {
  const path = event.path || "";
  if (!protectedApiPrefixes.some((prefix) => path.startsWith(prefix))) return;

  // 统一保护后台 API：必须登录且角色为 admin。
  const session = await requireUserSession(event);
  if (session.user?.role !== "admin") {
    throw createError({ statusCode: 403, message: "需要管理员权限" });
  }
});
