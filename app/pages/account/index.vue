<script setup lang="ts">
/**
 * 用户中心 (account/index.vue)
 *
 * 耦合关系：
 *   - middleware/require-login：登录守卫中间件
 *   - useUserSession：获取当前用户与会话信息
 *
 * 函数表：
 *   - quickItems：计算属性，生成快捷入口导航列表
 */
definePageMeta({
  middleware: "require-login",
});

useHead({ title: "用户中心 - TY's Blog" });

const { user, session } = useUserSession();

const quickItems = computed(() => [
  { to: "/account/profile", title: "用户信息", desc: "查看账号基础资料与角色信息" },
  { to: "/account/security", title: "安全与会话", desc: "查看当前登录会话，执行切换或退出" },
]);
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">ACCOUNT CENTER</p>
      <h1>用户中心</h1>
      <p class="admin-subtitle">这里集中管理个人资料和登录会话。</p>
    </header>

    <main class="admin-main">
      <section class="admin-panel">
        <h2>当前身份</h2>
        <table class="data-table">
          <tbody>
            <tr><td>用户名</td><td>{{ user?.displayName || "-" }}</td></tr>
            <tr><td>账号</td><td>@{{ user?.username || "-" }}</td></tr>
            <tr><td>角色</td><td><span class="tag-badge">{{ user?.role || "user" }}</span></td></tr>
            <tr><td>登录时间</td><td>{{ session?.loggedInAt || "-" }}</td></tr>
          </tbody>
        </table>
      </section>

      <section class="admin-panel">
        <h2>快捷入口</h2>
        <div class="quick-grid">
          <NuxtLink v-for="item in quickItems" :key="item.to" :to="item.to" class="quick-card">
            <strong>{{ item.title }}</strong>
            <small>{{ item.desc }}</small>
          </NuxtLink>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.quick-card {
  display: grid;
  gap: 0.3rem;
  border: 1px solid rgba(183, 140, 77, 0.25);
  border-radius: 12px;
  padding: 0.95rem;
  background: rgba(242, 221, 175, 0.05);
}

.quick-card strong {
  color: var(--film-paper);
}

.quick-card small {
  color: var(--film-paper-soft);
}

@media (max-width: 680px) {
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
