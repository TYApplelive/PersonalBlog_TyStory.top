<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';

// 定义 API 响应接口
interface ProcessResponse {
    success: boolean;
    processedContent: string;
    totalImages: number;
    localImages: number;
    uploadedCount: number;
    skippedCount: number;
    failedCount: number;
    errors?: Array<{ path: string; error: string }>;
}

// Markdown 内容状态
const mdContent = ref('');
const originalContent = ref('');
const processedContent = ref('');
const extractedImages = ref<ExtractedImage[]>([]);
const isProcessing = ref(false);
const progress = ref(0);
const statusText = ref('');
const errors = ref<Array<{ path: string; error: string }>>([]);

// 图床配置（使用 ref 替代 computed 以支持异步）
const currentConfig = ref<ImgBedConfig>({ apiUrl: '', token: '' });

// 初始化配置
watchEffect(async () => {
    currentConfig.value = await getImgBedConfig();
});

const hasContent = computed(() => mdContent.value.length > 0);
const localImages = computed(() => getLocalImages(extractedImages.value));
const remoteImages = computed(() => extractedImages.value.filter(img => img.pathType === 'remote'));
const hasErrors = computed(() => errors.value.length > 0);
const hasUploadToken = computed(() => currentConfig.value.token.trim().length > 0);

function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
        console.log('[Markdown 处理器] 未选择文件');
        return;
    }

    console.log(`[Markdown 处理器] 开始读取文件: ${file.name}, 大小: ${(file.size / 1024).toFixed(2)} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = String(e.target?.result ?? '');
        mdContent.value = content;
        originalContent.value = content;
        processedContent.value = '';
        errors.value = [];
        progress.value = 0;
        statusText.value = '';

        // 提取图片并记录日志
        extractedImages.value = extractImages(content);
        console.log(`[Markdown 处理器] 文件读取完成，内容长度: ${content.length} 字符`);
        console.log(`[Markdown 处理器] 检测到图片总数: ${extractedImages.value.length}`);
        console.log(`[Markdown 处理器] 本地图片: ${getLocalImages(extractedImages.value).length} 张`);
        console.log(`[Markdown 处理器] 远程图片: ${extractedImages.value.filter(img => img.pathType === 'remote').length} 张`);
    };
    reader.readAsText(file);
}

async function startProcessing() {
    if (!mdContent.value) {
        console.log('[Markdown 处理器] 没有 Markdown 内容，无法处理');
        return;
    }

    if (!hasUploadToken.value) {
        console.warn('[Markdown 处理器] 图床 Token 未配置');
        statusText.value = '请先在图床管理中配置具备 upload 权限的 Token。';
        return;
    }

    console.log('========== [Markdown 处理器] 开始处理 ==========');
    console.log(`[Markdown 处理器] 图床 API: ${currentConfig.value.apiUrl}`);
    console.log(`[Markdown 处理器] Token 状态: ${hasUploadToken.value ? '已配置' : '未配置'}`);
    console.log(`[Markdown 处理器] 待处理本地图片: ${localImages.value.length} 张`);

    isProcessing.value = true;
    progress.value = 15;
    statusText.value = '正在处理 Markdown 图片...';
    errors.value = [];

    try {
        console.log('[Markdown 处理器] 正在调用 /api/process-markdown 接口...');

        const response = await $fetch<ProcessResponse>('/api/process-markdown', {
            method: 'POST',
            body: {
                content: mdContent.value,
                imgBedConfig: currentConfig.value,
            },
        });

        console.log('[Markdown 处理器] API 响应成功');
        console.log(`[Markdown 处理器] 处理结果:`, {
            success: response.success,
            总图片数: response.totalImages,
            本地图片数: response.localImages,
            上传成功: response.uploadedCount,
            跳过: response.skippedCount,
            失败: response.failedCount,
        });

        if (response.success) {
            processedContent.value = response.processedContent;
            errors.value = response.errors || [];
            statusText.value = response.uploadedCount > 0
                ? `成功上传 ${response.uploadedCount} 张图片。`
                : '没有需要处理的本地图片。';

            console.log(`[Markdown 处理器] 处理完成: ${statusText.value}`);
            if (response.errors && response.errors.length > 0) {
                console.warn('[Markdown 处理器] 处理错误:', response.errors);
            }
        }

        progress.value = 100;
        console.log('========== [Markdown 处理器] 处理流程结束 ==========');
    } catch (error: any) {
        console.error('[Markdown 处理器] 处理失败:', error);
        statusText.value = `处理失败：${error.message}`;
        progress.value = 0;
    } finally {
        isProcessing.value = false;
    }
}

function downloadProcessed() {
    const content = processedContent.value || mdContent.value;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'processed-article.md';
    anchor.click();
    URL.revokeObjectURL(url);
}

async function copyContent(content: string) {
    try {
        await navigator.clipboard.writeText(content);
        statusText.value = '已复制到剪贴板。';
    } catch {
        statusText.value = '复制失败。';
    }
}
</script>

<template>
    <div class="admin-wrapper">
        <header class="admin-header">
            <p class="eyebrow">MARKDOWN TOOL</p>
            <h1>Markdown 图片处理器</h1>
            <p class="admin-subtitle">上传 Markdown 文件，自动把本地图片上传到 CloudFlare ImgBed 并替换路径。</p>
        </header>

        <main class="admin-main">
            <section class="upload-section">
                <label class="upload-zone" :class="{ 'has-file': hasContent }">
                    <input type="file" accept=".md,.markdown" class="file-input" @change="handleFileUpload">
                    <span v-if="!hasContent">点击或拖拽上传 Markdown 文件</span>
                    <span v-else>文件已加载，可重新选择</span>
                </label>
            </section>

            <section class="config-section">
                <h2>当前图床配置</h2>
                <p><strong>API：</strong>{{ currentConfig.apiUrl }}</p>
                <p><strong>Token：</strong>{{ hasUploadToken ? '已配置' : '未配置' }}</p>
                <NuxtLink to="/admin/imgbed-manager" class="config-link">修改配置</NuxtLink>
            </section>

            <section v-if="hasContent" class="images-section">
                <h2>检测到的图片</h2>

                <div v-if="localImages.length > 0" class="image-list">
                    <h3>本地图片，需要上传</h3>
                    <div v-for="(img, index) in localImages" :key="index" class="image-item local">
                        <span class="image-path" :title="img.path">{{ img.path }}</span>
                        <span class="image-alt">{{ img.altText }}</span>
                    </div>
                </div>

                <div v-if="remoteImages.length > 0" class="image-list">
                    <h3>远程图片，跳过</h3>
                    <div v-for="(img, index) in remoteImages" :key="index" class="image-item remote">
                        <span class="image-path" :title="img.path">{{ img.path }}</span>
                    </div>
                </div>
            </section>

            <section v-if="hasContent" class="actions-section">
                <button class="btn btn-primary" :disabled="isProcessing || localImages.length === 0"
                    @click="startProcessing">
                    {{ isProcessing ? '处理中...' : `开始处理 ${localImages.length} 张本地图片` }}
                </button>
                <button v-if="processedContent" class="btn btn-secondary" @click="downloadProcessed">
                    下载处理后的 Markdown
                </button>
            </section>

            <section v-if="isProcessing || progress > 0 || statusText" class="progress-section">
                <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: `${progress}%` }" />
                </div>
                <p>{{ statusText }}</p>
            </section>

            <section v-if="hasErrors" class="errors-section">
                <h2>处理错误</h2>
                <ul>
                    <li v-for="(err, index) in errors" :key="index">
                        <code>{{ err.path }}</code>：{{ err.error }}
                    </li>
                </ul>
            </section>

            <section v-if="processedContent" class="preview-section">
                <article class="preview-panel">
                    <header>
                        <h2>原始内容</h2>
                        <button class="btn-small" @click="copyContent(originalContent)">复制</button>
                    </header>
                    <pre><code>{{ originalContent }}</code></pre>
                </article>

                <article class="preview-panel">
                    <header>
                        <h2>处理后内容</h2>
                        <button class="btn-small" @click="copyContent(processedContent)">复制</button>
                    </header>
                    <pre><code>{{ processedContent }}</code></pre>
                </article>
            </section>
        </main>
    </div>
</template>

<style scoped>
.admin-wrapper {
    max-width: 1180px;
    margin: 0 auto;
    padding: 2rem;
    color: var(--film-paper);
}

.admin-header {
    margin-bottom: 2rem;
}

.eyebrow {
    color: var(--film-gold-soft);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.22em;
}

.admin-header h1 {
    margin: 0.25rem 0 0.5rem;
    color: var(--film-gold);
    font-size: clamp(2rem, 5vw, 3rem);
}

.admin-subtitle,
.progress-section p {
    color: var(--film-paper-soft);
}

.admin-main {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.upload-zone,
.config-section,
.images-section,
.progress-section,
.errors-section,
.preview-panel {
    border: 1px solid rgba(183, 140, 77, 0.24);
    border-radius: 16px;
    background: rgba(242, 221, 175, 0.06);
}

.upload-zone {
    display: grid;
    place-items: center;
    min-height: 150px;
    border-style: dashed;
    cursor: pointer;
    color: var(--film-paper-soft);
}

.upload-zone:hover,
.upload-zone.has-file {
    border-color: var(--film-gold);
    color: var(--film-paper);
    background: rgba(183, 140, 77, 0.12);
}

.file-input {
    display: none;
}

.config-section,
.images-section,
.progress-section,
.errors-section {
    padding: 1.25rem;
}

.config-section h2,
.images-section h2,
.errors-section h2,
.preview-panel h2 {
    margin: 0 0 0.75rem;
    color: var(--film-gold-soft);
    font-size: 1.1rem;
}

.config-link {
    color: var(--film-gold);
    font-weight: 700;
}

.image-list {
    margin-top: 1rem;
}

.image-list h3 {
    margin: 0 0 0.5rem;
    color: var(--film-paper-soft);
    font-size: 0.95rem;
}

.image-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.6rem 0.8rem;
    margin-bottom: 0.35rem;
    border-radius: 10px;
    background: rgba(20, 12, 9, 0.32);
}

.image-item.local {
    border-left: 3px solid var(--film-accent-soft);
}

.image-item.remote {
    border-left: 3px solid var(--film-gold);
    opacity: 0.8;
}

.image-path {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: monospace;
}

.actions-section {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
}

.btn,
.btn-small {
    border: 1px solid rgba(183, 140, 77, 0.42);
    border-radius: 999px;
    background: rgba(242, 221, 175, 0.08);
    color: var(--film-paper);
    cursor: pointer;
    font-weight: 800;
}

.btn {
    padding: 0.78rem 1.35rem;
}

.btn-small {
    padding: 0.35rem 0.8rem;
}

.btn-primary {
    background: var(--film-accent);
}

.btn:hover:not(:disabled),
.btn-small:hover {
    background: rgba(183, 140, 77, 0.24);
}

.btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.progress-bar {
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(183, 140, 77, 0.24);
}

.progress-fill {
    height: 100%;
    background: var(--film-gold);
    transition: width 0.25s ease;
}

.errors-section {
    border-color: rgba(176, 58, 58, 0.5);
    background: rgba(123, 30, 30, 0.18);
}

.preview-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.preview-panel {
    overflow: hidden;
}

.preview-panel header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid rgba(183, 140, 77, 0.2);
}

.preview-panel pre {
    max-height: 420px;
    margin: 0;
    padding: 1rem;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--film-paper-soft);
}

@media (max-width: 760px) {
    .admin-wrapper {
        padding: 1rem;
    }

    .preview-section {
        grid-template-columns: 1fr;
    }

    .actions-section {
        flex-direction: column;
    }
}
</style>
