/**
 * 页面级登录校验：仅要求已登录，不要求管理员。
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, fetch } = useUserSession();
  // 每次导航都向服务器校验 session
  await fetch();

  if (!loggedIn.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
