<script setup lang="ts">
/**
 * MarkdownEditor 组件 — 双模式编辑器
 *
 * 支持源代码模式（textarea）和 WYSIWYG 模式（Milkdown）切换。
 * 两种模式共享统一的 exposed 接口。
 */

import { MilkdownProvider } from '@milkdown/vue';
import MilkdownEditorInner from './MilkdownEditorInner.vue';
import ImageUploadDialog from './ImageUploadDialog.vue';

interface HeadingItem {
  text: string;
  level: number;
  id: string;
}

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits(['update:modelValue']);

/* ---- Frontmatter 处理 ---- */
// Milkdown 的 markdown 解析器不认识 frontmatter，需要在切换模式时剥离/还原
const savedFrontmatter = ref('');
const isSyncing = ref(false);

function extractFrontmatter(content: string): { frontmatter: string; body: string } {
  const match = content.match(/^(---\n[\s\S]*?\n---\n?)([\s\S]*)$/);
  if (match && match[1] && match[2] !== undefined) {
    return { frontmatter: match[1], body: match[2] };
  }
  return { frontmatter: '', body: content };
}

function rejoinFrontmatter(body: string): string {
  if (!savedFrontmatter.value) return body;
  // 确保 frontmatter 和 body 之间有空行
  const trimmedBody = body.replace(/^\n+/, '');
  return savedFrontmatter.value + '\n' + trimmedBody;
}

/* ---- 图片相关状态 ---- */
const showImageDialog = ref(false);
const imageCounter = ref(0);

/* ---- 模式切换 ---- */
const mode = ref<'source' | 'wysiwyg'>('source');

/* ---- Frontmatter 解析为显示行（WYSIWYG 模式只读卡片） ---- */
interface FmField {
  key: string;
  value: string;
}

interface FrontmatterData {
  title: string;
  date: string;
  description: string;
  tags: string[];
  others: FmField[];
}

const fmData = reactive<FrontmatterData>({ title: '', date: '', description: '', tags: [], others: [] });
const fmTagInput = ref<HTMLInputElement | null>(null);
let isUpdatingFm = false;

function parseFrontmatterData(fm: string): FrontmatterData {
  const inner = fm.replace(/^---\n/, '').replace(/\n---\n?$/, '');
  const lines = inner.split('\n');
  const data: FrontmatterData = { title: '', date: '', description: '', tags: [], others: [] };
  
  for (const line of lines) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m || m.length < 3) continue;
    
    const key = m[1] ?? '';
    const val = m[2] ?? '';
    
    switch (key) {
      case 'title': 
        data.title = val; 
        break;
      case 'date': 
        data.date = val; 
        break;
      case 'description': 
        data.description = val; 
        break;
      case 'tags':
        data.tags = val.replace(/^\[|\]$/g, '').split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        break;
      default: 
        data.others.push({ key, value: val }); 
        break;
    }
  }
  return data;
}

function buildFrontmatter(data: FrontmatterData): string {
  let fm = '---\n';
  fm += `title: ${data.title}\n`;
  fm += `date: ${data.date}\n`;
  fm += `description: ${data.description}\n`;
  const tagsStr = data.tags.length ? data.tags.map(t => t.includes(' ') ? `"${t}"` : t).join(', ') : '';
  fm += `tags: [${tagsStr}]\n`;
  for (const other of data.others) {
    fm += `${other.key}: ${other.value}\n`;
  }
  fm += '---\n';
  return fm;
}

function syncFmDataFromSaved() {
  if (isUpdatingFm) return;
  if (!savedFrontmatter.value) {
    fmData.title = '';
    fmData.date = '';
    fmData.description = '';
    fmData.tags = [];
    fmData.others = [];
    return;
  }
  const parsed = parseFrontmatterData(savedFrontmatter.value);
  Object.assign(fmData, parsed);
}

function syncSavedFromFmData() {
  isUpdatingFm = true;
  const newFm = buildFrontmatter(fmData);
  if (newFm !== savedFrontmatter.value) {
    savedFrontmatter.value = newFm;
    // 防抖发射,避免父组件重渲染抢走焦点
    if (fmEmitTimer) {
      clearTimeout(fmEmitTimer);
    }
    fmEmitTimer = setTimeout(() => {
      emit('update:modelValue', rejoinFrontmatter(sourceContent.value));
    }, 400);
  }
  nextTick(() => { isUpdatingFm = false; });
}

function flushFmEmit() {
  if (fmEmitTimer) {
    clearTimeout(fmEmitTimer);
    fmEmitTimer = null;
    emit('update:modelValue', rejoinFrontmatter(sourceContent.value));
  }
}

const editorInnerMethods = ref<any>(null);

let fmEmitTimer: ReturnType<typeof setTimeout> | null = null;

watch(savedFrontmatter, () => syncFmDataFromSaved());

function addFmTag() {
  const el = fmTagInput.value;
  if (!el) return;
  const tag = el.value.trim();
  if (tag && !fmData.tags.includes(tag)) {
    fmData.tags.push(tag);
    el.value = '';
    syncSavedFromFmData();
  }
}

function removeFmTag(index: number) {
  fmData.tags.splice(index, 1);
  syncSavedFromFmData();
}

/* ---- Frontmatter 键盘导航 ---- */
const FM_FIELDS = ['title', 'date', 'description'] as const;

function onFmEnter(e: KeyboardEvent, nextField?: string) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (nextField) {
      const next = (e.target as HTMLElement)
        .closest('.fm-card')
        ?.querySelector<HTMLInputElement>(`[data-fm="${nextField}"]`);
      next?.focus();
      next?.select();
    }
  }
}

function onFmTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    const el = e.target as HTMLInputElement;
    if (el.value.trim()) {
      addFmTag();
    } else {
      // 空 Enter → 聚焦编辑器正文
      e.preventDefault();
      document.querySelector<HTMLElement>('.ProseMirror')?.focus();
    }
  }
  if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value) {
    // 空输入时退格删除最后一个 tag
    if (fmData.tags.length) {
      removeFmTag(fmData.tags.length - 1);
    }
  }
}

function onFmFieldFocus(e: FocusEvent) {
  (e.target as HTMLInputElement).select();
}

/* ---- 源代码模式状态 ---- */
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const sourceContent = ref(props.modelValue || '');
/** Milkdown 初始化时传入的 content，稳定不变，避免每次输入都触发 MilkdownEditorInner 重渲染 */
const milkdownBody = ref('');

// 同步外部 modelValue 变化
watch(() => props.modelValue, (val) => {
  if (val === undefined || isSyncing.value) return;

  const { frontmatter, body: rawBody } = extractFrontmatter(val);
  // extractFrontmatter 提取的 body 带有 frontmatter 与正文之间的换行，统一去除
  const body = rawBody.replace(/^\n+/, '');

  if (mode.value === 'wysiwyg') {
    if (frontmatter) savedFrontmatter.value = frontmatter;
    // body 变化说明是外部导入/切换文档，同步到 Milkdown
    if (body !== sourceContent.value && editorInnerMethods.value) {
      sourceContent.value = body;
      milkdownBody.value = body;
      editorInnerMethods.value.setMarkdown(body);
    }
  } else {
    if (val !== sourceContent.value) {
      sourceContent.value = val;
    }
  }
});

/* ---- 模式切换时同步内容 ---- */
async function toggleMode() {
  if (mode.value === 'source') {
    // source → wysiwyg：剥离 frontmatter，只把 body 推送到 Milkdown
    const { frontmatter, body } = extractFrontmatter(sourceContent.value);
    savedFrontmatter.value = frontmatter;
    milkdownBody.value = body;
    sourceContent.value = body;
    isSyncing.value = true;
    mode.value = 'wysiwyg';
    await nextTick();
    const checkAndSet = (attempts = 0) => {
      if (editorInnerMethods.value) {
        editorInnerMethods.value.setMarkdown(body);
        setTimeout(() => { isSyncing.value = false; }, 200);
      } else if (attempts < 20) {
        setTimeout(() => checkAndSet(attempts + 1), 100);
      } else {
        isSyncing.value = false;
      }
    };
    checkAndSet();
  } else {
    // wysiwyg → source：从 Milkdown 拉取 body，重新拼接 frontmatter
    flushFmEmit();
    if (editorInnerMethods.value) {
      const body = await editorInnerMethods.value.getMarkdown();
      sourceContent.value = rejoinFrontmatter(body);
      emit('update:modelValue', sourceContent.value);
    }
    mode.value = 'source';
  }
}

/* ---- WYSIWYG 编辑器就绪回调 ---- */
function handleEditorReady(methods: any) {
  editorInnerMethods.value = methods;
}

/* ---- 防抖输出（源代码模式） ---- */
let emitTimer: ReturnType<typeof setTimeout> | null = null;

function handleSourceInput() {
  if (emitTimer) clearTimeout(emitTimer);
  emitTimer = setTimeout(() => {
    emit('update:modelValue', sourceContent.value);
  }, 300);
}

/* ---- WYSIWYG 内容变化回调 ---- */
function handleWysiwygUpdate(body: string) {
  // 模式切换同步期间忽略 Milkdown 的内容变化回调，防止内容追加
  if (isSyncing.value) return;
  // 防御性提取：防止 Milkdown 内容中意外包含 frontmatter
  const { frontmatter, body: cleanBody } = extractFrontmatter(body);
  if (frontmatter) savedFrontmatter.value = frontmatter;
  // WYSIWYG 模式下只存储 body，frontmatter 在切回源码模式时再拼接
  sourceContent.value = cleanBody;
  emit('update:modelValue', rejoinFrontmatter(cleanBody));
}

/* ---- 光标操作辅助（源代码模式） ---- */

function getSelection(): { start: number; end: number; text: string } {
  const el = textareaRef.value;
  if (!el) return { start: 0, end: 0, text: '' };
  return {
    start: el.selectionStart,
    end: el.selectionEnd,
    text: sourceContent.value.substring(el.selectionStart, el.selectionEnd),
  };
}

function replaceSelection(replacement: string) {
  const el = textareaRef.value;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const before = sourceContent.value.substring(0, start);
  const after = sourceContent.value.substring(end);
  sourceContent.value = before + replacement + after;
  handleSourceInput();
  nextTick(() => {
    el.focus();
    const cursorPos = start + replacement.length;
    el.setSelectionRange(cursorPos, cursorPos);
  });
}

function wrapSelection(prefix: string, suffix: string, placeholder: string) {
  const { start, end, text } = getSelection();
  const selected = text || placeholder;
  const replacement = prefix + selected + suffix;
  const el = textareaRef.value;
  if (!el) return;
  const before = sourceContent.value.substring(0, start);
  const after = sourceContent.value.substring(end);
  sourceContent.value = before + replacement + after;
  handleSourceInput();
  nextTick(() => {
    el.focus();
    if (text) {
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    } else {
      el.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
    }
  });
}

function insertAtLineStart(prefix: string) {
  const el = textareaRef.value;
  if (!el) return;
  const { start } = getSelection();
  const lineStart = sourceContent.value.lastIndexOf('\n', start - 1) + 1;
  const before = sourceContent.value.substring(0, lineStart);
  const after = sourceContent.value.substring(lineStart);
  sourceContent.value = before + prefix + after;
  handleSourceInput();
  nextTick(() => {
    el.focus();
    el.setSelectionRange(start + prefix.length, start + prefix.length);
  });
}

/* ---- Tab 键支持 ---- */
function handleKeydown(e: KeyboardEvent) {
  const el = textareaRef.value;
  if (!el) return;

  if (e.key === 'Tab') {
    e.preventDefault();
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (e.shiftKey) {
      const lineStart = sourceContent.value.lastIndexOf('\n', start - 1) + 1;
      const linePrefix = sourceContent.value.substring(lineStart, lineStart + 2);
      if (linePrefix === '  ') {
        sourceContent.value = sourceContent.value.substring(0, lineStart) + sourceContent.value.substring(lineStart + 2);
        handleSourceInput();
        nextTick(() => {
          el.setSelectionRange(Math.max(lineStart, start - 2), Math.max(lineStart, end - 2));
        });
      }
    } else {
      const before = sourceContent.value.substring(0, start);
      const after = sourceContent.value.substring(end);
      sourceContent.value = before + '  ' + after;
      handleSourceInput();
      nextTick(() => {
        el.setSelectionRange(start + 2, start + 2);
      });
    }
  }
}

/* ---- 图片粘贴（源代码模式） ---- */
async function pasteAndSaveImage(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const result = await $fetch<{ success: boolean; path: string; filename: string }>('/api/admin/save-local-image', {
      method: 'POST',
      body: formData,
    });
    if (result.success) {
      imageCounter.value++;
      const markdown = `![picture${imageCounter.value}](${result.path})`;
      const el = textareaRef.value;
      if (!el) return;
      const pos = el.selectionStart;
      const before = sourceContent.value.substring(0, pos);
      const after = sourceContent.value.substring(el.selectionEnd);
      sourceContent.value = before + markdown + after;
      handleSourceInput();
      await nextTick();
      el.focus();
      el.setSelectionRange(pos + markdown.length, pos + markdown.length);
    }
  } catch (err) {
    console.error('本地图片保存失败:', err);
  }
}

function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) {
        pasteAndSaveImage(file);
      }
      return;
    }
  }
}

/* ---- 格式化命令 ---- */

/** 在 WYSIWYG 模式下调用 Milkdown 方法，在源代码模式下操作 textarea */
function proxyToEditor(sourceFn: () => void, wysiwygMethod: string, ...args: any[]) {
  if (mode.value === 'wysiwyg' && editorInnerMethods.value) {
    editorInnerMethods.value[wysiwygMethod](...args);
  } else {
    sourceFn();
  }
}

function toggleBold() {
  proxyToEditor(() => wrapSelection('**', '**', '粗体文本'), 'toggleBold');
}

function toggleItalic() {
  proxyToEditor(() => wrapSelection('*', '*', '斜体文本'), 'toggleItalic');
}

function toggleStrikethrough() {
  proxyToEditor(() => wrapSelection('~~', '~~', '删除线文本'), 'toggleStrikethrough');
}

function toggleHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  proxyToEditor(() => insertAtLineStart('#'.repeat(level) + ' '), 'toggleHeading', level);
}

function toggleBulletList() {
  proxyToEditor(() => insertAtLineStart('- '), 'toggleBulletList');
}

function toggleOrderedList() {
  proxyToEditor(() => insertAtLineStart('1. '), 'toggleOrderedList');
}

function toggleTaskList() {
  proxyToEditor(() => insertAtLineStart('- [ ] '), 'toggleTaskList');
}

function toggleBlockquote() {
  proxyToEditor(() => insertAtLineStart('> '), 'toggleBlockquote');
}

function toggleCodeBlock(language = '') {
  proxyToEditor(() => {
    const { text } = getSelection();
    if (text) {
      wrapSelection('```' + language + '\n', '\n```', '');
    } else {
      replaceSelection('```' + language + '\n代码\n```');
    }
  }, 'toggleCodeBlock', language);
}

function toggleInlineCode() {
  proxyToEditor(() => wrapSelection('`', '`', 'code'), 'toggleInlineCode');
}

function insertLink(url = '') {
  proxyToEditor(() => {
    const { text } = getSelection();
    if (text) {
      wrapSelection('[', `](${url || 'url'})`, '');
    } else {
      replaceSelection(`[链接文本](${url || 'url'})`);
    }
  }, 'insertLink', url);
}

function insertImage(url = '') {
  if (mode.value === 'wysiwyg') {
    if (url) {
      editorInnerMethods.value?.insertImage(url);
    } else {
      showImageDialog.value = true;
    }
  } else {
    imageCounter.value++;
    const alt = `picture${imageCounter.value}`;
    const placeholder = url || 'url';
    replaceSelection(`![${alt}](${placeholder})`);
    nextTick(() => {
      const el = textareaRef.value;
      if (!el) return;
      const idx = sourceContent.value.indexOf(placeholder);
      if (idx >= 0) {
        el.focus();
        el.setSelectionRange(idx, idx + placeholder.length);
      }
    });
  }
}

/** 图片对话框回调：上传的文件 */
async function handleImageFile(file: File) {
  showImageDialog.value = false;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const result = await $fetch<{ success: boolean; path: string; filename: string }>('/api/admin/save-local-image', {
      method: 'POST',
      body: formData,
    });
    if (result.success && mode.value === 'wysiwyg' && editorInnerMethods.value) {
      editorInnerMethods.value.insertImage(`/api/blog-images/${result.filename}`);
    }
  } catch (err) {
    console.error('图片保存失败:', err);
  }
}

/** 图片对话框回调：网络 URL */
function handleImageUrl(url: string) {
  showImageDialog.value = false;
  if (mode.value === 'wysiwyg' && editorInnerMethods.value) {
    editorInnerMethods.value.insertImage(url);
  }
}

function insertHr() {
  proxyToEditor(() => replaceSelection('\n---\n'), 'insertHr');
}

/* ---- 获取/设置内容 ---- */

async function getMarkdown(): Promise<string> {
  if (mode.value === 'wysiwyg' && editorInnerMethods.value) {
    const body = await editorInnerMethods.value.getMarkdown();
    return rejoinFrontmatter(body);
  }
  return sourceContent.value;
}

function setMarkdown(content: string) {
  sourceContent.value = content;
  if (mode.value === 'wysiwyg' && editorInnerMethods.value) {
    const { frontmatter, body } = extractFrontmatter(content);
    savedFrontmatter.value = frontmatter;
    editorInnerMethods.value.setMarkdown(body);
  }
  handleSourceInput();
}

/* ---- 大纲提取 ---- */

function getOutline(): HeadingItem[] {
  if (mode.value === 'wysiwyg' && editorInnerMethods.value) {
    return editorInnerMethods.value.getOutline();
  }
  // 源代码模式：从文本解析
  const lines = sourceContent.value.split('\n');
  const items: HeadingItem[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (match && match[1] && match[2]) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^\w一-鿿]+/g, '-').replace(/(^-|-$)/g, '');
      items.push({ text, level, id });
    }
  }
  return items;
}

/* ---- 导出 ---- */
defineExpose({
  getMarkdown,
  setMarkdown,
  getOutline,
  toggleBold,
  toggleItalic,
  toggleStrikethrough,
  toggleHeading,
  toggleBulletList,
  toggleOrderedList,
  toggleTaskList,
  toggleBlockquote,
  toggleCodeBlock,
  toggleInlineCode,
  insertLink,
  insertImage,
  insertHr,
  mode,
  toggleMode,
});
</script>

<template>
  <div class="md-editor-wrapper">

    <!-- 源代码模式 -->
    <textarea v-if="mode === 'source'" ref="textareaRef" v-model="sourceContent" class="md-textarea" spellcheck="false"
      placeholder="在此输入 Markdown 内容..." @input="handleSourceInput" @keydown="handleKeydown"
      @paste="handlePaste"></textarea>

    <!-- WYSIWYG 模式 -->
    <template v-else>
      <!-- Frontmatter 可编辑卡片 -->
      <div v-if="savedFrontmatter" class="fm-card">
        <div class="fm-card-label">Frontmatter</div>
        <div class="fm-field">
          <span class="fm-field-key">title</span>
          <input v-model="fmData.title" data-fm="title" class="fm-input" placeholder="文章标题"
            @input="syncSavedFromFmData" @keydown="onFmEnter($event, 'date')" @focus="onFmFieldFocus" />
        </div>
        <div class="fm-field">
          <span class="fm-field-key">date</span>
          <input v-model="fmData.date" data-fm="date" class="fm-input fm-input-date" type="date"
            @input="syncSavedFromFmData" @keydown="onFmEnter($event, 'description')" @focus="onFmFieldFocus" />
        </div>
        <div class="fm-field">
          <span class="fm-field-key">description</span>
          <input v-model="fmData.description" data-fm="description" class="fm-input" placeholder="文章描述"
            @input="syncSavedFromFmData" @keydown="onFmEnter($event, 'tags')" @focus="onFmFieldFocus" />
        </div>
        <div class="fm-field">
          <span class="fm-field-key">tags</span>
          <div class="fm-tags-wrap">
            <span v-for="(tag, i) in fmData.tags" :key="i" class="fm-tag">
              {{ tag }}
              <button class="fm-tag-del" @click="removeFmTag(i)">&times;</button>
            </span>
            <input ref="fmTagInput" data-fm="tags" type="text" class="fm-tag-input" placeholder="添加标签"
              @keydown="onFmTagKeydown" />
          </div>
        </div>
        <div v-for="(other, i) in fmData.others" :key="i" class="fm-field">
          <span class="fm-field-key">{{ other.key }}</span>
          <input v-model="other.value" class="fm-input" @input="syncSavedFromFmData" />
        </div>
      </div>
      <MilkdownProvider>
        <ClientOnly>
          <MilkdownEditorInner :model-value="milkdownBody" @update:model-value="handleWysiwygUpdate"
            @ready="handleEditorReady" />
        </ClientOnly>
      </MilkdownProvider>
      <ImageUploadDialog v-if="showImageDialog" @insert-url="handleImageUrl" @upload-file="handleImageFile"
        @close="showImageDialog = false" />
    </template>
  </div>
</template>

<style scoped>
.md-editor-wrapper {
  position: relative;
  height: 100%;
  min-height: 300px;
  overflow: hidden;
}

.mode-toggle:hover {
  border-color: var(--editor-gold, #b78c4d);
  color: var(--editor-gold-soft, #d4b87a);
  background: rgba(183, 140, 77, 0.1);
}


/* ---- 源代码 textarea ---- */
.md-textarea {
  width: 100%;
  height: 100%;
  min-height: 300px;
  padding: 1.25rem;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--editor-text, #e0d8c8);
  font-family: 'Cascadia Code', Consolas, Monaco, 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.7;
  tab-size: 2;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.md-textarea::placeholder {
  color: var(--editor-text-soft, #ccc2b0);
  opacity: 0.5;
}

.md-textarea::-webkit-scrollbar {
  width: 6px;
}

.md-textarea::-webkit-scrollbar-track {
  background: transparent;
}

.md-textarea::-webkit-scrollbar-thumb {
  background: var(--editor-border, rgba(183, 140, 77, 0.25));
  border-radius: 3px;
}

.md-textarea::-webkit-scrollbar-thumb:hover {
  background: var(--editor-gold-soft, #d4b87a);
}

/* ---- Frontmatter 卡片（可编辑） ---- */
.fm-card {
  margin: 0.75rem 1rem 0;
  padding: 0.75rem 1rem 0.5rem;
  border: 1px solid var(--editor-border, rgba(183, 140, 77, 0.25));
  border-radius: 8px;
  background: var(--editor-code-bg, rgba(183, 140, 77, 0.08));
  font-family: 'Cascadia Code', Consolas, Monaco, 'Courier New', monospace;
  font-size: 0.82rem;
  line-height: 1.7;
  color: var(--editor-text-soft, #ccc2b0);
}

.fm-card-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--editor-gold-soft, #d4b87a);
  margin-bottom: 0.5rem;
  opacity: 0.7;
}

.fm-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
}

.fm-field-key {
  flex-shrink: 0;
  min-width: 5.5rem;
  font-size: 0.78rem;
  color: var(--editor-gold-soft, #d4b87a);
  opacity: 0.85;
}

.fm-input {
  flex: 1;
  min-width: 0;
  padding: 0.2rem 0.45rem;
  border: 1px solid transparent;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.15);
  color: var(--editor-text, #e0d8c8);
  font-family: inherit;
  font-size: 0.82rem;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}

.fm-input-date {
  max-width: 11rem;
}

.fm-input:hover {
  border-color: var(--editor-border, rgba(183, 140, 77, 0.3));
}

.fm-input:focus {
  border-color: var(--editor-gold, #b78c4d);
  background: rgba(0, 0, 0, 0.25);
}

.fm-input::placeholder {
  color: var(--editor-text-soft, #ccc2b0);
  opacity: 0.4;
}

/* 标签区域 */
.fm-tags-wrap {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0;
}

.fm-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.08rem 0.4rem;
  border-radius: 3px;
  background: rgba(183, 140, 77, 0.18);
  color: var(--editor-gold-soft, #d4b87a);
  font-size: 0.78rem;
  white-space: nowrap;
}

.fm-tag-del {
  background: none;
  border: none;
  color: var(--editor-text-soft, #ccc2b0);
  cursor: pointer;
  padding: 0;
  font-size: 0.85rem;
  line-height: 1;
  transition: color 0.12s;
}

.fm-tag-del:hover {
  color: var(--editor-text, #e0d8c8);
}

.fm-tag-input {
  flex: 1;
  min-width: 80px;
  border: none;
  background: none;
  color: var(--editor-text, #e0d8c8);
  font-family: inherit;
  font-size: 0.82rem;
  outline: none;
  padding: 0.08rem 0;
}

.fm-tag-input::placeholder {
  color: var(--editor-text-soft, #ccc2b0);
  opacity: 0.4;
}

.fm-line {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
