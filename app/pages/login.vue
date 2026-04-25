<script setup lang="ts">
useHead({ title: "登录 - TY's Blog" });

const route = useRoute();
const { loggedIn, fetch } = useUserSession();
const toast = useToast();

const username = ref("");
const password = ref("");
const pending = ref(false);

await fetch();
if (loggedIn.value) {
  await navigateTo("/");
}

async function submitLogin() {
  if (pending.value) return;
  pending.value = true;

  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: {
        username: username.value,
        password: password.value,
      },
    });

    await fetch();
    toast.success("登录成功", "欢迎回来");
    const redirectPath = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await navigateTo(redirectPath);
  } catch (error: any) {
    toast.error("登录失败", error?.data?.message || error?.message || "请检查账号密码");
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="admin-page login-page">
    <header class="admin-header">
      <p class="eyebrow">SIGN IN</p>
      <h1>登录系统</h1>
      <p class="admin-subtitle">使用本地账号密码登录。第三方登录稍后可按需接入。</p>
    </header>

    <main class="admin-main">
      <section class="admin-panel login-panel">
        <div class="form-group">
          <label for="username">用户名</label>
          <input id="username" v-model.trim="username" type="text" class="form-input" autocomplete="username">
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input id="password" v-model="password" type="password" class="form-input" autocomplete="current-password">
        </div>

        <button type="button" class="btn btn-primary" :disabled="pending" @click="submitLogin">
          {{ pending ? "登录中..." : "登录" }}
        </button>
      </section>
    </main>
  </div>
</template>

<style scoped>
.login-page {
  max-width: 560px;
}

.login-panel {
  display: grid;
  gap: 0.8rem;
}
</style>
