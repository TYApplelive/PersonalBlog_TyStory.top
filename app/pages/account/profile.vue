<script setup lang="ts">
/**
 * 用户信息 (account/profile.vue)
 *
 * 耦合关系：
 *   - middleware/require-login：登录守卫中间件
 *   - useUserSession：获取当前用户基础信息（账号、名称、角色）
 *   - /api/auth/me：服务端接口，返回用户详情（ID、账号、最近登录时间）
 *
 * 函数表：
 *   无自定义函数，仅使用组合式 API
 */
definePageMeta({
  middleware: "require-login",
});

useHead({ title: "用户信息 - TY's Blog" });

const { user } = useUserSession();
const { data: profile } = await useFetch<{
  loggedIn: boolean;
  user: {
    id: string;
    username: string;
    displayName: string;
    lastLoginAt?: string;
  } | null;
}>("/api/auth/me");
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">PROFILE</p>
      <h1>用户信息</h1>
      <p class="admin-subtitle">展示当前登录账号在系统中的公开信息。</p>
    </header>

    <main class="admin-main">
      <section class="admin-panel profile-wrap">
        <div class="profile-avatar">{{ (user?.displayName || user?.username || "U").slice(0, 1).toUpperCase() }}</div>
        <div class="profile-meta">
          <h2>{{ user?.displayName || "-" }}</h2>
          <p>@{{ user?.username || "-" }}</p>
          <span class="tag-badge">{{ user?.role || "user" }}</span>
        </div>
      </section>

      <section class="admin-panel">
        <h2>详情</h2>
        <table class="data-table">
          <tbody>
            <tr><td>用户 ID</td><td>{{ profile?.user?.id || "-" }}</td></tr>
            <tr><td>账号</td><td>@{{ profile?.user?.username || "-" }}</td></tr>
            <tr><td>最近登录</td><td>{{ profile?.user?.lastLoginAt || "-" }}</td></tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</template>

<style scoped>
.profile-wrap {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-avatar {
  width: 4.2rem;
  height: 4.2rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(183, 140, 77, 0.3);
  color: var(--film-paper);
  font-size: 1.25rem;
  font-weight: 700;
}

.profile-meta h2 {
  margin: 0;
}

.profile-meta p {
  margin: 0.2rem 0 0.5rem;
  color: var(--film-paper-soft);
}
</style>
