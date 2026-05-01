<script setup lang="ts">
useHead({ title: "重置密码 - TY's Blog" });

const route = useRoute();
const toast = useToast();

const token = route.query.token as string;
const password = ref("");
const confirmPassword = ref("");
const pending = ref(false);
const success = ref(false);
const errorMsg = ref("");

// token 为空时报错
if (!token) {
  errorMsg.value = "缺少重置令牌，请重新申请密码重置。";
}

async function submitReset() {
  if (pending.value || !token) return;

  if (!password.value || !confirmPassword.value) {
    toast.error("验证错误", "请填写密码");
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
    await $fetch("/api/auth/reset-password", {
      method: "POST",
      body: { token, password: password.value },
    });
    success.value = true;
    toast.success("重置成功", "密码已重置，请使用新密码登录");
  } catch (error: any) {
    errorMsg.value = error?.data?.statusMessage || error?.message || "重置失败，请重新申请";
    toast.error("重置失败", errorMsg.value);
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="admin-page login-page">
    <header class="admin-header">
      <p class="eyebrow">RESET PASSWORD</p>
      <h1>重置密码</h1>
      <p class="admin-subtitle">请输入你的新密码。</p>
    </header>

    <main class="admin-main">
      <section class="admin-panel">
        <!-- token 无效 -->
        <div v-if="errorMsg && !success" class="error-message">
          <p>{{ errorMsg }}</p>
          <NuxtLink to="/forgot-password" class="btn btn-primary" style="display:inline-block;margin-top:1rem;">重新申请</NuxtLink>
        </div>

        <!-- 重置成功 -->
        <div v-else-if="success" class="success-message">
          <div class="success-icon">✓</div>
          <p>密码已重置成功！</p>
          <NuxtLink to="/login" class="btn btn-primary" style="display:inline-block;margin-top:1rem;">去登录</NuxtLink>
        </div>

        <!-- 表单 -->
        <form v-else @submit.prevent="submitReset" class="login-panel">
          <div class="form-group">
            <label for="password">新密码</label>
            <input id="password" v-model="password" type="password" class="form-input" autocomplete="new-password" placeholder="至少 6 位">
          </div>

          <div class="form-group">
            <label for="confirmPassword">确认密码</label>
            <input id="confirmPassword" v-model="confirmPassword" type="password" class="form-input" autocomplete="new-password" placeholder="再次输入新密码">
          </div>

          <button type="submit" class="btn btn-primary" :disabled="pending">
            {{ pending ? "重置中..." : "重置密码" }}
          </button>
        </form>
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

.success-message, .error-message {
  text-align: center;
  padding: 1.5rem;
}

.error-message p {
  color: #e07a7a;
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
</style>
