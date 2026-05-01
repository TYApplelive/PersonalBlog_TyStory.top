<script setup lang="ts">
useHead({ title: "忘记密码 - TY's Blog" });

const toast = useToast();

const email = ref("");
const submitted = ref(false);
const pending = ref(false);

async function submitForgot() {
  if (pending.value) return;

  if (!email.value) {
    toast.error("验证错误", "请输入邮箱地址");
    return;
  }

  pending.value = true;
  try {
    await $fetch("/api/auth/forgot-password", {
      method: "POST",
      body: { email: email.value },
    });
    submitted.value = true;
  } catch (error: any) {
    toast.error("请求失败", error?.data?.statusMessage || error?.message || "请稍后重试");
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="admin-page login-page">
    <header class="admin-header">
      <p class="eyebrow">FORGOT PASSWORD</p>
      <h1>找回密码</h1>
      <p class="admin-subtitle">输入注册邮箱，我们将发送重置密码链接。</p>
    </header>

    <main class="admin-main">
      <section class="admin-panel">
        <!-- 已提交 -->
        <div v-if="submitted" class="success-message">
          <div class="success-icon">✓</div>
          <p>如果该邮箱已注册，你将收到密码重置邮件。</p>
          <p class="hint">请检查你的收件箱（包括垃圾邮件），链接有效期为 30 分钟。</p>
          <NuxtLink to="/login" class="btn btn-primary" style="display:inline-block;margin-top:1rem;">返回登录</NuxtLink>
        </div>

        <!-- 表单 -->
        <form v-else @submit.prevent="submitForgot" class="login-panel">
          <div class="form-group">
            <label for="email">注册邮箱</label>
            <input id="email" v-model.trim="email" type="email" class="form-input" autocomplete="email" placeholder="your@email.com">
          </div>

          <button type="submit" class="btn btn-primary" :disabled="pending">
            {{ pending ? "发送中..." : "发送重置链接" }}
          </button>
        </form>

        <p v-if="!submitted" class="switch-link">
          <NuxtLink to="/login">返回登录</NuxtLink>
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

.success-message {
  text-align: center;
  padding: 1.5rem;
}

.success-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(183, 140, 77, 0.3);
  color: var(--film-gold);
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  margin: 0 auto 1rem;
}

.hint {
  color: var(--film-paper-soft);
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
</style>
