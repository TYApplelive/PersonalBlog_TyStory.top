<script setup lang="ts">
/**
 * 新建文章页 (admin/posts/new.vue)
 *
 * 三栏布局：左目录大纲 + 中 WYSIWYG 编辑（Milkdown）+ 右 HTML 预览
 * 容器居中留边距，保留全屏编辑体验。
 */
import { marked } from "marked";
import MarkdownEditor from "@components/MarkdownEditor.vue";

useHead({ title: "新建文章 - TY's Blog" });
definePageMeta({ layout: false });

interface SaveResponse {
  success: boolean;
  path: string;
}

interface HeadingItem {
  text: string;
  level: number;
  id: string;
}

const router = useRouter();
const toast = useToast();

/* ---- 编辑器状态 ---- */
const editorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null);
const markdownContent = ref(`---
title:
date: ${new Date().toISOString().slice(0, 10)}
description:
tags: []
---

`);
const isSaving = ref(false);
const saveResult = ref<{ path: string } | null>(null);
const filename = ref("");

/* ---- 布局状态 ---- */
const showToc = ref(true);
const showPreview = ref(true);
const headings = ref<HeadingItem[]>([]);

const canSave = computed(() => Boolean(filename.value.trim() && !isSaving.value));

/* ---- 预览渲染 ---- */
const renderedHtml = computed(() => {
  try {
    return marked.parse(markdownContent.value, { breaks: true }) as string;
  } catch {
    return '<p style="color:#e07a7a">渲染错误</p>';
  }
});

/* ---- 内容更新回调 ---- */
function onEditorUpdate(markdown: string) {
  markdownContent.value = markdown;
}

/* ---- 收集目录 ---- */
function refreshOutline() {
  if (editorRef.value?.getOutline) {
    headings.value = editorRef.value.getOutline();
  }
}

/** 点击目录项时滚动预览到对应标题 */
function scrollToHeading(id: string) {
  const el = document.querySelector(`.preview-body [id="${id}"]`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---- 保存 ---- */
async function handleSave() {
  if (!canSave.value) return;

  isSaving.value = true;
  try {
    const content = await editorRef.value?.getMarkdown() || markdownContent.value;

    const result = await $fetch<SaveResponse>("/api/admin/save-post", {
      method: "POST",
      body: {
        filename: filename.value.trim(),
        content,
      },
    });

    saveResult.value = { path: result.path };
    toast.success("保存成功", `文章已保存至 ${result.path}`);
  } catch (error: any) {
    toast.error("保存失败", error?.data?.message || error?.message || "未知错误");
  } finally {
    isSaving.value = false;
  }
}

function handleBack() {
  router.push("/admin/posts");
}

/* ---- 快捷键 ---- */
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    handleSave();
  }
}

/* ---- 编辑器命令转发 ---- */
function exec(method: string, ...args: any[]) {
  if (editorRef.value && typeof (editorRef.value as any)[method] === 'function') {
    ((editorRef.value as any)[method] as Function)(...args);
  }
}

function insertMark(type: string) {
  switch (type) {
    case 'h1': exec('toggleHeading', 1); break;
    case 'h2': exec('toggleHeading', 2); break;
    case 'h3': exec('toggleHeading', 3); break;
    case 'bold': exec('toggleBold'); break;
    case 'italic': exec('toggleItalic'); break;
    case 'strike': exec('toggleStrikethrough'); break;
    case 'ul': exec('toggleBulletList'); break;
    case 'ol': exec('toggleOrderedList'); break;
    case 'task': exec('toggleTaskList'); break;
    case 'code': exec('toggleCodeBlock'); break;
    case 'inline-code': exec('toggleInlineCode'); break;
    case 'quote': exec('toggleBlockquote'); break;
    case 'hr': exec('insertHr'); break;
    case 'link': exec('insertLink'); break;
    case 'image': exec('insertImage'); break;
  }
}
</script>

<template>
  <div class="new-post-page" @keydown="handleKeydown">
    <!-- 顶部栏 -->
    <header class="top-bar">
      <nav class="breadcrumb">
        <NuxtLink to="/admin" class="bc-link">管理中心</NuxtLink>
        <span class="bc-sep">/</span>
        <NuxtLink to="/admin/posts" class="bc-link">文章管理</NuxtLink>
        <span class="bc-sep">/</span>
        <span class="bc-current">新建文章</span>
      </nav>

      <div class="top-right">
        <div class="file-field">
          <span class="file-pre">content/blog/</span>
          <input v-model="filename" type="text" class="file-input" placeholder="file-name">
          <span class="file-suf">.md</span>
        </div>
        <div class="top-actions">
          <button class="top-btn" @click="handleBack">取消</button>
          <button class="top-btn primary" :disabled="!canSave" @click="handleSave">
            {{ isSaving ? "保存中..." : "保存" }}
          </button>
        </div>
      </div>
    </header>

    <!-- 编辑器主体：三栏 -->
    <div class="editor-body">
      <!-- 左栏：目录大纲 -->
      <div v-if="showToc" class="toc-col">
        <div class="toc-hd">
          <span class="toc-label">大纲</span>
          <button class="toc-close" @click="showToc = false" title="收起大纲">✕</button>
        </div>
        <div class="toc-body">
          <div v-if="headings.length === 0" class="toc-empty">暂无标题</div>
          <button
            v-for="(h, i) in headings" :key="i"
            class="toc-item"
            :class="'toc-level-' + h.level"
            @click="scrollToHeading(h.id)"
          >
            {{ h.text || '(空标题)' }}
          </button>
        </div>
      </div>

      <!-- 中栏：编辑器 -->
      <div class="editor-col" :class="{ 'editor-full': !showPreview }">
        <!-- 格式工具栏 -->
        <div class="fmt-bar">
          <button v-if="!showToc" class="fmt-btn toggle-sidebar" title="展开大纲" @click="showToc = true">☰</button>

          <button class="fmt-btn" title="标题 1" @click="insertMark('h1')"><strong>H1</strong></button>
          <button class="fmt-btn" title="标题 2" @click="insertMark('h2')"><strong>H2</strong></button>
          <button class="fmt-btn" title="标题 3" @click="insertMark('h3')"><strong>H3</strong></button>
          <span class="fmt-divider"></span>
          <button class="fmt-btn" title="粗体" @click="insertMark('bold')"><strong>B</strong></button>
          <button class="fmt-btn" title="斜体" @click="insertMark('italic')"><em>I</em></button>
          <button class="fmt-btn" title="删除线" @click="insertMark('strike')"><s>S</s></button>
          <span class="fmt-divider"></span>
          <button class="fmt-btn" title="链接" @click="insertMark('link')">🔗</button>
          <button class="fmt-btn" title="图片" @click="insertMark('image')">🖼</button>
          <span class="fmt-divider"></span>
          <button class="fmt-btn" title="无序列表" @click="insertMark('ul')">•</button>
          <button class="fmt-btn" title="有序列表" @click="insertMark('ol')">1.</button>
          <button class="fmt-btn" title="任务列表" @click="insertMark('task')">☑</button>
          <span class="fmt-divider"></span>
          <button class="fmt-btn" title="代码块" @click="insertMark('code')">&lt;/&gt;</button>
          <button class="fmt-btn" title="行内代码" @click="insertMark('inline-code')"><code>`</code></button>
          <button class="fmt-btn" title="引用" @click="insertMark('quote')">❝</button>
          <button class="fmt-btn" title="分隔线" @click="insertMark('hr')">—</button>

          <span style="flex:1"></span>
          <button
            class="fmt-btn preview-toggle"
            :class="{ active: showPreview }"
            :title="showPreview ? '隐藏预览' : '显示预览'"
            @click="showPreview = !showPreview"
          >
            {{ showPreview ? '▸ 预览' : '◂ 预览' }}
          </button>
        </div>

        <!-- Milkdown WYSIWYG 编辑器 -->
        <ClientOnly>
          <MarkdownEditor
            ref="editorRef"
            :model-value="markdownContent"
            @update:model-value="onEditorUpdate"
          />
          <template #fallback>
            <div class="editor-loading">编辑器加载中...</div>
          </template>
        </ClientOnly>
      </div>

      <!-- 右栏：预览 -->
      <div v-if="showPreview" class="preview-col">
        <div class="preview-hd">
          <span class="preview-label">预览</span>
          <button class="preview-close" @click="showPreview = false" title="关闭预览">✕</button>
        </div>
        <div class="preview-body" v-html="renderedHtml"></div>
      </div>
    </div>

    <!-- 保存结果 -->
    <Transition name="fade">
      <div v-if="saveResult" class="save-result">
        <p>✅ 文章已保存</p>
        <NuxtLink :to="saveResult.path" class="btn-primary-sm">查看文章</NuxtLink>
        <button class="btn-ghost-sm" @click="handleBack">返回列表</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ===== 容器（居中 + 边距） ===== */
.new-post-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 1560px;
  margin: 0 auto;
  padding: 0 1.5rem;
  background: var(--film-bg);
  color: var(--film-paper);
}

/* ===== 顶部栏 ===== */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(183, 140, 77, 0.12);
  gap: 1rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  white-space: nowrap;
}

.bc-link {
  color: var(--film-muted);
  text-decoration: none;
  transition: color 0.2s;
}
.bc-link:hover { color: var(--film-gold-soft); }

.bc-sep { color: var(--film-muted); font-size: 0.65rem; }
.bc-current { color: var(--film-gold-soft); font-weight: 600; }

.top-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.file-field {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  font-family: Consolas, Monaco, monospace;
  font-size: 0.8rem;
}

.file-pre, .file-suf { color: var(--film-muted); white-space: nowrap; }

.file-input {
  width: 11rem;
  padding: 0.3rem 0.45rem;
  border: 1px solid rgba(183, 140, 77, 0.25);
  border-radius: 4px;
  background: rgba(20, 12, 9, 0.4);
  color: var(--film-paper);
  font-family: inherit;
  font-size: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.file-input:focus {
  border-color: var(--film-gold);
  box-shadow: 0 0 0 2px rgba(183, 140, 77, 0.1);
}

.top-actions { display: flex; align-items: center; gap: 0.4rem; }

.top-btn {
  padding: 0.3rem 0.7rem;
  border: 1px solid rgba(183, 140, 77, 0.25);
  border-radius: 5px;
  background: transparent;
  color: var(--film-muted-light);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s;
}
.top-btn:hover { border-color: rgba(183, 140, 77, 0.4); color: var(--film-paper); }

.top-btn.primary {
  background: var(--film-gold);
  border-color: var(--film-gold);
  color: #140f0d;
  font-weight: 600;
}
.top-btn.primary:hover { background: var(--film-gold-soft); border-color: var(--film-gold-soft); }
.top-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ===== 编辑器主体 ===== */
.editor-body {
  flex: 1;
  display: flex;
  min-height: 0;
  border: 1px solid rgba(183, 140, 77, 0.1);
  border-top: none;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  overflow: hidden;
}

/* ===== 左栏：目录大纲 ===== */
.toc-col {
  width: 200px;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(183, 140, 77, 0.1);
  background: rgba(242, 221, 175, 0.02);
  flex-shrink: 0;
}

.toc-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid rgba(183, 140, 77, 0.08);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--film-muted);
  flex-shrink: 0;
}

.toc-close {
  background: none; border: none; color: var(--film-muted);
  cursor: pointer; font-size: 0.75rem; padding: 0.15rem 0.3rem; border-radius: 3px;
  transition: all 0.12s;
}
.toc-close:hover { background: rgba(183, 140, 77, 0.15); color: var(--film-paper); }

.toc-body { flex: 1; overflow-y: auto; padding: 0.4rem 0; }

.toc-empty {
  padding: 1rem 0.75rem; color: var(--film-muted);
  font-size: 0.78rem; text-align: center;
}

.toc-item {
  display: block; width: 100%; text-align: left;
  background: none; border: none; color: var(--film-paper-soft);
  font-size: 0.78rem; padding: 0.3rem 0.75rem; cursor: pointer;
  transition: all 0.12s; line-height: 1.4;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.toc-item:hover { color: var(--film-gold-soft); background: rgba(183, 140, 77, 0.08); }

.toc-level-1 { padding-left: 0.75rem; font-weight: 600; color: var(--film-gold-soft); }
.toc-level-2 { padding-left: 1.5rem; }
.toc-level-3 { padding-left: 2.25rem; font-size: 0.72rem; }
.toc-level-4 { padding-left: 3rem; font-size: 0.68rem; }
.toc-level-5 { padding-left: 3.75rem; font-size: 0.65rem; }
.toc-level-6 { padding-left: 4.5rem; font-size: 0.62rem; }

/* ===== 中栏：编辑器 ===== */
.editor-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

.editor-full { flex: 1; }

/* 格式工具栏 */
.fmt-bar {
  display: flex;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
  padding: 0.3rem 0.75rem;
  background: rgba(242, 221, 175, 0.03);
  border-bottom: 1px solid rgba(183, 140, 77, 0.1);
  flex-wrap: wrap;
}

.fmt-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.7rem;
  height: 1.7rem;
  padding: 0 0.3rem;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--film-paper-soft);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.12s;
}

.fmt-btn:hover { background: rgba(183, 140, 77, 0.15); color: var(--film-paper); }
.fmt-btn code { font-size: 0.75rem; color: var(--film-gold-soft); }

.fmt-btn.active { background: rgba(183, 140, 77, 0.15); color: var(--film-gold-soft); }

.fmt-btn.toggle-sidebar,
.fmt-btn.preview-toggle {
  font-size: 0.7rem; min-width: auto; padding: 0 0.4rem; color: var(--film-muted);
}
.fmt-btn.preview-toggle:hover,
.fmt-btn.toggle-sidebar:hover { color: var(--film-gold-soft); }

.fmt-divider {
  width: 1px; height: 0.9rem; margin: 0 0.2rem;
  background: rgba(183, 140, 77, 0.15); flex-shrink: 0;
}

/* 加载占位 */
.editor-loading {
  flex: 1;
  display: grid;
  place-items: center;
  min-height: 300px;
  color: var(--film-muted);
  font-size: 0.9rem;
}

/* ===== 右栏：预览 ===== */
.preview-col {
  width: 38%;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  background: rgba(242, 221, 175, 0.02);
  border-left: 1px solid rgba(183, 140, 77, 0.1);
}

.preview-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 0.4rem 0.75rem;
  border-bottom: 1px solid rgba(183, 140, 77, 0.1);
}

.preview-label {
  color: var(--film-gold-soft);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.65rem;
}

.preview-close {
  background: none; border: none; color: var(--film-muted);
  cursor: pointer; font-size: 0.75rem; padding: 0.15rem 0.3rem; border-radius: 3px;
  transition: all 0.12s;
}
.preview-close:hover { background: rgba(183, 140, 77, 0.15); color: var(--film-paper); }

.preview-body {
  flex: 1;
  padding: 1rem 1.25rem;
  overflow-y: auto;
  line-height: 1.8;
  color: var(--film-paper);
  font-size: 0.9rem;
}

/* 预览 Markdown 渲染 */
.preview-body :deep(h1), .preview-body :deep(h2),
.preview-body :deep(h3), .preview-body :deep(h4) {
  color: var(--film-gold-soft);
  margin: 1em 0 0.4em;
  line-height: 1.3;
}
.preview-body :deep(h1) { font-size: 1.5rem; border-bottom: 1px solid rgba(183, 140, 77, 0.12); padding-bottom: 0.2rem; }
.preview-body :deep(h2) { font-size: 1.25rem; }
.preview-body :deep(h3) { font-size: 1.05rem; }
.preview-body :deep(p) { margin: 0.6em 0; }
.preview-body :deep(a) { color: var(--film-gold); text-decoration: underline; }
.preview-body :deep(blockquote) {
  border-left: 3px solid var(--film-gold); padding-left: 0.8rem;
  margin: 0.8em 0; color: var(--film-paper-soft); font-style: italic;
}
.preview-body :deep(code) {
  background: rgba(183, 140, 77, 0.12); padding: 0.12rem 0.35rem;
  border-radius: 3px; font-family: Consolas, Monaco, monospace;
  font-size: 0.88em; color: var(--film-gold-soft);
}
.preview-body :deep(pre) {
  border: 1px solid rgba(183, 140, 77, 0.18); border-radius: 6px;
  padding: 0.75rem; overflow-x: auto; background: rgba(10, 7, 5, 0.4);
}
.preview-body :deep(pre code) { background: none; padding: 0; }
.preview-body :deep(ul), .preview-body :deep(ol) { padding-left: 1.5rem; }
.preview-body :deep(li) { margin: 0.25em 0; }
.preview-body :deep(img) { max-width: 100%; border-radius: 6px; margin: 0.5rem 0; }
.preview-body :deep(hr) { border: none; border-top: 1px solid rgba(183, 140, 77, 0.18); margin: 1.5rem 0; }
.preview-body :deep(table) { width: 100%; border-collapse: collapse; margin: 0.8rem 0; }
.preview-body :deep(th), .preview-body :deep(td) {
  border: 1px solid rgba(183, 140, 77, 0.18);
  padding: 0.35rem 0.6rem; text-align: left; font-size: 0.85rem;
}
.preview-body :deep(th) { background: rgba(183, 140, 77, 0.06); color: var(--film-gold-soft); }
.preview-body :deep(input[type="checkbox"]) { margin-right: 0.3rem; }

/* ===== 保存结果 ===== */
.save-result {
  position: fixed; bottom: 1rem; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.7rem 1.2rem; border-radius: 8px;
  background: rgba(10, 7, 5, 0.92); border: 1px solid rgba(110, 201, 143, 0.3); z-index: 100;
}
.save-result p { margin: 0; font-size: 0.92rem; color: #6ec98f; font-weight: 600; }

.btn-primary-sm {
  padding: 0.35rem 0.75rem; border-radius: 5px; border: none;
  background: var(--film-gold); color: #140f0d; font-size: 0.8rem;
  font-weight: 600; cursor: pointer; text-decoration: none; transition: opacity 0.2s;
}
.btn-primary-sm:hover { opacity: 0.85; }

.btn-ghost-sm {
  padding: 0.35rem 0.75rem; border-radius: 5px;
  border: 1px solid rgba(183, 140, 77, 0.25); background: transparent;
  color: var(--film-muted-light); font-size: 0.8rem; cursor: pointer; transition: all 0.15s;
}
.btn-ghost-sm:hover { border-color: rgba(183, 140, 77, 0.4); color: var(--film-paper); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ===== 响应式 ===== */
@media (max-width: 1100px) {
  .toc-col { width: 160px; min-width: 120px; }
  .preview-col { width: 32%; min-width: 200px; }
}

@media (max-width: 860px) {
  .new-post-page { padding: 0 0.75rem; }
  .toc-col { display: none; }
  .preview-col { display: none; }
}

@media (max-width: 640px) {
  .top-bar { flex-direction: column; align-items: stretch; gap: 0.4rem; padding: 0.35rem 0; }
  .top-right { justify-content: space-between; }
  .file-input { width: 8rem; }
}
</style>
