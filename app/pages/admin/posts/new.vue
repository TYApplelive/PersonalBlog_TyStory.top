<script setup lang="ts">
/**
 * Single-save upload flow:
 * load markdown -> process image refs -> save markdown.
 */
import type { ImgBedConfig } from "#shared/utils/imgbed-config";
import { getImgBedConfig } from "#shared/utils/imgbed-config";
import { extractImages, getLocalImages } from "#shared/utils/markdown-parser";

useHead({ title: "New Post - TY's Blog" });

interface ProcessResponse {
  success: boolean;
  processedContent: string;
  totalImages: number;
  localImages: number;
  processedCount: number;
  uploadedCount: number;
  skippedCount: number;
  failedCount: number;
  errors?: Array<{ path: string; error: string }>;
}

interface SaveResponse {
  success: boolean;
  path: string;
}

const toast = useToast();

const selectedFile = ref<File | null>(null);
const draftContent = ref("");
const processedContent = ref("");
const customFilename = ref("");
const isDragging = ref(false);
const isSaving = ref(false);
const progress = ref(0);
const processedImages = ref(0);
const totalProcessImages = ref(0);
const statusText = ref("");
const savePath = ref("");
const errors = ref<Array<{ path: string; error: string }>>([]);
const currentConfig = ref<ImgBedConfig>({ apiUrl: "", token: "" });
let progressTimer: ReturnType<typeof setInterval> | null = null;

const { data: loadedConfig } = await useAsyncData("imgbed-config-post-create", () => getImgBedConfig());

watch(
  loadedConfig,
  (value) => {
    if (value) currentConfig.value = value;
  },
  { immediate: true },
);

const extractedImages = computed(() => extractImages(draftContent.value));
const localImages = computed(() => getLocalImages(extractedImages.value));
const remoteImages = computed(() => extractedImages.value.filter((item) => item.pathType === "remote"));
const outputContent = computed(() => processedContent.value || draftContent.value);
const resolvedFilename = computed(() => {
  if (customFilename.value.trim()) return customFilename.value.trim();
  return selectedFile.value?.name.replace(/\.(md|markdown)$/i, "") || "";
});
const canSave = computed(() => Boolean(selectedFile.value && draftContent.value && resolvedFilename.value && !isSaving.value));
const progressLabel = computed(() => `${processedImages.value}/${totalProcessImages.value}`);

function resetResultState() {
  processedContent.value = "";
  savePath.value = "";
  errors.value = [];
  progress.value = 0;
  processedImages.value = 0;
  totalProcessImages.value = 0;
  statusText.value = "";
}

function stopProgressTimer() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

function startFakeProgress(total: number) {
  stopProgressTimer();
  if (total <= 1) return;

  progressTimer = setInterval(() => {
    if (processedImages.value < total - 1) {
      processedImages.value += 1;
      progress.value = Math.min(80, 10 + Math.round((processedImages.value / total) * 70));
    }
  }, 350);
}

function loadMarkdownFile(file: File) {
  if (!/\.(md|markdown)$/i.test(file.name)) {
    toast.error("Invalid file", "Please choose a .md or .markdown file");
    return;
  }

  selectedFile.value = file;
  if (!customFilename.value) {
    customFilename.value = file.name.replace(/\.(md|markdown)$/i, "");
  }

  const reader = new FileReader();
  reader.onload = () => {
    draftContent.value = String(reader.result ?? "");
    resetResultState();
  };
  reader.readAsText(file, "utf-8");
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  isDragging.value = true;
}

function onDragLeave() {
  isDragging.value = false;
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) loadMarkdownFile(file);
}

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) loadMarkdownFile(file);
}

async function savePost() {
  if (!canSave.value) return;

  isSaving.value = true;
  errors.value = [];
  processedContent.value = "";
  savePath.value = "";
  totalProcessImages.value = localImages.value.length;
  processedImages.value = 0;
  progress.value = totalProcessImages.value ? 10 : 30;
  statusText.value = totalProcessImages.value
    ? "Processing markdown images before save..."
    : "No local image found. Saving markdown...";

  if (totalProcessImages.value) {
    startFakeProgress(totalProcessImages.value);
  }

  try {
    const processResult = await $fetch<ProcessResponse>("/api/process-markdown", {
      method: "POST",
      body: {
        content: draftContent.value,
      },
    });

    stopProgressTimer();
    processedContent.value = processResult.processedContent;
    errors.value = processResult.errors || [];
    processedImages.value = processResult.processedCount;
    progress.value = 85;
    statusText.value = `Image process finished (${processResult.processedCount}/${processResult.localImages}). Writing markdown...`;

    const saveResult = await $fetch<SaveResponse>("/api/admin/save-post", {
      method: "POST",
      body: {
        filename: resolvedFilename.value,
        content: processResult.processedContent,
      },
    });

    savePath.value = saveResult.path;
    progress.value = 100;
    statusText.value = `Saved to ${saveResult.path}`;
    toast.success("Saved", statusText.value);
  } catch (error: any) {
    stopProgressTimer();
    statusText.value = error?.data?.message || error?.message || "Save failed";
    toast.error("Save failed", statusText.value);
  } finally {
    isSaving.value = false;
  }
}

</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">POST CREATOR</p>
      <h1>新建文章</h1>
      <p class="admin-subtitle">
        Drop a markdown file here. Save will process local image paths first, then write the final markdown into
        <code>content/blog/</code>.
      </p>
    </header>

    <main class="admin-main post-create-main">
      <section class="admin-panel post-create-hero">
        <div class="post-dropzone" :class="{ 'is-dragging': isDragging, 'has-file': selectedFile }"
          @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
          <input type="file" accept=".md,.markdown" class="post-file-input" @change="onFileSelect">

          <div v-if="!selectedFile" class="post-dropzone-copy">
            <span class="post-dropzone-icon">MD</span>
            <strong>Drop markdown here</strong>
            <p>Click the area if you want to select a file manually</p>
          </div>

          <div v-else class="post-dropzone-copy">
            <span class="post-dropzone-icon">OK</span>
            <strong>{{ selectedFile.name }}</strong>
            <p>{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
          </div>
        </div>

        <div class="post-create-side">
          <div class="form-group">
            <label>Target filename</label>
            <input v-model="customFilename" type="text" class="form-input">
            <p class="form-hint">Only letters, numbers, dash and underscore are allowed.</p>
          </div>

          <div class="post-create-config">
            <p><strong>ImgBed API:</strong> {{ currentConfig.apiUrl || "Not configured" }}</p>
            <p><strong>Token:</strong> {{ currentConfig.token ? "Configured" : "Missing" }}</p>
            <NuxtLink to="/admin/imgbed-manager" class="btn btn-secondary btn-sm">ImgBed Settings</NuxtLink>
          </div>

          <div class="post-create-actions">
            <button class="btn btn-primary" :disabled="!canSave" @click="savePost">
              {{ isSaving ? "Saving..." : "Save" }}
            </button>
          </div>

          <div v-if="savePath" class="post-save-result">
            <p><strong>Saved path:</strong> {{ savePath }}</p>
            <NuxtLink :to="savePath" class="btn btn-ghost btn-sm">Open Article</NuxtLink>
          </div>
        </div>
      </section>

      <section class="post-stats-grid">
        <article class="admin-panel post-stat-card">
          <strong>{{ extractedImages.length }}</strong>
          <span>Total Images</span>
        </article>
        <article class="admin-panel post-stat-card">
          <strong>{{ localImages.length }}</strong>
          <span>Local Images</span>
        </article>
        <article class="admin-panel post-stat-card">
          <strong>{{ remoteImages.length }}</strong>
          <span>Remote Images</span>
        </article>
        <article class="admin-panel post-stat-card">
          <strong>{{ resolvedFilename || "-" }}</strong>
          <span>Filename</span>
        </article>
      </section>

      <section v-if="statusText" class="admin-panel">
        <div class="progress-row">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }" />
          </div>
          <span class="progress-counter">{{ progressLabel }}</span>
        </div>
        <p class="post-status-text">{{ statusText }}</p>
      </section>

      <section class="post-preview-grid">
        <article class="admin-panel post-inspector">
          <header class="post-section-head">
            <div>
              <p class="eyebrow">IMAGE REPORT</p>
              <h2>Image References</h2>
            </div>
          </header>

          <div v-if="!draftContent" class="empty-state">
            <div class="empty-icon">IMG</div>
            <div class="empty-text">Waiting for markdown file</div>
          </div>

          <template v-else>
            <div class="post-image-block">
              <h3>Local images to upload</h3>
              <div v-if="localImages.length" class="post-image-list">
                <div v-for="item in localImages" :key="item.fullMatch" class="post-image-item local">
                  <strong>{{ item.altText || "No alt" }}</strong>
                  <code>{{ item.path }}</code>
                </div>
              </div>
              <p v-else class="post-image-empty">No local image needs processing.</p>
            </div>

            <div class="post-image-block">
              <h3>Remote images</h3>
              <div v-if="remoteImages.length" class="post-image-list">
                <div v-for="item in remoteImages" :key="item.fullMatch" class="post-image-item remote">
                  <strong>{{ item.altText || "No alt" }}</strong>
                  <code>{{ item.path }}</code>
                </div>
              </div>
              <p v-else class="post-image-empty">No remote image found.</p>
            </div>

            <div v-if="errors.length" class="post-errors">
              <h3>Process errors</h3>
              <div v-for="item in errors" :key="`${item.path}-${item.error}`" class="post-error-item">
                <code>{{ item.path }}</code>
                <span>{{ item.error }}</span>
              </div>
            </div>
          </template>
        </article>

        <article class="admin-panel post-inspector">
          <header class="post-section-head">
            <div>
              <p class="eyebrow">MARKDOWN PREVIEW</p>
              <h2>Output Preview</h2>
            </div>
          </header>

          <div v-if="!draftContent" class="empty-state">
            <div class="empty-icon">MD</div>
            <div class="empty-text">No markdown loaded yet</div>
          </div>

          <pre v-else class="post-content-preview">{{ outputContent }}</pre>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
code {
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: rgba(183, 140, 77, 0.15);
  color: var(--film-gold-soft);
  font-size: 0.9em;
}

.post-create-main {
  gap: 1rem;
}

.post-create-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(20rem, 0.85fr);
  gap: 1rem;
}

.post-dropzone {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 18rem;
  border: 2px dashed rgba(183, 140, 77, 0.34);
  border-radius: 22px;
  background:
    radial-gradient(circle at top, rgba(242, 221, 175, 0.14), transparent 58%),
    rgba(242, 221, 175, 0.05);
  transition: border-color 0.2s ease, background 0.2s ease;
  overflow: hidden;
}

.post-dropzone.is-dragging,
.post-dropzone.has-file {
  border-color: rgba(183, 140, 77, 0.7);
  background:
    radial-gradient(circle at top, rgba(242, 221, 175, 0.24), transparent 58%),
    rgba(242, 221, 175, 0.1);
}

.post-file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.post-dropzone-copy {
  display: grid;
  gap: 0.45rem;
  place-items: center;
  text-align: center;
  padding: 1rem;
  color: var(--film-paper);
  pointer-events: none;
}

.post-dropzone-copy strong {
  font-size: 1.2rem;
  color: var(--film-gold-soft);
}

.post-dropzone-copy p {
  margin: 0;
  color: var(--film-paper-soft);
}

.post-dropzone-icon {
  display: inline-grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  background: rgba(20, 12, 9, 0.45);
  color: var(--film-gold-soft);
  font-weight: 800;
}

.post-create-side {
  display: grid;
  gap: 1rem;
}

.post-create-config,
.post-save-result {
  display: grid;
  gap: 0.45rem;
  padding: 1rem;
  border: 1px solid rgba(183, 140, 77, 0.18);
  border-radius: 16px;
  background: rgba(242, 221, 175, 0.05);
  color: var(--film-paper-soft);
}

.post-create-config p,
.post-save-result p {
  margin: 0;
}

.post-create-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.post-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.post-stat-card {
  display: grid;
  gap: 0.35rem;
  justify-items: start;
}

.post-stat-card strong {
  color: var(--film-gold-soft);
  font-size: 1.6rem;
  line-height: 1;
}

.post-stat-card span {
  color: var(--film-paper-soft);
  font-size: 0.88rem;
}

.progress-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
}

.progress-counter,
.post-status-text {
  color: var(--film-paper-soft);
}

.post-status-text {
  margin: 0.75rem 0 0;
}

.post-preview-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 1rem;
}

.post-inspector {
  padding: 1rem;
}

.post-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.post-section-head h2 {
  margin: 0.35rem 0 0;
  color: var(--film-gold-soft);
  font-size: 1.3rem;
}

.post-image-block+.post-image-block,
.post-errors {
  margin-top: 1rem;
}

.post-image-block h3,
.post-errors h3 {
  margin: 0 0 0.7rem;
  color: var(--film-paper);
  font-size: 1rem;
}

.post-image-list {
  display: grid;
  gap: 0.6rem;
}

.post-image-item,
.post-error-item {
  display: grid;
  gap: 0.35rem;
  padding: 0.8rem;
  border-radius: 12px;
  background: rgba(20, 12, 9, 0.34);
}

.post-image-item.local {
  border-left: 3px solid var(--film-accent-soft);
}

.post-image-item.remote {
  border-left: 3px solid var(--film-gold);
}

.post-image-item strong,
.post-error-item span {
  color: var(--film-paper);
}

.post-image-item code,
.post-error-item code {
  color: var(--film-paper-soft);
  white-space: pre-wrap;
  word-break: break-all;
}

.post-image-empty {
  margin: 0;
  color: var(--film-muted-light);
}

.post-errors {
  padding: 1rem;
  border-radius: 14px;
  background: rgba(123, 30, 30, 0.16);
  border: 1px solid rgba(123, 30, 30, 0.26);
}

.post-content-preview {
  margin: 0;
  min-height: 26rem;
  max-height: 42rem;
  overflow: auto;
  padding: 1rem;
  border-radius: 14px;
  background: rgba(20, 12, 9, 0.4);
  color: var(--film-paper-soft);
  font-family: Consolas, Monaco, monospace;
  font-size: 0.9rem;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 980px) {

  .post-create-hero,
  .post-preview-grid {
    grid-template-columns: 1fr;
  }

  .post-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .post-create-actions {
    flex-direction: column;
  }

  .post-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
