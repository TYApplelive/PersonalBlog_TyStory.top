<script setup lang="ts">
/**
 * 新建文章页 (admin/posts/new.vue)
 *
 * 功能：
 * - 深浅色主题切换
 * - Frontmatter 在编辑器中以 Markdown 形式编辑
 * - 导入/导出 Markdown 文件
 * - 保存时弹出确认对话框检查信息
 * - 使用 Lucide 图标
 */
import { marked } from "marked";
import MarkdownEditor from "@components/MarkdownEditor.vue";
import { useTheme } from "~/composables/useTheme";


useHead({ title: "新建文章 - TY's Blog" });
definePageMeta({ layout: false });

const { loggedIn, fetch: fetchSession } = useUserSession();
await fetchSession();
if (!loggedIn.value) {
  await navigateTo(`/login?redirect=${encodeURIComponent('/admin/posts/new')}`);
}

interface SaveResponse {
  success: boolean;
  path: string;
}

interface HeadingItem {
  text: string;
  level: number;
  id: string;
}

interface Frontmatter {
  title: string;
  date: string;
  description: string;
  tags: string[];
}

const router = useRouter();
const toast = useToast();
const { theme, toggleTheme } = useTheme();

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

// 编辑器模式状态（从子组件获取）
const mode = ref<'source' | 'wysiwyg'>('source');

/* ---- 布局状态 ---- */
const showToc = ref(true);
const showPreview = ref(false);
const splitRatio = ref(0.5); // 编辑器/预览 分割比例
const isResizing = ref(false);
const headings = ref<HeadingItem[]>([]);

/* ---- 确认对话框状态 ---- */
const showConfirmDialog = ref(false);
const parsedFrontmatter = ref<Frontmatter>({
  title: '',
  date: '',
  description: '',
  tags: []
});
const hasIncompleteInfo = ref(false);

const canSave = computed(() => Boolean(filename.value.trim() && !isSaving.value));

/* ---- Frontmatter 解析 ---- */
function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    return { title: '', date: '', description: '', tags: [] };
  }

  try {
    const fmText = match[1] || '';
    const fm: Partial<Frontmatter> = {};

    // 解析 title
    const titleMatch = fmText.match(/^title:\s*(.*)$/m);
    fm.title = titleMatch?.[1]?.trim() || '';

    // 解析 date
    const dateMatch = fmText.match(/^date:\s*(.*)$/m);
    fm.date = dateMatch?.[1]?.trim() || '';

    // 解析 description
    const descMatch = fmText.match(/^description:\s*(.*)$/m);
    fm.description = descMatch?.[1]?.trim() || '';

    // 解析 tags
    const tagsMatch = fmText.match(/^tags:\s*\[(.*)\]$/m);
    if (tagsMatch?.[1]) {
      fm.tags = tagsMatch[1].split(',').map((t: string) => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    } else {
      fm.tags = [];
    }

    return {
      title: fm.title || '',
      date: fm.date || '',
      description: fm.description || '',
      tags: fm.tags || []
    };
  } catch (e) {
    console.error('解析 frontmatter 失败:', e);
    return { title: '', date: '', description: '', tags: [] };
  }
}

// 检查信息是否完整
function checkFrontmatterComplete(fm: Frontmatter): boolean {
  return !!(fm.title && fm.date && fm.description && fm.tags.length > 0);
}

/* ---- 预览渲染 ---- */
/** 替换 markdown 中的本地图片路径为可访问的 API URL */
function resolveLocalImagePaths(markdown: string): string {
  return markdown.replace(/\]\(\.\/images\//g, '](/api/blog-images/');
}

const renderedHtml = computed(() => {
  try {
    const content = markdownContent.value;
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (fmMatch && fmMatch[1] && fmMatch[2] !== undefined) {
      const fmHtml = renderFrontmatterCard(fmMatch[1]);
      const bodyWithImages = resolveLocalImagePaths(fmMatch[2]);
      const bodyHtml = marked.parse(bodyWithImages, { breaks: true }) as string;
      return fmHtml + bodyHtml;
    }
    const contentWithImages = resolveLocalImagePaths(content);
    return marked.parse(contentWithImages, { breaks: true }) as string;
  } catch {
    return '<p style="color:#e07a7a">渲染错误</p>';
  }
});

function renderFrontmatterCard(fmText: string): string {
  const lines = fmText.split('\n').filter(Boolean);
  const rows = lines.map((line) => {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m && m[1] && m[2] !== undefined) {
      const key = m[1];
      const val = escapeHtml(m[2].trim());
      return `<div class="fm-row"><span class="fm-key">${escapeHtml(key)}</span><span class="fm-val">${val}</span></div>`;
    }
    return `<div class="fm-row"><span class="fm-val">${escapeHtml(line)}</span></div>`;
  }).join('');
  return `<div class="frontmatter-card"><div class="fm-header">Frontmatter</div>${rows}</div>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---- 内容更新回调 ---- */
function onEditorUpdate(content: string) {
  markdownContent.value = content;
}

/* ---- 监听内容变化自动刷新大纲 ---- */
watch(markdownContent, () => {
  nextTick(() => refreshOutline());
});

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

/* ---- 保存流程 ---- */
async function handleSaveClick() {
  if (!canSave.value) return;

  // 解析 frontmatter
  const content = await editorRef.value?.getMarkdown() || markdownContent.value;
  parsedFrontmatter.value = parseFrontmatter(content);
  hasIncompleteInfo.value = !checkFrontmatterComplete(parsedFrontmatter.value);

  // 显示确认对话框
  showConfirmDialog.value = true;
}

async function confirmSave() {
  showConfirmDialog.value = false;
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

function cancelSave() {
  showConfirmDialog.value = false;
}

function handleBack() {
  router.push("/admin/posts");
}

/* ---- 快捷键 ---- */
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    handleSaveClick();
  }
}

/* ---- 编辑器命令转发 ---- */
function exec(method: string, ...args: any[]) {
  if (editorRef.value && typeof (editorRef.value as any)[method] === 'function') {
    ((editorRef.value as any)[method] as Function)(...args);
  }
}

/* ---- 预览分割栏拖拽 ---- */
function startResize(e: MouseEvent) {
  e.preventDefault();
  isResizing.value = true;

  const splitEl = (e.target as HTMLElement).closest('.editor-split') as HTMLElement;
  if (!splitEl) return;
  const rect = splitEl.getBoundingClientRect();

  function onMouseMove(ev: MouseEvent) {
    const x = ev.clientX - rect.left;
    const ratio = x / rect.width;
    splitRatio.value = Math.max(0.25, Math.min(0.75, ratio));
  }

  function onMouseUp() {
    isResizing.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// 切换编辑/源码模式
function toggleMode() {
  if (editorRef.value?.toggleMode) {
    editorRef.value.toggleMode();
  }
}

// 监听编辑器模式变化
watch(() => editorRef.value?.mode, (newMode) => {
  if (newMode) {
    mode.value = newMode;
  }
}, { immediate: true });

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

/* ---- 导入/导出 ---- */
function handleExport() {
  const content = markdownContent.value;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (filename.value || 'untitled') + '.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("导出成功", "文件已下载");
}

function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.md,.markdown,.txt';
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      markdownContent.value = content;
      const name = file.name.replace(/\.(md|markdown|txt)$/i, '');
      if (name) filename.value = name;
      nextTick(() => refreshOutline());
      toast.success("导入成功", `已加载文件: ${file.name}`);
    };
    reader.onerror = () => {
      toast.error("导入失败", "文件读取错误");
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ---- 标签输入 ---- */
function handleAddTag(e: KeyboardEvent) {
  const target = e.target as HTMLInputElement;
  const tag = target.value.trim();
  if (tag && !parsedFrontmatter.value.tags.includes(tag)) {
    parsedFrontmatter.value.tags.push(tag);
    target.value = '';
  }
}
</script>

<template>
  <div class="new-post-page" :class="theme" @keydown="handleKeydown">
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
          <button class="top-btn" @click="handleImport" title="导入文件">
            <LucideUpload class="icon-sm" />
            <span>导入</span>
          </button>
          <button class="top-btn" @click="handleExport" title="导出文件">
            <LucideDownload class="icon-sm" />
            <span>导出</span>
          </button>
          <button class="top-btn theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'">
            <LucideSun v-if="theme === 'dark'" class="icon-sm" />
            <LucideMoon v-else class="icon-sm" />
          </button>
          <button class="top-btn" @click="handleBack">取消</button>
          <button class="top-btn primary" :disabled="!canSave" @click="handleSaveClick">
            {{ isSaving ? "保存中..." : "保存" }}
          </button>
        </div>
      </div>
    </header>

    <!-- 编辑器主体 -->
    <div class="editor-body">
      <!-- 左栏：目录大纲 -->
      <div v-if="showToc" class="toc-col">
        <div class="toc-hd">
          <span class="toc-label">大纲</span>
          <button class="toc-close" @click="showToc = false" title="收起大纲">
            <LucideX class="icon-xs" />
          </button>
        </div>
        <div class="toc-body">
          <div v-if="headings.length === 0" class="toc-empty">暂无标题</div>
          <button v-for="(h, i) in headings" :key="i" class="toc-item" :class="'toc-level-' + h.level"
            @click="scrollToHeading(h.id)">
            {{ h.text || '(空标题)' }}
          </button>
        </div>
      </div>

      <!-- 中栏：编辑器 + 预览 -->
      <div class="editor-col" :class="{ 'editor-full': !showPreview }">
        <!-- 格式工具栏 -->
        <div class="fmt-bar">
          <button v-if="!showToc" class="fmt-btn toggle-sidebar" title="展开大纲" @click="showToc = true">
            <LucideFileText class="icon-sm" />
          </button>

          <button class="fmt-btn" title="标题 1" @click="insertMark('h1')"><strong>H1</strong></button>
          <button class="fmt-btn" title="标题 2" @click="insertMark('h2')"><strong>H2</strong></button>
          <button class="fmt-btn" title="标题 3" @click="insertMark('h3')"><strong>H3</strong></button>
          <span class="fmt-divider"></span>
          <button class="fmt-btn" title="粗体" @click="insertMark('bold')"><strong>B</strong></button>
          <button class="fmt-btn" title="斜体" @click="insertMark('italic')"><em>I</em></button>
          <button class="fmt-btn" title="删除线" @click="insertMark('strike')"><s>S</s></button>
          <span class="fmt-divider"></span>
          <button class="fmt-btn" title="链接" @click="insertMark('link')">🔗</button>
          <button class="fmt-btn" title="图片" @click="insertMark('image')">
            <LucideImage class="icon-sm" />
          </button>
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
          <button class="fmt-btn mode-toggle" :title="mode === 'source' ? '切换到编辑模式' : '切换到源码模式'"
            @click="toggleMode">
            {{ mode === 'source' ? '◂ 编辑' : '◂ 源码' }}
          </button>
          <button class="fmt-btn preview-toggle" :class="{ active: showPreview }" :title="showPreview ? '隐藏预览' : '显示预览'"
            @click="showPreview = !showPreview">
            {{ showPreview ? ' 预览' : '◂ 预览' }}
          </button>
        </div>

        <!-- Milkdown WYSIWYG 编辑器 + 预览 分栏 -->
        <div class="editor-split" :class="{ resizing: isResizing }">
          <div class="editor-area" :style="{ flex: showPreview ? `0 0 ${splitRatio * 100}%` : '1 1 100%' }">
            <ClientOnly>
              <MarkdownEditor ref="editorRef" :model-value="markdownContent" @update:model-value="onEditorUpdate" />
              <template #fallback>
                <div class="editor-loading">编辑器加载中...</div>
              </template>
            </ClientOnly>
          </div>

          <div v-if="showPreview" class="split-divider" @mousedown="startResize" />
          <div v-if="showPreview" class="preview-panel" :style="{ flex: `0 0 ${(1 - splitRatio) * 100}%` }">
            <div class="preview-header">
              <span class="preview-title">实时预览</span>
              <button class="preview-close-btn" @click="showPreview = false" title="关闭预览">
                <LucideX class="icon-xs" />
              </button>
            </div>
            <div class="preview-body" v-html="renderedHtml"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 保存确认对话框 -->
    <Transition name="fade">
      <div v-if="showConfirmDialog" class="confirm-dialog-overlay" @click.self="cancelSave">
        <div class="confirm-dialog">
          <div class="dialog-header">
            <h3 class="dialog-title">
              <LucideAlertCircle class="icon-md"
                :class="{ 'text-warning': hasIncompleteInfo, 'text-success': !hasIncompleteInfo }" />
              保存前检查
            </h3>
            <button class="dialog-close" @click="cancelSave">
              <LucideX class="icon-sm" />
            </button>
          </div>

          <div class="dialog-body">
            <div v-if="hasIncompleteInfo" class="warning-banner">
              <LucideAlertCircle class="icon-sm" />
              <span>以下信息不完整，请补充后保存</span>
            </div>

            <div class="info-grid">
              <div class="info-item" :class="{ 'incomplete': !parsedFrontmatter.title }">
                <label class="info-label">
                  <LucideFileText class="icon-xs" />
                  标题
                </label>
                <input v-model="parsedFrontmatter.title" type="text" class="info-input"
                  :class="{ 'has-error': !parsedFrontmatter.title }" placeholder="请输入文章标题">
              </div>

              <div class="info-item" :class="{ 'incomplete': !parsedFrontmatter.date }">
                <label class="info-label">
                  <LucideCalendar class="icon-xs" />
                  日期
                </label>
                <input v-model="parsedFrontmatter.date" type="date" class="info-input"
                  :class="{ 'has-error': !parsedFrontmatter.date }">
              </div>

              <div class="info-item info-item-full" :class="{ 'incomplete': !parsedFrontmatter.description }">
                <label class="info-label">
                  <LucideFileText class="icon-xs" />
                  描述
                </label>
                <input v-model="parsedFrontmatter.description" type="text" class="info-input"
                  :class="{ 'has-error': !parsedFrontmatter.description }" placeholder="请输入文章描述">
              </div>

              <div class="info-item info-item-full" :class="{ 'incomplete': parsedFrontmatter.tags.length === 0 }">
                <label class="info-label">
                  <LucideTag class="icon-xs" />
                  标签
                </label>
                <div class="tags-container">
                  <span v-for="(tag, index) in parsedFrontmatter.tags" :key="index" class="tag-badge">
                    {{ tag }}
                    <button class="tag-remove" @click="parsedFrontmatter.tags.splice(index, 1)">
                      <LucideX class="icon-xs" />
                    </button>
                  </span>
                  <input type="text" class="tag-input" placeholder="输入标签后按回车" @keydown.enter.prevent="handleAddTag">
                </div>
              </div>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn-secondary" @click="cancelSave">取消</button>
            <button class="btn-primary" @click="confirmSave" :disabled="hasIncompleteInfo">
              <LucideCheck class="icon-sm" />
              确认保存
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 保存结果 -->
    <Transition name="fade">
      <div v-if="saveResult" class="save-result">
        <div class="save-result-text">
          <p class="save-result-title">✅ 文章已保存</p>
          <span class="save-result-hint">本地图片将在后台自动上传到图床</span>
        </div>
        <div class="save-result-actions">
          <NuxtLink :to="saveResult.path" class="btn-primary-sm">查看文章</NuxtLink>
          <button class="btn-ghost-sm" @click="handleBack">返回列表</button>
        </div>
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
  margin: 0 auto;
  padding: 0 1.5rem;
  background: var(--editor-bg);
  color: var(--editor-text);
  transition: background 0.3s ease, color 0.3s ease;
}

/* ===== 顶部栏 ===== */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--editor-border-light);
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
  color: var(--editor-text-soft);
  text-decoration: none;
  transition: color 0.2s;
}

.bc-link:hover {
  color: var(--editor-gold-soft);
}

.bc-sep {
  color: var(--editor-text-soft);
  font-size: 0.65rem;
}

.bc-current {
  color: var(--editor-gold-soft);
  font-weight: 600;
}

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

.file-pre,
.file-suf {
  color: var(--editor-text-soft);
  white-space: nowrap;
}

.file-input {
  width: 11rem;
  padding: 0.3rem 0.45rem;
  border: 1px solid var(--editor-border);
  border-radius: 4px;
  background: var(--editor-input-bg);
  color: var(--editor-text);
  font-family: inherit;
  font-size: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.file-input:focus {
  border-color: var(--editor-gold);
  box-shadow: 0 0 0 2px rgba(183, 140, 77, 0.1);
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.top-btn {
  padding: 0.3rem 0.7rem;
  border: 1px solid var(--editor-border);
  border-radius: 5px;
  background: transparent;
  color: var(--editor-text-soft);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.top-btn:hover {
  border-color: var(--editor-gold);
  color: var(--editor-text);
}

.top-btn.theme-toggle {
  font-size: 1rem;
  padding: 0.3rem 0.5rem;
}

.top-btn.primary {
  background: var(--editor-gold);
  border-color: var(--editor-gold);
  color: #140f0d;
  font-weight: 600;
}

.top-btn.primary:hover {
  background: var(--editor-gold-soft);
  border-color: var(--editor-gold-soft);
}

.top-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ===== 图标 ===== */
.icon-xs {
  width: 0.75rem;
  height: 0.75rem;
}

.icon-sm {
  width: 0.875rem;
  height: 0.875rem;
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

.text-warning {
  color: #f59e0b;
}

.text-success {
  color: #10b981;
}

/* ===== 编辑器主体 ===== */
.editor-body {
  flex: 1;
  display: flex;
  min-height: 0;
  border: 1px solid var(--editor-border-light);
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
  border-right: 1px solid var(--editor-border-light);
  background: var(--editor-panel-bg);
  flex-shrink: 0;
}

.toc-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--editor-border-light);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--editor-text-soft);
  flex-shrink: 0;
}

.toc-close {
  background: none;
  border: none;
  color: var(--editor-text-soft);
  cursor: pointer;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  transition: all 0.12s;
  display: inline-flex;
  align-items: center;
}

.toc-close:hover {
  background: rgba(183, 140, 77, 0.15);
  color: var(--editor-text);
}

.toc-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.4rem 0;
}

.toc-empty {
  padding: 1rem 0.75rem;
  color: var(--editor-text-soft);
  font-size: 0.78rem;
  text-align: center;
}

.toc-item {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: var(--editor-text-soft);
  font-size: 0.78rem;
  padding: 0.3rem 0.75rem;
  cursor: pointer;
  transition: all 0.12s;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toc-item:hover {
  color: var(--editor-gold-soft);
  background: rgba(183, 140, 77, 0.08);
}

.toc-level-1 {
  padding-left: 0.75rem;
  font-weight: 600;
  color: var(--editor-gold-soft);
}

.toc-level-2 {
  padding-left: 1.5rem;
}

.toc-level-3 {
  padding-left: 2.25rem;
  font-size: 0.72rem;
}

.toc-level-4 {
  padding-left: 3rem;
  font-size: 0.68rem;
}

.toc-level-5 {
  padding-left: 3.75rem;
  font-size: 0.65rem;
}

.toc-level-6 {
  padding-left: 4.5rem;
  font-size: 0.62rem;
}

/* ===== 中栏：编辑器 ===== */
.editor-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

/* ===== 编辑器 + 预览分栏 ===== */
.editor-split {
  flex: 1;
  display: flex;
  flex-direction: row;
  min-height: 0;
  overflow: hidden;
}

.editor-split.resizing {
  cursor: col-resize;
  user-select: none;
}

.editor-area {
  min-width: 200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.split-divider {
  width: 5px;
  flex-shrink: 0;
  cursor: col-resize;
  background: transparent;
  position: relative;
  z-index: 10;
  transition: background 0.12s;
}

.split-divider::after {
  content: '';
  position: absolute;
  left: -4px;
  right: -4px;
  top: 0;
  bottom: 0;
}

.split-divider:hover,
.editor-split.resizing .split-divider {
  background: var(--editor-gold, #b78c4d);
}

/* 格式工具栏 */
.fmt-bar {
  display: flex;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
  padding: 0.3rem 0.75rem;
  background: var(--editor-toolbar-bg);
  border-bottom: 1px solid var(--editor-border-light);
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
  color: var(--editor-text-soft);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.12s;
}

.fmt-btn:hover {
  background: rgba(183, 140, 77, 0.15);
  color: var(--editor-text);
}

.fmt-btn code {
  font-size: 0.75rem;
  color: var(--editor-gold-soft);
}

.fmt-btn.active {
  background: rgba(183, 140, 77, 0.15);
  color: var(--editor-gold-soft);
}

.fmt-btn.toggle-sidebar,
.fmt-btn.preview-toggle,
.fmt-btn.mode-toggle {
  font-size: 0.7rem;
  min-width: auto;
  padding: 0 0.4rem;
  color: var(--editor-text-soft);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.fmt-btn.preview-toggle:hover,
.fmt-btn.toggle-sidebar:hover,
.fmt-btn.mode-toggle:hover {
  color: var(--editor-gold-soft);
}

.fmt-divider {
  width: 1px;
  height: 0.9rem;
  margin: 0 0.2rem;
  background: var(--editor-border);
  flex-shrink: 0;
}

/* 加载占位 */
.editor-loading {
  flex: 1;
  display: grid;
  place-items: center;
  min-height: 300px;
  color: var(--editor-text-soft);
  font-size: 0.9rem;
}

/* ===== 预览面板 ===== */
.preview-panel {
  min-width: 260px;
  background: var(--editor-bg-soft);
  border-left: 1px solid var(--editor-border-light, rgba(183, 140, 77, 0.12));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 0.5rem 0.75rem;
  background: var(--editor-toolbar-bg);
  border-bottom: 1px solid var(--editor-border-light);
}

.preview-title {
  color: var(--editor-gold-soft);
  font-weight: 600;
  letter-spacing: 0.05em;
  font-size: 0.75rem;
}

.preview-close-btn {
  background: none;
  border: none;
  color: var(--editor-text-soft);
  cursor: pointer;
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  transition: all 0.12s;
  display: inline-flex;
  align-items: center;
}

.preview-close-btn:hover {
  background: rgba(183, 140, 77, 0.15);
  color: var(--editor-text);
}

.preview-body {
  flex: 1;
  padding: 1rem 1.25rem;
  overflow-y: auto;
  line-height: 1.8;
  color: var(--editor-text);
  font-size: 0.9rem;
}

/* 预览 Markdown 渲染样式 */
.preview-body :deep(h1),
.preview-body :deep(h2),
.preview-body :deep(h3),
.preview-body :deep(h4) {
  color: var(--editor-gold-soft);
  margin: 1em 0 0.4em;
  line-height: 1.3;
}

.preview-body :deep(h1) {
  font-size: 1.5rem;
  border-bottom: 1px solid var(--editor-border-light);
  padding-bottom: 0.2rem;
}

.preview-body :deep(h2) {
  font-size: 1.25rem;
}

.preview-body :deep(h3) {
  font-size: 1.05rem;
}

.preview-body :deep(p) {
  margin: 0.6em 0;
}

.preview-body :deep(a) {
  color: var(--editor-gold);
  text-decoration: underline;
}

.preview-body :deep(blockquote) {
  border-left: 3px solid var(--editor-gold);
  padding-left: 0.8rem;
  margin: 0.8em 0;
  color: var(--editor-text-soft);
  font-style: italic;
}

.preview-body :deep(code) {
  background: var(--editor-code-bg);
  padding: 0.12rem 0.35rem;
  border-radius: 3px;
  font-family: Consolas, Monaco, monospace;
  font-size: 0.88em;
  color: var(--editor-gold-soft);
}

.preview-body :deep(pre) {
  border: 1px solid var(--editor-border);
  border-radius: 6px;
  padding: 0.75rem;
  overflow-x: auto;
  background: var(--editor-pre-bg);
}

.preview-body :deep(pre code) {
  background: none;
  padding: 0;
}

.preview-body :deep(ul),
.preview-body :deep(ol) {
  padding-left: 1.5rem;
}

.preview-body :deep(li) {
  margin: 0.25em 0;
}

.preview-body :deep(img) {
  max-width: 100%;
  border-radius: 6px;
  margin: 0.5rem 0;
}

.preview-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--editor-border);
  margin: 1.5rem 0;
}

.preview-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.8rem 0;
}

.preview-body :deep(th),
.preview-body :deep(td) {
  border: 1px solid var(--editor-border);
  padding: 0.35rem 0.6rem;
  text-align: left;
  font-size: 0.85rem;
}

.preview-body :deep(th) {
  background: rgba(183, 140, 77, 0.06);
  color: var(--editor-gold-soft);
}

.preview-body :deep(input[type="checkbox"]) {
  margin-right: 0.3rem;
}

/* ---- Frontmatter 预览卡片 ---- */
.preview-body :deep(.frontmatter-card) {
  margin: 0.5rem 0 1.2rem;
  padding: 0.8rem 1rem;
  border: 1px solid var(--editor-border, rgba(183, 140, 77, 0.28));
  border-radius: 8px;
  background: var(--editor-panel-bg);
  font-size: 0.82rem;
}

.preview-body :deep(.fm-header) {
  font-size: 0.65rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--editor-gold);
  margin-bottom: 0.6rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(183, 140, 77, 0.15);
}

.preview-body :deep(.fm-row) {
  display: flex;
  gap: 0.6rem;
  padding: 0.2rem 0;
  line-height: 1.6;
}

.preview-body :deep(.fm-key) {
  flex-shrink: 0;
  min-width: 5rem;
  color: var(--editor-gold-soft);
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 0.78rem;
}

.preview-body :deep(.fm-val) {
  color: var(--editor-text-soft);
  word-break: break-all;
}

/* ===== 确认对话框 ===== */
.confirm-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.confirm-dialog {
  background: var(--editor-bg);
  border: 1px solid var(--editor-border);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--editor-border-light);
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--editor-text);
}

.dialog-close {
  background: none;
  border: none;
  color: var(--editor-text-soft);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
}

.dialog-close:hover {
  background: rgba(183, 140, 77, 0.15);
  color: var(--editor-text);
}

.dialog-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 6px;
  color: #f59e0b;
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item-full {
  grid-column: 1 / -1;
}

.info-item.incomplete .info-label {
  color: #ef4444;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--editor-text-soft);
}

.info-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--editor-border);
  border-radius: 6px;
  background: var(--editor-input-bg);
  color: var(--editor-text);
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s;
}

.info-input:focus {
  border-color: var(--editor-gold);
  box-shadow: 0 0 0 3px rgba(183, 140, 77, 0.1);
}

.info-input.has-error {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.info-input.has-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.info-input::placeholder {
  color: var(--editor-text-soft);
  opacity: 0.6;
}

/* 标签输入 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--editor-border);
  border-radius: 6px;
  background: var(--editor-input-bg);
  min-height: 2.5rem;
  align-items: center;
  transition: all 0.2s;
}

.tags-container:focus-within {
  border-color: var(--editor-gold);
  box-shadow: 0 0 0 3px rgba(183, 140, 77, 0.1);
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(183, 140, 77, 0.15);
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--editor-gold-soft);
}

.tag-remove {
  background: none;
  border: none;
  color: var(--editor-text-soft);
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  transition: color 0.15s;
}

.tag-remove:hover {
  color: var(--editor-text);
}

.tag-input {
  flex: 1;
  min-width: 120px;
  border: none;
  background: none;
  color: var(--editor-text);
  font-size: 0.9rem;
  outline: none;
}

.tag-input::placeholder {
  color: var(--editor-text-soft);
  opacity: 0.6;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--editor-border-light);
}

.btn-secondary {
  padding: 0.5rem 1.25rem;
  border: 1px solid var(--editor-border);
  border-radius: 6px;
  background: transparent;
  color: var(--editor-text-soft);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary:hover {
  border-color: var(--editor-gold);
  color: var(--editor-text);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 6px;
  background: var(--editor-gold);
  color: #140f0d;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--editor-gold-soft);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== 保存结果 ===== */
.save-result {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  background: var(--editor-bg);
  border: 1px solid rgba(110, 201, 143, 0.3);
  z-index: 100;
}

.save-result-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.save-result-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.save-result p {
  margin: 0;
  font-size: 0.92rem;
  color: #6ec98f;
  font-weight: 600;
}

.save-result-title {
  margin: 0;
  font-size: 0.92rem;
  color: #6ec98f;
  font-weight: 600;
}

.save-result-hint {
  font-size: 0.72rem;
  color: var(--editor-text-soft, #ccc2b0);
  opacity: 0.7;
}

.btn-primary-sm {
  padding: 0.35rem 0.75rem;
  border-radius: 5px;
  border: none;
  background: var(--editor-gold);
  color: #140f0d;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.2s;
}

.btn-primary-sm:hover {
  opacity: 0.85;
}

.btn-ghost-sm {
  padding: 0.35rem 0.75rem;
  border-radius: 5px;
  border: 1px solid var(--editor-border);
  background: transparent;
  color: var(--editor-text-soft);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-ghost-sm:hover {
  border-color: var(--editor-gold);
  color: var(--editor-text);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== 响应式 ===== */
@media (max-width: 1100px) {
  .toc-col {
    width: 160px;
    min-width: 120px;
  }

  .preview-col {
    width: 32%;
    min-width: 200px;
  }
}

@media (max-width: 860px) {
  .new-post-page {
    padding: 0 0.75rem;
  }

  .toc-col {
    display: none;
  }

  .preview-col {
    display: none;
  }
}

@media (max-width: 640px) {
  .top-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
    padding: 0.35rem 0;
  }

  .top-right {
    justify-content: space-between;
  }

  .file-input {
    width: 8rem;
  }
}
</style>