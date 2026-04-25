/**
 * 用户认证动作（退出、切换账号）统一封装，避免页面和布局直接耦合实现细节。
 */
export function useAuthActions() {
  const { clear } = useUserSession();

  async function logout(redirectTo = "/") {
    await clear();
    await navigateTo(redirectTo);
  }

  async function switchAccount() {
    await clear();
    await navigateTo("/login");
  }

  return {
    logout,
    switchAccount,
  };
}
