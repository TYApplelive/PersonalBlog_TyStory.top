export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith("/admin")) return;

  // 每次导航都向服务器校验 session，防止过期缓存导致 401
  const { loggedIn, user, fetch } = useUserSession();
  await fetch();

  if (!loggedIn.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }

  if (user.value?.role !== "admin") {
    return navigateTo("/");
  }
});
