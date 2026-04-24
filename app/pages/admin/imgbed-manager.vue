<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

interface TestResult {
    success: boolean;
    message: string;
    imageUrl?: string;
}

const config = ref<ImgBedConfig>({ apiUrl: '', token: '' });
const showToken = ref(false);
const isTestingRandom = ref(false);
const isTestingToken = ref(false);
const randomResult = ref<TestResult | null>(null);
const tokenResult = ref<TestResult | null>(null);
const saveMessage = ref('');

const normalizedApiUrl = computed(() => normalizeImgBedBaseUrl(config.value.apiUrl));
const hasToken = computed(() => config.value.token.trim().length > 0);

onMounted(() => {
    config.value = getImgBedConfig();
});

function showTemporaryMessage(message: string) {
    saveMessage.value = message;
    setTimeout(() => {
        saveMessage.value = '';
    }, 3000);
}

function validateApiUrl(): boolean {
    if (!config.value.apiUrl.trim()) {
        randomResult.value = { success: false, message: '请先填写图床 API 地址。' };
        return false;
    }

    try {
        new URL(normalizedApiUrl.value);
        return true;
    } catch {
        randomResult.value = { success: false, message: 'API 地址格式不正确。' };
        return false;
    }
}

/**
 * Random image endpoint is public in CloudFlare ImgBed docs.
 * Use <img> loading instead of fetch to avoid CORS false negatives.
 */
function testRandomImage() {
    if (!validateApiUrl()) return;

    console.log('[图床管理] 开始测试随机图接口');
    console.log(`[图床管理] API 地址: ${config.value.apiUrl}`);

    isTestingRandom.value = true;
    randomResult.value = null;

    const imageUrl = buildImgBedUrl(config.value.apiUrl, '/random', {
        type: 'img',
        orientation: 'auto',
        t: Date.now(),
    });

    console.log(`[图床管理] 请求 URL: ${imageUrl}`);

    const image = new Image();
    image.onload = () => {
        console.log('[图床管理] 随机图加载成功');
        randomResult.value = {
            success: true,
            message: '随机图接口可用；该接口不需要 Token。',
            imageUrl,
        };
        isTestingRandom.value = false;
    };
    image.onerror = () => {
        console.error('[图床管理] 随机图加载失败');
        randomResult.value = {
            success: false,
            message: '随机图加载失败。请检查 API 地址、图床是否有图片、随机图功能是否开启。',
        };
        isTestingRandom.value = false;
    };
    image.src = imageUrl;
}

async function testManageToken() {
    if (!validateApiUrl()) return;

    if (!hasToken.value) {
        console.warn('[图床管理] Token 未配置，无法测试管理接口');
        tokenResult.value = { success: false, message: '管理接口测试需要 Token。' };
        return;
    }

    console.log('[图床管理] 开始测试 Token');
    console.log(`[图床管理] API 地址: ${config.value.apiUrl}`);
    console.log(`[图床管理] Token 长度: ${config.value.token.length}`);

    isTestingToken.value = true;
    tokenResult.value = null;

    try {
        const testUrl = buildImgBedUrl(config.value.apiUrl, '/api/manage/list', { count: 1 });
        console.log(`[图床管理] 测试 URL: ${testUrl}`);

        const response = await fetch(testUrl, {
            method: 'GET',
            headers: buildImgBedAuthHeaders(config.value.token),
        });

        console.log(`[图床管理] 响应状态: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('[图床管理] Token 测试成功');
        tokenResult.value = {
            success: true,
            message: 'Token 可用，至少具备 list 权限。',
        };
    } catch (error: any) {
        console.error('[图床管理] Token 测试失败:', error.message);
        tokenResult.value = {
            success: false,
            message: `Token 测试失败：${error.message}`,
        };
    } finally {
        isTestingToken.value = false;
    }
}

function saveConfig() {
    if (!config.value.apiUrl.trim()) {
        console.error('[图床管理] 保存失败: API 地址为空');
        showTemporaryMessage('错误：API 地址不能为空。');
        return;
    }

    console.log('[图床管理] 保存配置');
    console.log(`[图床管理] API 地址: ${config.value.apiUrl}`);
    console.log(`[图床管理] Token 长度: ${config.value.token.length}`);

    saveImgBedConfig({
        apiUrl: normalizedApiUrl.value,
        token: config.value.token.trim(),
    });
    config.value = getImgBedConfig();
    console.log('[图床管理] 配置已保存到 localStorage');
    showTemporaryMessage('配置已保存。');
}

function resetConfig() {
    console.log('[图床管理] 重置配置');
    resetImgBedConfig();
    config.value = getImgBedConfig();
    randomResult.value = null;
    tokenResult.value = null;
    console.log('[图床管理] 已重置为默认配置');
    showTemporaryMessage('已重置为默认配置。');
}
</script>

<template>
    <div class="manager-wrapper">
        <header class="manager-header">
            <p class="eyebrow">CF IMG BED</p>
            <h1>图床管理</h1>
            <p class="manager-subtitle">
                配置 CloudFlare ImgBed。随机图测试不带 Token；上传、列表、删除等管理接口才需要 Token。
            </p>
        </header>

        <main class="manager-main">
            <section class="panel config-section">
                <h2>基础配置</h2>

                <label class="form-group" for="api-url">
                    <span>API 地址</span>
                    <input id="api-url" v-model="config.apiUrl" type="url" placeholder="https://ty-imgbed.pages.dev"
                        class="form-input">
                    <small>填写图床根地址，不要带末尾斜杠。</small>
                </label>

                <label class="form-group" for="token">
                    <span>API Token</span>
                    <div class="token-input-wrapper">
                        <input id="token" v-model="config.token" :type="showToken ? 'text' : 'password'"
                            placeholder="imgbed_xxx..." class="form-input token-input">
                        <button type="button" class="toggle-visibility"
                            :aria-label="showToken ? '隐藏 Token' : '显示 Token'" @click="showToken = !showToken">
                            {{ showToken ? '隐藏' : '显示' }}
                        </button>
                    </div>
                    <small>上传需要 upload 权限；列表需要 list 权限；删除需要 delete 权限。</small>
                </label>
            </section>

            <section class="actions-section">
                <button class="btn btn-test" :disabled="isTestingRandom" @click="testRandomImage">
                    {{ isTestingRandom ? '测试随机图中...' : '测试随机图' }}
                </button>
                <button class="btn btn-save" :disabled="isTestingToken" @click="testManageToken">
                    {{ isTestingToken ? '测试 Token 中...' : '测试 Token' }}
                </button>
                <button class="btn btn-save" @click="saveConfig">
                    保存配置
                </button>
                <button class="btn btn-reset" @click="resetConfig">
                    重置
                </button>
            </section>

            <section v-if="randomResult" class="result-section"
                :class="{ success: randomResult.success, error: !randomResult.success }">
                <h3>{{ randomResult.success ? '随机图测试成功' : '随机图测试失败' }}</h3>
                <p>{{ randomResult.message }}</p>
                <img v-if="randomResult.success && randomResult.imageUrl" :src="randomResult.imageUrl" alt="随机图预览"
                    class="preview-image">
            </section>

            <section v-if="tokenResult" class="result-section"
                :class="{ success: tokenResult.success, error: !tokenResult.success }">
                <h3>{{ tokenResult.success ? 'Token 测试成功' : 'Token 测试失败' }}</h3>
                <p>{{ tokenResult.message }}</p>
            </section>

            <p v-if="saveMessage" class="save-message">{{ saveMessage }}</p>

            <section class="panel docs-section">
                <h2>接口用法</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>端点</th>
                            <th>方法</th>
                            <th>认证</th>
                            <th>说明</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>/random?type=img</code></td>
                            <td>GET</td>
                            <td>不需要</td>
                            <td>直接返回随机图片，可用于连接测试。</td>
                        </tr>
                        <tr>
                            <td><code>/upload?returnFormat=full</code></td>
                            <td>POST</td>
                            <td>upload Token</td>
                            <td>multipart/form-data，字段名为 <code>file</code>。</td>
                        </tr>
                        <tr>
                            <td><code>/api/manage/list</code></td>
                            <td>GET</td>
                            <td>list Token</td>
                            <td>读取图片列表，也可用来测试 Token。</td>
                        </tr>
                        <tr>
                            <td><code>/api/manage/delete/{path}</code></td>
                            <td>DELETE</td>
                            <td>delete Token</td>
                            <td>按路径删除文件或文件夹。</td>
                        </tr>
                    </tbody>
                </table>
                <p class="docs-hint">
                    管理接口 Header：<code>Authorization: Bearer {{ hasToken ? '你的 Token' : 'YOUR_API_TOKEN' }}</code>
                </p>
            </section>
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
    text-shadow: 0 2px 10px rgba(183, 140, 77, 0.28);
}

.manager-subtitle,
.form-group small,
.docs-hint {
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

.form-input:focus {
    outline: none;
    border-color: var(--film-gold);
    box-shadow: 0 0 0 3px rgba(183, 140, 77, 0.16);
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
    transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.toggle-visibility {
    padding: 0.5rem 1rem;
    background: rgba(183, 140, 77, 0.16);
    color: var(--film-paper);
    white-space: nowrap;
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
    letter-spacing: 0.06em;
}

.btn:hover:not(:disabled),
.toggle-visibility:hover {
    transform: translateY(-1px);
    background: rgba(183, 140, 77, 0.24);
}

.btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.btn-test {
    background: var(--film-accent);
}

.btn-reset {
    color: var(--film-paper-soft);
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

.result-section h3 {
    margin: 0 0 0.5rem;
}

.preview-image {
    display: block;
    max-width: 100%;
    max-height: 320px;
    margin-top: 1rem;
    border-radius: 12px;
    border: 1px solid rgba(183, 140, 77, 0.4);
}

.save-message {
    text-align: center;
    background: rgba(183, 140, 77, 0.16);
}

.api-table {
    width: 100%;
    border-collapse: collapse;
    color: var(--film-paper);
}

.api-table th,
.api-table td {
    padding: 0.8rem;
    text-align: left;
    border-bottom: 1px solid rgba(183, 140, 77, 0.2);
    vertical-align: top;
}

.api-table th {
    color: var(--film-gold-soft);
    background: rgba(183, 140, 77, 0.12);
}

.api-table code,
.docs-hint code {
    padding: 0.12rem 0.35rem;
    border-radius: 4px;
    background: rgba(183, 140, 77, 0.18);
    color: var(--film-gold-soft);
}

@media (max-width: 640px) {
    .manager-wrapper {
        padding: 1rem;
    }

    .token-input-wrapper,
    .actions-section {
        flex-direction: column;
    }

    .api-table {
        display: block;
        overflow-x: auto;
        font-size: 0.85rem;
    }
}
</style>
