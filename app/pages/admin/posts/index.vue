<script setup lang="ts">
/**
 * 文章管理页：浏览、筛选、排序、图片修复与删除操作
 */
useHead({ title: "Post Manager - TY's Blog" });

import type { BlogPost } from "#shared/types/site";
import type { ImgBedConfig } from "#shared/utils/imgbed-config";
import { getImgBedConfig } from "#shared/utils/imgbed-config";
import { extractImages, getLocalImages } from "#shared/utils/markdown-parser";
import MarkdownEditor from "@components/MarkdownEditor.vue";
import {
  buildMarkdownWithFrontmatter,
  formatTagsInput,
  parseMarkdownForEditor,
  parseTagsInput,
  validateRequiredFrontmatter,
  type BlogFrontmatterForm,
} from "#shared/utils/post-frontmatter";

interface RepairResult {
  scannedPosts: number;
  localImageCount: number;
  fixedCount: number;
  updatedPosts: string[];
  errors: Array<{ postPath: string; imagePath: string; error: string }>;
}

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

interface UploadedImage {
  originalPath: string;
  remoteUrl: string;
  altText: string;
}

// 状态管理
const searchQuery = ref("");
const selectedTag = ref("");
const sortMode = ref<"date-desc" | "date-asc" | "title">("date-desc");
const isRepairing = ref(false);
const repairResult = ref<RepairResult | null>(null);
const repairMessage = ref("");
const showStats = ref(false);
const deletingSlug = ref("");
const toast = useToast();

// ================================================================
// 新建文章状态 (合并自 admin/posts/new.vue)
// ================================================================
const showCreateForm = ref(false);
const selectedFile = ref<File | null>(null);
const draftContent = ref("");
const processedContent = ref("");
const markdownBody = ref("");
const customFilename = ref("");
const frontmatterForm = ref<BlogFrontmatterForm>({
  title: "",
  date: "",
  description: "",
  readTime: "",
  tags: [],
});
const tagsInput = ref("");
const isDragging = ref(false);
const isSaving = ref(false);
const progress = ref(0);
const processedImages = ref(0);
const totalProcessImages = ref(0);
const statusText = ref("");
const savePath = ref("");
const errors = ref<Array<{ path: string; error: string }>>([]);
const currentConfig = ref<ImgBedConfig>({ apiUrl: "", token: "" });
const uploadedImages = ref<UploadedImage[]>([]);
const previewImage = ref<string | null>(null);
const previewPosition = ref({ x: 0, y: 0 });
let progressTimer: ReturnType<typeof setInterval> | null = null;

// MarkdownEditor 组件引用
const editorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null);

// 数据加载
const { data: posts, pending, error, refresh } = await useAsyncData<BlogPost[]>(
  "admin-posts-list",
  () => $fetch("/api/admin/posts"),
  { default: () => [] },
);

// 调试日志：监控文章列表数据加载状态
if (import.meta.client) {
  watchEffect(() => {
    if (error.value) {
      console.error('[Admin Posts] 文章列表加载失败:', error.value);
    } else if (!pending.value) {
      console.log(`[Admin Posts] 文章列表已加载，共 ${posts.value.length} 篇`);
    }
  });
}

const { data: loadedConfig } = await useAsyncData("imgbed-config-post-create", () => getImgBedConfig());

watch(
  loadedConfig,
  (value) => {
    if (value) currentConfig.value = value;
  },
  { immediate: true },
);

// 计算属性
const allTags = computed(() => {
  const tagSet = new Set<string>();
  posts.value.forEach((post) => post.tags?.forEach((tag) => tagSet.add(tag)));
  return [...tagSet].sort();
});

const filteredPosts = computed(() => {
  let result = posts.value;

  // 标签筛选
  if (selectedTag.value) {
    result = result.filter((post) => post.tags?.includes(selectedTag.value));
  }

  // 关键词搜索
  const keyword = searchQuery.value.trim().toLowerCase();
  if (keyword) {
    result = result.filter((post) => {
      const inTitle = post.title?.toLowerCase().includes(keyword);
      const inTags = post.tags?.some((tag) => tag.toLowerCase().includes(keyword));
      const inExcerpt = post.description?.toLowerCase().includes(keyword);
      return Boolean(inTitle || inTags || inExcerpt);
    });
  }

  // 排序
  if (sortMode.value === "date-desc") {
    result = [...result].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  } else if (sortMode.value === "date-asc") {
    result = [...result].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  } else if (sortMode.value === "title") {
    result = [...result].sort((a, b) =>
      (a.title || "").localeCompare(b.title || ""),
    );
  }

  return result;
});

// 新建文章计算属性
const rebuiltMarkdown = computed(() => {
  if (!draftContent.value) return "";
  return buildMarkdownWithFrontmatter(
    { ...frontmatterForm.value, tags: parseTagsInput(tagsInput.value) },
    markdownBody.value,
  );
});
const extractedImages = computed(() => extractImages(rebuiltMarkdown.value));
const localImages = computed(() => getLocalImages(extractedImages.value));
const remoteImages = computed(() => extractedImages.value.filter((item) => item.pathType === "remote"));
const outputContent = computed(() => processedContent.value || rebuiltMarkdown.value);
const resolvedFilename = computed(() => {
  if (customFilename.value.trim()) return customFilename.value.trim();
  return selectedFile.value?.name.replace(/\.(md|markdown)$/i, "") || "";
});
const canSave = computed(() => Boolean(resolvedFilename.value && !isSaving.value));
const progressLabel = computed(() => `${processedImages.value}/${totalProcessImages.value}`);

// 方法
function clearFilters() {
  searchQuery.value = "";
  selectedTag.value = "";
}

async function repairImages() {
  isRepairing.value = true;
  repairMessage.value = "正在修复 Markdown 图片引用...";
  repairResult.value = null;

  try {
    repairResult.value = await $fetch<RepairResult>("/api/admin/repair-blog-images", {
      method: "POST",
    });
    repairMessage.value = `修复完成！共修复 ${repairResult.value.fixedCount} 处图片引用`;
    await refresh();
  } catch (error: any) {
    console.error('[Admin Posts] 图片修复失败:', error);
    repairMessage.value = error?.data?.message || error?.message || "修复失败";
  } finally {
    isRepairing.value = false;
  }
}

async function confirmDelete(post: BlogPost) {
  if (!window.confirm(`确定要删除文章「${post.title || "未命名"}」吗？此操作不可恢复！`)) return;

  // 优先使用 stem（如 blog/1.nuxt-guide），否则从 path 提取
  const slug = post.stem ? post.stem.split('/').pop()?.replace(/\.md$/, '') : post.path.replace("/blog/", "");
  if (!slug) {
    toast.error("错误", "无法获取文章标识");
    return;
  }
  deletingSlug.value = slug;

  try {
    await $fetch(`/api/admin/posts/${slug}`, { method: "DELETE" });
    posts.value = posts.value.filter((item) => item.path !== post.path);
    toast.success("删除成功", `文章「${post.title}」已删除`);
    await refresh();
  } catch (error: any) {
    console.error('[Admin Posts] 删除文章失败:', error);
    toast.error("删除失败", error?.data?.message || "未知错误");
  } finally {
    deletingSlug.value = "";
  }
}

async function copyPath(post: BlogPost) {
  try {
    await navigator.clipboard.writeText(post.path);
    toast.success("复制成功", "路径已复制到剪贴板");
  } catch {
    toast.info("提示", `路径: ${post.path}`);
  }
}

function scrollToTop() {
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// ================================================================
// 新建文章方法 (合并自 admin/posts/new.vue)
// ================================================================
function resetResultState() {
  processedContent.value = "";
  savePath.value = "";
  errors.value = [];
  progress.value = 0;
  processedImages.value = 0;
  totalProcessImages.value = 0;
  statusText.value = "";
  uploadedImages.value = [];
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
    const parsed = parseMarkdownForEditor(draftContent.value);
    frontmatterForm.value = parsed.frontmatter;
    tagsInput.value = formatTagsInput(parsed.frontmatter.tags);
    markdownBody.value = parsed.body;
    // 将 Markdown 正文加载到编辑器中
    nextTick(() => {
      editorRef.value?.setMarkdown(parsed.body);
    });
    resetResultState();
    console.log('[Admin Posts] MD 文件已加载到编辑器:', file.name);
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

function extractUploadedImages(original: string, processed: string): UploadedImage[] {
  const originalLocal = getLocalImages(extractImages(original));
  const processedRemote = extractImages(processed).filter((img) => img.pathType === "remote");

  const uploaded: UploadedImage[] = [];
  for (const localImg of originalLocal) {
    const remoteImg = processedRemote.find((r) => r.altText === localImg.altText);
    if (remoteImg && !uploaded.some((u) => u.originalPath === localImg.path)) {
      uploaded.push({
        originalPath: localImg.path,
        remoteUrl: remoteImg.path,
        altText: localImg.altText || "",
      });
    }
  }
  return uploaded;
}

function showImagePreview(url: string, event: MouseEvent) {
  previewImage.value = url;
  updatePreviewPosition(event);
}

function hideImagePreview() {
  previewImage.value = null;
}

function updatePreviewPosition(event: MouseEvent) {
  const x = event.clientX + 15;
  const y = event.clientY + 15;
  const maxX = window.innerWidth - 320;
  const maxY = window.innerHeight - 220;
  previewPosition.value = {
    x: Math.min(x, maxX),
    y: Math.min(y, maxY),
  };
}

async function savePost() {
  if (!canSave.value) return;

  const requiredErrors = validateRequiredFrontmatter({
    ...frontmatterForm.value,
    tags: parseTagsInput(tagsInput.value),
  });
  if (requiredErrors.length) {
    toast.error("Missing frontmatter", `Required: ${requiredErrors.join(", ")}`);
    return;
  }

  isSaving.value = true;
  errors.value = [];
  processedContent.value = "";
  savePath.value = "";
  uploadedImages.value = [];
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
    // 从编辑器获取当前 Markdown 正文
    const editorMarkdown = await editorRef.value?.getMarkdown() || markdownBody.value;
    const contentToSave = buildMarkdownWithFrontmatter(
      { ...frontmatterForm.value, tags: parseTagsInput(tagsInput.value) },
      editorMarkdown,
    );
    console.log('[Admin Posts] 准备保存文章:', resolvedFilename.value);

    let finalContent = contentToSave;
    totalProcessImages.value = getLocalImages(extractImages(contentToSave)).length;
    processedImages.value = 0;
    progress.value = totalProcessImages.value ? 10 : 30;
    statusText.value = totalProcessImages.value
      ? "Processing markdown images before save..."
      : "No local image found. Saving markdown...";

    if (totalProcessImages.value) {
      startFakeProgress(totalProcessImages.value);
    }

    if (totalProcessImages.value > 0) {
      const processResult = await $fetch<ProcessResponse>("/api/process-markdown", {
        method: "POST",
        body: {
          content: contentToSave,
        },
      });

      stopProgressTimer();
      finalContent = processResult.processedContent;
      processedContent.value = processResult.processedContent;
      errors.value = processResult.errors || [];
      processedImages.value = processResult.processedCount;
      progress.value = 85;
      statusText.value = `Image process finished (${processResult.uploadedCount}/${processResult.localImages}). Writing markdown...`;

      uploadedImages.value = extractUploadedImages(contentToSave, processResult.processedContent);
    } else {
      processedContent.value = finalContent;
      progress.value = 85;
      statusText.value = "No local image found. Writing markdown...";
    }

    const saveResult = await $fetch<SaveResponse>("/api/admin/save-post", {
      method: "POST",
      body: {
        filename: resolvedFilename.value,
        content: finalContent,
      },
    });

    savePath.value = saveResult.path;
    progress.value = 100;
    statusText.value = `Saved to ${saveResult.path}`;
    console.log('[Admin Posts] 文章保存成功:', saveResult.path);
    toast.success("Saved", statusText.value);
  } catch (error: any) {
    console.error('[Admin Posts] 文章保存失败:', error);
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
    <!-- 页头 -->
    <header class="admin-header">
      <p class="eyebrow">POST ARCHIVE</p>
      <h1>文章管理</h1>
      <p class="admin-subtitle">
        浏览、筛选和跳转所有博客文章。点击上方「新建文章」按钮创建新文章。
      </p>
    </header>

    <!-- ===== 新建文章区域 (合并自 admin/posts/new.vue) ===== -->
    <Transition name="slide-down">
      <section v-if="showCreateForm" class="post-create-section">
        <div class="post-create-hero">
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
              <p class="form-hint">Letters, numbers, spaces, dash and underscore are allowed.</p>
            </div>

            <div class="post-create-config">
              <p><strong>Frontmatter</strong></p>
              <label class="form-group compact-form-group">
                <span>Title *</span>
                <input v-model="frontmatterForm.title" type="text" class="form-input">
              </label>
              <label class="form-group compact-form-group">
                <span>Date *</span>
                <input v-model="frontmatterForm.date" type="text" placeholder="YYYY-MM-DD" class="form-input">
              </label>
              <label class="form-group compact-form-group">
                <span>Description *</span>
                <textarea v-model="frontmatterForm.description" rows="3" class="form-input"></textarea>
              </label>
              <label class="form-group compact-form-group">
                <span>Read Time *</span>
                <input v-model="frontmatterForm.readTime" type="text" class="form-input">
              </label>
              <label class="form-group compact-form-group">
                <span>Tags</span>
                <input v-model="tagsInput" type="text" placeholder="Nuxt, Vue" class="form-input">
              </label>
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
        </div>

        <!-- Markdown 编辑器 -->
        <div v-if="selectedFile || showCreateForm" class="post-editor-section">
          <h3 class="post-editor-label">Markdown 编辑</h3>
          <MarkdownEditor ref="editorRef" :model-value="markdownBody" />
        </div>

        <div class="post-stats-grid">
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
            <strong>{{ uploadedImages.length }}</strong>
            <span>Uploaded</span>
          </article>
        </div>

        <section v-if="statusText" class="admin-panel">
          <div class="progress-row">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${progress}%` }" />
            </div>
            <span class="progress-counter">{{ progressLabel }}</span>
          </div>
          <p class="post-status-text">{{ statusText }}</p>
        </section>

        <div class="post-preview-grid">
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
              <div v-if="uploadedImages.length" class="post-image-block uploaded">
                <h3>Uploaded images ({{ uploadedImages.length }})</h3>
                <div class="post-image-list">
                  <div
                    v-for="item in uploadedImages"
                    :key="item.remoteUrl"
                    class="post-image-item uploaded-item"
                    @mouseenter="showImagePreview(item.remoteUrl, $event)"
                    @mousemove="updatePreviewPosition"
                    @mouseleave="hideImagePreview"
                  >
                    <strong>{{ item.altText || "No alt" }}</strong>
                    <code>{{ item.remoteUrl }}</code>
                    <span class="upload-badge">Uploaded</span>
                  </div>
                </div>
              </div>

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
                  <div
                    v-for="item in remoteImages"
                    :key="item.fullMatch"
                    class="post-image-item remote"
                    @mouseenter="showImagePreview(item.path, $event)"
                    @mousemove="updatePreviewPosition"
                    @mouseleave="hideImagePreview"
                  >
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
        </div>
      </section>
    </Transition>

    <main class="admin-main admin-posts-main">
      <!-- ===== 工具栏 ===== -->
      <section class="admin-panel admin-toolbar">
        <!-- 左侧：统计 -->
        <div class="toolbar-stats" @click="showStats = !showStats">
          <div class="stat-item">
            <span class="stat-num">{{ posts.length }}</span>
            <span class="stat-label">篇文章</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">{{ allTags.length }}</span>
            <span class="stat-label">个标签</span>
          </div>
        </div>

        <!-- 右侧：操作区 -->
        <div class="toolbar-actions">
          <!-- 搜索 -->
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input v-model="searchQuery" type="text" placeholder="搜索标题、摘要或标签..." class="form-input admin-search-input">
            <button v-if="searchQuery || selectedTag" class="btn-clear" @click="clearFilters" title="清除筛选">✕</button>
          </div>

          <!-- 排序切换 -->
          <div class="sort-group">
            <button :class="['btn-sort', { active: sortMode === 'date-desc' }]" @click="sortMode = 'date-desc'"
              title="按日期降序">最新</button>
            <button :class="['btn-sort', { active: sortMode === 'date-asc' }]" @click="sortMode = 'date-asc'"
              title="按日期升序">最早</button>
            <button :class="['btn-sort', { active: sortMode === 'title' }]" @click="sortMode = 'title'"
              title="按标题排序">标题</button>
          </div>

          <!-- 功能按钮 -->
          <button class="btn btn-secondary" @click="refresh()" :disabled="pending">
            {{ pending ? "..." : "刷新" }}
          </button>

          <button class="btn btn-accent" :disabled="isRepairing" @click="repairImages()">
            {{ isRepairing ? "修复中..." : "修复图片" }}
          </button>

          <NuxtLink to="/admin/posts/new" class="btn btn-primary">
            新建文章 ✚
          </NuxtLink>
        </div>
      </section>

      <!-- 错误提示 -->
      <section v-if="error" class="admin-panel error-banner">
        <div class="error-banner-content">
          <span class="error-icon">⚠️</span>
          <div>
            <strong>文章列表加载失败</strong>
            <p>{{ error.message || '未知错误，请检查网络连接或刷新重试。' }}</p>
          </div>
          <button class="btn btn-secondary btn-sm" @click="refresh()">重试</button>
        </div>
      </section>

      <!-- 标签筛选条 -->
      <section v-if="allTags.length > 0" class="admin-panel tag-filter-bar">
        <span class="tag-filter-label">按标签筛选：</span>
        <div class="tag-filter-list">
          <button v-for="tag in allTags" :key="tag"
            :class="['tag-badge', { clickable: true, active: selectedTag === tag }]"
            @click="selectedTag = selectedTag === tag ? '' : tag">
            {{ tag }}
          </button>
        </div>
      </section>

      <!-- 修复结果面板 -->
      <Transition name="fade">
        <section v-if="repairMessage" class="admin-panel repair-panel">
          <div class="repair-header">
            <span class="repair-icon">🔧</span>
            <p class="repair-message">{{ repairMessage }}</p>
          </div>

          <div v-if="repairResult" class="repair-stats-grid">
            <div class="repair-stat-card">
              <span class="repair-stat-num">{{ repairResult.scannedPosts }}</span>
              <span class="repair-stat-label">扫描文章</span>
            </div>
            <div class="repair-stat-card">
              <span class="repair-stat-num">{{ repairResult.localImageCount }}</span>
              <span class="repair-stat-label">本地图片</span>
            </div>
            <div class="repair-stat-card success">
              <span class="repair-stat-num">{{ repairResult.fixedCount }}</span>
              <span class="repair-stat-label">已修复</span>
            </div>
            <div class="repair-stat-card" :class="{ error: repairResult.errors.length > 0 }">
              <span class="repair-stat-num">{{ repairResult.errors.length }}</span>
              <span class="repair-stat-label">错误数</span>
            </div>
          </div>

          <div v-if="repairResult?.updatedPosts?.length" class="repair-updated-list">
            <strong>已更新的文章：</strong>
            <div class="repair-chip-list">
              <NuxtLink v-for="path in repairResult.updatedPosts" :key="path" :to="path" class="tag-badge link-badge">{{
                path.replace("/blog/", "") }}</NuxtLink>
            </div>
          </div>

          <div v-if="repairResult?.errors?.length" class="repair-error-list">
            <strong>错误详情：</strong>
            <div v-for="(item, idx) in repairResult.errors" :key="`${item.postPath}-${item.imagePath}`"
              class="repair-error-item">
              <code>{{ item.imagePath }}</code>
              <span>{{ item.error }}</span>
            </div>
          </div>
        </section>
      </Transition>

      <!-- 文章卡片列表 -->
      <TransitionGroup name="post-list" tag="div" class="admin-posts-list">
        <article v-for="(post, index) in filteredPosts" :key="post.path" class="admin-post-card"
          :style="{ animationDelay: `${Math.min(index * 40, 300)}ms` }">
          <!-- 序号 -->
          <div class="post-index">{{ index + 1 }}</div>

          <!-- 主内容 -->
          <div class="admin-post-main">
            <p class="admin-post-meta">
              <span class="meta-date">{{ post.date || "无日期" }}</span>
              <span v-if="post.readTime" class="meta-readtime">· {{ post.readTime }}</span>
              <span class="meta-path">{{ post.path.replace("/blog/", "") }}</span>
            </p>
            <h2 class="admin-post-title">
              <NuxtLink :to="post.path" class="post-title-link">{{ post.title || "未命名文章" }}</NuxtLink>
            </h2>
            <p class="admin-post-excerpt">{{ post.description || "暂无摘要" }}</p>

            <!-- 标签 -->
            <div v-if="post.tags?.length" class="admin-post-tags">
              <span v-for="tag in post.tags" :key="tag" :class="['tag-badge', { clickable: true }]"
                @click="selectedTag = tag; scrollToTop()">{{ tag }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="admin-post-actions">
            <NuxtLink :to="post.path" class="btn btn-primary btn-sm btn-action-view">
              <span class="btn-icon">👁</span> 查看
            </NuxtLink>
            <button class="btn btn-sm btn-action-copy" @click="copyPath(post)" title="复制路径">
              📋 路径
            </button>
            <button class="btn btn-danger btn-sm btn-action-delete" @click="confirmDelete(post)">
              <span class="btn-icon">🗑</span> 删除
            </button>
          </div>
        </article>
      </TransitionGroup>

      <!-- 空状态 -->
      <div v-if="!pending && filteredPosts.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-text">{{ searchQuery || selectedTag ? "没有匹配的文章" : "暂无文章" }}</div>
        <p class="empty-hint">
          {{ searchQuery || selectedTag ? "试试其他关键词或清除筛选条件" : "点击上方「新建文章」按钮上传 Markdown 文件" }}
        </p>
      </div>
    </main>

    <!-- 图片预览浮层 -->
    <Teleport to="body">
      <Transition name="preview-fade">
        <div
          v-if="previewImage"
          class="image-preview-popup"
          :style="{ left: `${previewPosition.x}px`, top: `${previewPosition.y}px` }"
        >
          <img :src="previewImage" alt="Preview" @error="hideImagePreview">
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ===== 布局 ===== */
.admin-posts-main {
  gap: 1rem;
}

.admin-posts-list {
  display: grid;
  gap: 1rem;
}

/* ===== 工具栏 ===== */
.admin-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.toolbar-stats {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.8rem 1.2rem;
  border-radius: 14px;
  background: rgba(183, 140, 77, 0.08);
  cursor: pointer;
  transition: background 0.25s;
}

.toolbar-stats:hover {
  background: rgba(183, 140, 77, 0.15);
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.stat-num {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--film-gold);
  line-height: 1;
}

.stat-label {
  font-size: 0.82rem;
  color: var(--film-muted);
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(183, 140, 77, 0.25);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* 搜索框 */
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 0.9rem;
  pointer-events: none;
}

.admin-search-input {
  width: min(26rem, 100%);
  padding-left: 2.2rem;
  padding-right: 2.2rem;
}

.btn-clear {
  position: absolute;
  right: 8px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(180, 60, 60, 0.7);
  color: #fff;
  font-size: 0.72rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, background 0.2s;
}

.btn-clear:hover {
  transform: scale(1.15);
  background: rgba(200, 70, 70, 0.9);
}

/* 排序按钮组 */
.sort-group {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 10px;
  background: rgba(242, 221, 175, 0.06);
  border: 1px solid rgba(183, 140, 77, 0.18);
}

.btn-sort {
  padding: 0.45rem 0.85rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--film-muted);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sort:hover {
  color: var(--film-gold-soft);
  background: rgba(183, 140, 77, 0.1);
}

.btn-sort.active {
  background: var(--film-gold);
  color: var(--film-dark);
  box-shadow: 0 2px 8px rgba(183, 140, 77, 0.35);
}

/* ===== 错误提示 ===== */
.error-banner {
  border-color: rgba(200, 80, 80, 0.35);
  background: linear-gradient(135deg, rgba(180, 60, 60, 0.08), rgba(180, 60, 60, 0.04));
}

.error-banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.error-banner-content .error-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.error-banner-content strong {
  color: #e07a7a;
  font-size: 0.95rem;
}

.error-banner-content p {
  margin: 0.25rem 0 0;
  color: var(--film-paper-soft);
  font-size: 0.85rem;
}

/* ===== 标签筛选 ===== */
.tag-filter-bar {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
  padding: 0.85rem 1.2rem;
}

.tag-filter-label {
  font-size: 0.85rem;
  color: var(--film-muted);
  white-space: nowrap;
  font-weight: 500;
}

.tag-filter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

/* ===== 修复结果面板 ===== */
.repair-panel {
  border-color: rgba(183, 140, 77, 0.3);
  background: linear-gradient(135deg, rgba(242, 221, 175, 0.04), rgba(183, 140, 77, 0.06));
}

.repair-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.repair-icon {
  font-size: 1.3rem;
}

.repair-message {
  margin: 0;
  color: var(--film-paper);
  font-weight: 500;
}

.repair-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.8rem;
  margin-top: 1rem;
}

.repair-stat-card {
  padding: 0.85rem;
  border-radius: 12px;
  background: rgba(242, 221, 175, 0.05);
  border: 1px solid rgba(183, 140, 77, 0.15);
  text-align: center;
  display: grid;
  gap: 0.3rem;
}

.repair-stat-card.success {
  background: rgba(76, 150, 90, 0.1);
  border-color: rgba(76, 150, 90, 0.3);
}

.repair-stat-card.error {
  background: rgba(180, 60, 60, 0.1);
  border-color: rgba(180, 60, 60, 0.3);
}

.repair-stat-num {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--film-gold);
}

.repair-stat-card.success .repair-stat-num {
  color: #6ec98f;
}

.repair-stat-card.error .repair-stat-num {
  color: #e07a7a;
}

.repair-stat-label {
  font-size: 0.78rem;
  color: var(--film-muted);
  letter-spacing: 0.03em;
}

.repair-updated-list,
.repair-error-list {
  margin-top: 1.2rem;
  display: grid;
  gap: 0.6rem;
}

.repair-updated-list strong,
.repair-error-list strong {
  color: var(--film-paper-soft);
  font-size: 0.9rem;
}

.repair-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.link-badge {
  transition: all 0.2s;
}

.link-badge:hover {
  background: var(--film-gold);
  color: var(--film-dark);
  transform: translateY(-1px);
}

.repair-error-item {
  display: grid;
  gap: 0.3rem;
  padding: 0.8rem 1rem;
  border-radius: 10px;
  background: rgba(123, 30, 30, 0.16);
  border: 1px solid rgba(180, 60, 60, 0.2);
}

.repair-error-item code {
  padding: 0.15rem 0.5rem;
  border-radius: 5px;
  background: rgba(183, 140, 77, 0.12);
  color: var(--film-gold-soft);
  font-size: 0.84rem;
}

.repair-error-item span {
  color: #e07a7a;
  font-size: 0.84rem;
}

/* ===== 文章卡片 ===== */
.admin-post-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1.2rem;
  padding: 1.3rem 1.5rem;
  border: 1px solid rgba(183, 140, 77, 0.18);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(242, 221, 175, 0.03), rgba(242, 221, 175, 0.06));
  transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
  animation: cardIn 0.4s ease both;
}

.admin-post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(183, 140, 77, 0.25);
  border-color: rgba(183, 140, 77, 0.35);
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.post-index {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(183, 140, 77, 0.12);
  color: var(--film-muted);
  font-size: 0.85rem;
  font-weight: 600;
  flex-shrink: 0;
}

.admin-post-main {
  min-width: 0;
}

.admin-post-meta {
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  color: var(--film-muted-light);
  font-size: 0.82rem;
  letter-spacing: 0.05em;
}

.meta-date {
  color: var(--film-gold-soft);
  font-weight: 500;
}

.meta-readtime {
  color: var(--film-muted);
}

.meta-path {
  font-family: Consolas, Monaco, monospace;
  font-size: 0.76rem;
  color: var(--film-muted);
  opacity: 0.7;
}

.admin-post-title {
  margin: 0;
  font-size: 1.3rem;
  line-height: 1.3;
}

.post-title-link {
  color: var(--film-gold-soft);
  text-decoration: none;
  transition: color 0.2s;
  display: inline-block;
}

.post-title-link:hover {
  color: var(--film-gold);
}

.admin-post-excerpt {
  margin: 0.7rem 0 0;
  color: var(--film-paper-soft);
  line-height: 1.75;
  font-size: 0.92rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.admin-post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.85rem;
}

/* 操作按钮区 */
.admin-post-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
  flex-shrink: 0;
}

.btn-sm {
  padding: 0.4rem 0.85rem;
  font-size: 0.82rem;
  white-space: nowrap;
}

.btn-icon {
  margin-right: 0.25rem;
}

.btn-action-view {
  background: rgba(183, 140, 77, 0.15);
  color: var(--film-gold-soft);
  border: 1px solid rgba(183, 140, 77, 0.25);
  transition: all 0.2s;
}

.btn-action-view:hover {
  background: var(--film-gold);
  color: var(--film-dark);
  border-color: var(--film-gold);
}

.btn-action-copy {
  background: rgba(120, 140, 170, 0.12);
  color: var(--film-paper-soft);
  border: 1px solid rgba(120, 140, 170, 0.2);
  transition: all 0.2s;
}

.btn-action-copy:hover {
  background: rgba(120, 140, 170, 0.25);
  border-color: rgba(120, 140, 170, 0.4);
}

.btn-action-delete {
  background: rgba(160, 50, 50, 0.15);
  color: #e07a7a;
  border: 1px solid rgba(180, 60, 60, 0.3);
  font-weight: 600;
  transition: all 0.2s;
}

.btn-action-delete:hover {
  background: rgba(180, 60, 60, 0.7);
  color: #fff;
  border-color: rgba(200, 80, 80, 0.8);
  box-shadow: 0 2px 10px rgba(180, 60, 60, 0.3);
}

/* ===== 空状态 ===== */
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  border-radius: 18px;
  background: rgba(242, 221, 175, 0.03);
  border: 1px dashed rgba(183, 140, 77, 0.2);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.8rem;
}

.empty-text {
  font-size: 1.1rem;
  color: var(--film-paper-soft);
  margin-bottom: 0.4rem;
}

.empty-hint {
  color: var(--film-muted);
  font-size: 0.88rem;
  margin: 0;
}

/* ===== 过渡动画 ===== */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.post-list-enter-active,
.post-list-leave-active {
  transition: all 0.35s ease;
}

.post-list-enter-from,
.post-list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.post-list-move {
  transition: transform 0.35s ease;
}

/* ===== 响应式 ===== */
@media (max-width: 1024px) {
  .admin-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-stats {
    justify-content: center;
  }

  .toolbar-actions {
    justify-content: center;
  }

  .search-wrapper {
    flex: 1;
  }

  .admin-search-input {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .admin-post-card {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .post-index {
    display: none;
  }

  .admin-post-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .btn-sm {
    flex: 1;
    min-width: 0;
    justify-content: center;
  }

  .repair-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .tag-filter-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* ===== 新建文章区域样式 (合并自 new.vue) ===== */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.35s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transform: translateY(-10px);
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 8000px;
}

.post-create-section {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border: 1px solid rgba(183, 140, 77, 0.25);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(242, 221, 175, 0.03), rgba(242, 221, 175, 0.06));
}

.post-create-section code {
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

.compact-form-group {
  margin-bottom: 0;
}

.post-create-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.post-editor-section {
  margin-top: 1rem;
}

.post-editor-label {
  margin: 0 0 0.5rem;
  color: var(--film-gold-soft);
  font-size: 1rem;
  font-weight: 600;
}

.post-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1rem;
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
  margin-top: 1rem;
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

.post-image-block.uploaded h3 {
  color: #6ec98f;
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
  cursor: pointer;
  transition: background 0.2s;
}

.post-image-item.remote:hover {
  background: rgba(20, 12, 9, 0.5);
}

.post-image-item.uploaded-item {
  border-left: 3px solid #6ec98f;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.post-image-item.uploaded-item:hover {
  background: rgba(110, 201, 143, 0.1);
  transform: translateX(4px);
}

.upload-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: rgba(110, 201, 143, 0.2);
  color: #6ec98f;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

/* 图片预览浮层 */
.image-preview-popup {
  position: fixed;
  z-index: 9999;
  padding: 8px;
  border-radius: 12px;
  background: var(--film-dark);
  border: 2px solid var(--film-gold);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.image-preview-popup img {
  display: block;
  max-width: 300px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: contain;
}

.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.15s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
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
