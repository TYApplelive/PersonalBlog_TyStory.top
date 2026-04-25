<script setup lang="ts">
/**
 * 图床管理页 (admin/imgbed-manager.vue)
 *
 * 耦合关系：
 *   - shared/utils/imgbed-config.ts → 导入 ImgBedConfig 类型及所有配置操作函数
 *     - getImgBedConfig()    → 加载服务端图床配置
 *     - saveImgBedConfig()   → 保存图床配置到服务端
 *     - resetImgBedConfig()  → 重置图床配置为默认值
 *     - buildImgBedUrl()     → 拼接图床 API 请求 URL
 *     - buildImgBedAuthHeaders() → 构建 Token 认证请求头
 *     - normalizeImgBedBaseUrl() → 规范化 API 基础 URL
 *
 * 函数表：
 *   - validateApiUrl()     → 校验 API URL 格式
 *   - testRandomImage()    → 测试随机图片接口连通性
 *   - testManageToken()    → 测试 Token 对管理接口的鉴权有效性
 *   - saveConfig()         → 保存当前配置到服务端
 *   - resetConfig()        → 重置配置并刷新页面数据
 *   - showTemporaryMessage() → 显示 3 秒临时提示消息
 */
import type { ImgBedConfig } from "#shared/utils/imgbed-config";
import {
  buildImgBedAuthHeaders,
  buildImgBedUrl,
  getImgBedConfig,
  normalizeImgBedBaseUrl,
  resetImgBedConfig,
  saveImgBedConfig,
} from "#shared/utils/imgbed-config";

interface TestResult {
  success: boolean;
  message: string;
  imageUrl?: string;
}

const config = ref<ImgBedConfig>({ apiUrl: "", token: "" });
const showToken = ref(false);
const isTestingRandom = ref(false);
const isTestingToken = ref(false);
const isSaving = ref(false);
const randomResult = ref<TestResult | null>(null);
const tokenResult = ref<TestResult | null>(null);
const saveMessage = ref("");

const normalizedApiUrl = computed(() => normalizeImgBedBaseUrl(config.value.apiUrl));
const hasToken = computed(() => config.value.token.trim().length > 0);

const { data: loadedConfig, refresh } = await useAsyncData("imgbed-config-manager", () => getImgBedConfig());

watch(
  loadedConfig,
  (value) => {
    if (value) config.value = value;
  },
  { immediate: true },
);

function showTemporaryMessage(message: string) {
  saveMessage.value = message;
  setTimeout(() => {
    saveMessage.value = "";
  }, 3000);
}

function validateApiUrl(): boolean {
  if (!config.value.apiUrl.trim()) {
    randomResult.value = { success: false, message: "Please fill in the API URL first." };
    return false;
  }

  try {
    new URL(normalizedApiUrl.value);
    return true;
  } catch {
    randomResult.value = { success: false, message: "Invalid API URL." };
    return false;
  }
}

function testRandomImage() {
  if (!validateApiUrl()) return;

  isTestingRandom.value = true;
  randomResult.value = null;

  const imageUrl = buildImgBedUrl(config.value.apiUrl, "/random", {
    type: "img",
    orientation: "auto",
    t: Date.now(),
  });

  const image = new Image();
  image.onload = () => {
    randomResult.value = {
      success: true,
      message: "Random image endpoint is reachable. This endpoint does not require a token.",
      imageUrl,
    };
    isTestingRandom.value = false;
  };
  image.onerror = () => {
    randomResult.value = {
      success: false,
      message: "Random image request failed.",
    };
    isTestingRandom.value = false;
  };
  image.src = imageUrl;
}

async function testManageToken() {
  if (!validateApiUrl()) return;

  if (!hasToken.value) {
    tokenResult.value = { success: false, message: "A token is required to test management APIs." };
    return;
  }

  isTestingToken.value = true;
  tokenResult.value = null;

  try {
    const response = await fetch(buildImgBedUrl(config.value.apiUrl, "/api/manage/list", { count: 1 }), {
      method: "GET",
      headers: buildImgBedAuthHeaders(config.value.token),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    tokenResult.value = {
      success: true,
      message: "Token works for management APIs.",
    };
  } catch (error: any) {
    tokenResult.value = {
      success: false,
      message: error?.message || "Token test failed.",
    };
  } finally {
    isTestingToken.value = false;
  }
}

async function saveConfig() {
  if (!config.value.apiUrl.trim()) {
    showTemporaryMessage("API URL is required.");
    return;
  }

  isSaving.value = true;
  await saveImgBedConfig({
    apiUrl: normalizedApiUrl.value,
    token: config.value.token.trim(),
  });
  await refresh();
  isSaving.value = false;
  showTemporaryMessage("Config saved.");
}

async function resetConfig() {
  await resetImgBedConfig();
  await refresh();
  randomResult.value = null;
  tokenResult.value = null;
  showTemporaryMessage("Config reset to default.");
}
</script>

<template>
  <div class="manager-wrapper">
    <header class="manager-header">
      <p class="eyebrow">CF IMG BED</p>
      <h1>图床管理</h1>
      <p class="manager-subtitle">
        图床配置现在保存在服务端，可同时给文章补修接口和上传页面使用。
      </p>
    </header>

    <main class="manager-main">
      <section class="panel config-section">
        <h2>基础配置</h2>

        <label class="form-group" for="api-url">
          <span>API URL</span>
          <input id="api-url" v-model="config.apiUrl" type="url" class="form-input">
          <small>Use the img bed base URL without trailing slash.</small>
        </label>

        <label class="form-group" for="token">
          <span>API Token</span>
          <div class="token-input-wrapper">
            <input
              id="token"
              v-model="config.token"
              :type="showToken ? 'text' : 'password'"
              class="form-input token-input"
            >
            <button type="button" class="toggle-visibility" @click="showToken = !showToken">
              {{ showToken ? "Hide" : "Show" }}
            </button>
          </div>
          <small>Upload and repair flows require a valid upload token.</small>
        </label>
      </section>

      <section class="actions-section">
        <button class="btn btn-test" :disabled="isTestingRandom" @click="testRandomImage">
          {{ isTestingRandom ? "Testing..." : "Test Random Image" }}
        </button>
        <button class="btn btn-save" :disabled="isTestingToken" @click="testManageToken">
          {{ isTestingToken ? "Testing Token..." : "Test Token" }}
        </button>
        <button class="btn btn-save" :disabled="isSaving" @click="saveConfig">
          {{ isSaving ? "Saving..." : "Save Config" }}
        </button>
        <button class="btn btn-reset" @click="resetConfig">Reset</button>
      </section>

      <section v-if="randomResult" class="result-section" :class="{ success: randomResult.success, error: !randomResult.success }">
        <h3>{{ randomResult.success ? "Random image test passed" : "Random image test failed" }}</h3>
        <p>{{ randomResult.message }}</p>
        <img v-if="randomResult.imageUrl && randomResult.success" :src="randomResult.imageUrl" alt="Random preview" class="preview-image">
      </section>

      <section v-if="tokenResult" class="result-section" :class="{ success: tokenResult.success, error: !tokenResult.success }">
        <h3>{{ tokenResult.success ? "Token test passed" : "Token test failed" }}</h3>
        <p>{{ tokenResult.message }}</p>
      </section>

      <p v-if="saveMessage" class="save-message">{{ saveMessage }}</p>
    </main>
  </div>
</template>

<style scoped>
.manager-wrapper {
  max-width: 880px;
  margin: 0 auto;
  padding: 2rem;
  color: var(--film-paper);
}

.manager-header {
  margin-bottom: 2rem;
}

.eyebrow {
  color: var(--film-gold-soft);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.22em;
}

.manager-header h1 {
  font-size: clamp(2rem, 5vw, 3.2rem);
  color: var(--film-gold);
  margin: 0.25rem 0 0.5rem;
}

.manager-subtitle,
.form-group small {
  color: var(--film-paper-soft);
}

.manager-main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.panel {
  padding: 1.5rem;
  border: 1px solid rgba(183, 140, 77, 0.24);
  border-radius: 16px;
  background: rgba(242, 221, 175, 0.06);
}

.panel h2 {
  margin: 0 0 1.25rem;
  color: var(--film-gold-soft);
  font-size: 1.25rem;
}

.form-group {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1.2rem;
  font-weight: 700;
}

.form-input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid rgba(183, 140, 77, 0.4);
  border-radius: 10px;
  background: rgba(20, 12, 9, 0.5);
  color: var(--film-paper);
}

.token-input-wrapper {
  display: flex;
  gap: 0.75rem;
}

.token-input {
  flex: 1;
}

.toggle-visibility,
.btn {
  border: 1px solid rgba(183, 140, 77, 0.42);
  border-radius: 999px;
  cursor: pointer;
}

.toggle-visibility {
  padding: 0.5rem 1rem;
  background: rgba(183, 140, 77, 0.16);
  color: var(--film-paper);
}

.actions-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.btn {
  padding: 0.78rem 1.35rem;
  background: rgba(242, 221, 175, 0.08);
  color: var(--film-paper);
  font-weight: 800;
}

.btn-test {
  background: var(--film-accent);
}

.result-section,
.save-message {
  padding: 1rem;
  border-radius: 14px;
}

.result-section.success {
  border: 1px solid rgba(102, 187, 106, 0.45);
  background: rgba(76, 175, 80, 0.16);
}

.result-section.error {
  border: 1px solid rgba(176, 58, 58, 0.55);
  background: rgba(123, 30, 30, 0.2);
}

.preview-image {
  display: block;
  max-width: 100%;
  max-height: 320px;
  margin-top: 1rem;
  border-radius: 12px;
}

.save-message {
  text-align: center;
  background: rgba(183, 140, 77, 0.16);
}

@media (max-width: 640px) {
  .manager-wrapper {
    padding: 1rem;
  }

  .token-input-wrapper,
  .actions-section {
    flex-direction: column;
  }
}
</style>
