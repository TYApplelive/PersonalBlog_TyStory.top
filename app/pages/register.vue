<script setup lang="ts">
useHead({ title: "注册 - TY's Blog" });

const route = useRoute();
const { loggedIn, fetch } = useUserSession();
const toast = useToast();

const email = ref("");
const displayName = ref("");
const password = ref("");
const confirmPassword = ref("");
const pending = ref(false);

await fetch();
if (loggedIn.value) {
  await navigateTo("/");
}

async function submitRegister() {
  if (pending.value) return;

  // 前端验证
  if (!email.value || !password.value || !confirmPassword.value) {
    toast.error("验证错误", "请填写所有必填项");
    return;
  }
  if (password.value.length < 6) {
    toast.error("验证错误", "密码长度不能少于 6 位");
    return;
  }
  if (password.value !== confirmPassword.value) {
    toast.error("验证错误", "两次密码输入不一致");
    return;
  }

  pending.value = true;
  try {
    await $fetch("/api/auth/register", {
      method: "POST",
      body: {
        email: email.value,
        password: password.value,
        displayName: displayName.value.trim() || undefined,
      },
    });
    toast.success("注册成功", "请使用你的邮箱和密码登录");
    await navigateTo("/login");
  } catch (error: any) {
    toast.error("注册失败", error?.data?.statusMessage || error?.message || "请稍后重试");
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="admin-page login-page">
    <header class="admin-header">
      <p class="eyebrow">REGISTER</p>
      <h1>注册账号</h1>
      <p class="admin-subtitle">使用邮箱注册，注册后可参与评论等互动。</p>
    </header>

    <main class="admin-main">
      <section class="admin-panel">
        <form @submit.prevent="submitRegister" class="login-panel">
          <div class="form-group">
            <label for="email">邮箱 <span class="required">*</span></label>
            <input id="email" v-model.trim="email" type="email" class="form-input" autocomplete="email" placeholder="your@email.com">
          </div>

          <div class="form-group">
            <label for="displayName">显示名称</label>
            <input id="displayName" v-model.trim="displayName" type="text" class="form-input" placeholder="选填，默认为邮箱前缀">
          </div>

          <div class="form-group">
            <label for="password">密码 <span class="required">*</span></label>
            <input id="password" v-model="password" type="password" class="form-input" autocomplete="new-password" placeholder="至少 6 位">
          </div>

          <div class="form-group">
            <label for="confirmPassword">确认密码 <span class="required">*</span></label>
            <input id="confirmPassword" v-model="confirmPassword" type="password" class="form-input" autocomplete="new-password" placeholder="再次输入密码">
          </div>

          <button type="submit" class="btn btn-primary" :disabled="pending">
            {{ pending ? "注册中..." : "注册" }}
          </button>
        </form>

        <p class="switch-link">
          已有账号？<NuxtLink to="/login">登录</NuxtLink>
        </p>
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

.required {
  color: #e07a7a;
}

.switch-link {
  text-align: center;
  margin-top: 1rem;
  color: var(--film-paper-soft);
  font-size: 0.9rem;
}

.switch-link a {
  color: var(--film-gold);
  text-decoration: underline;
}
</style>
