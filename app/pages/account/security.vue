<script setup lang="ts">
/**
 * 安全与会话 (account/security.vue)
 *
 * 耦合关系：
 *   - middleware/require-login：登录守卫中间件
 *   - useUserSession：获取当前会话信息
 *   - useAuthActions：提供 logout / switchAccount 操作方法
 *
 * 函数表：
 *   - onSwitchAccount：切换账号，调用 switchAccount 并管理加载状态
 *   - onLogout：退出登录，调用 logout("/") 并管理加载状态
 */
definePageMeta({
  middleware: "require-login",
});

useHead({ title: "安全与会话 - TY's Blog" });

const { session } = useUserSession();
const { logout, switchAccount } = useAuthActions();

const isBusy = ref(false);

async function onSwitchAccount() {
  isBusy.value = true;
  try {
    await switchAccount();
  } finally {
    isBusy.value = false;
  }
}

async function onLogout() {
  isBusy.value = true;
  try {
    await logout("/");
  } finally {
    isBusy.value = false;
  }
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">SECURITY</p>
      <h1>安全与会话</h1>
      <p class="admin-subtitle">你可以在这里执行切换账号、退出登录等会话操作。</p>
    </header>

    <main class="admin-main">
      <section class="admin-panel">
        <h2>当前会话</h2>
        <table class="data-table">
          <tbody>
            <tr><td>登录时间</td><td>{{ session?.loggedInAt || "-" }}</td></tr>
            <tr><td>来源</td><td>本地账号密码登录</td></tr>
          </tbody>
        </table>
      </section>

      <section class="admin-panel action-list">
        <button type="button" class="btn" :disabled="isBusy" @click="onSwitchAccount">切换账号</button>
        <button type="button" class="btn" :disabled="isBusy" @click="onLogout">退出登录</button>
      </section>
    </main>
  </div>
</template>

<style scoped>
.action-list {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
}
</style>
