export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith("/admin")) return;

  // 仅后台页面触发：未登录跳转登录页，非管理员返回首页。
  const { loggedIn, user, fetch } = useUserSession();
  if (!loggedIn.value) {
    await fetch();
  }

  if (!loggedIn.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  if (user.value?.role !== "admin") {
    return navigateTo("/");
  }
});
