<script setup lang="ts">
/**
 * MarkdownEditor 组件 — WYSIWYG 编辑器
 *
 * 基于 Milkdown v7，提供 Typora 风格所见即所得编辑。
 * 支持格式化命令、目录提取、图片粘贴。
 *
 * Props:
 *   - modelValue  → Markdown 内容（初始值）
 *
 * Emits:
 *   - update:modelValue → 内容变化时触发（300ms 防抖）
 *
 * Exposed:
 *   - getMarkdown()        → 获取当前 Markdown 内容
 *   - setMarkdown(content)  → 设置编辑器内容
 *   - getOutline()          → 获取标题大纲 [{ text, level, id }]
 *   - toggleBold / toggleItalic / toggleStrikethrough / toggleHeading(level)
 *   - toggleBulletList / toggleOrderedList / toggleBlockquote
 *   - toggleCodeBlock / toggleInlineCode / insertLink / insertImage / insertHr
 */
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, serializerCtx, commandsCtx, editorViewOptionsCtx } from '@milkdown/core';
import {
  commonmark,
  toggleStrongCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  wrapInHeadingCommand,
  wrapInBlockquoteCommand,
  createCodeBlockCommand,
  insertHrCommand,
  insertImageCommand,
  toggleLinkCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
} from '@milkdown/preset-commonmark';
import { nord } from '@milkdown/theme-nord';
import { history } from '@milkdown/plugin-history';
import { clipboard } from '@milkdown/plugin-clipboard';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/vue';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'imagePasted': [file: File];
}>();

/* ---- 编辑器状态 ---- */
interface HeadingItem {
  text: string;
  level: number;
  id: string;
}

const headings = ref<HeadingItem[]>([]);

/** 编辑器加载状态 */
const { get: getEditor, loading } = useEditor((root) => {
  let emitTimer: ReturnType<typeof setTimeout> | null = null;

  return Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root);
      ctx.set(defaultValueCtx, props.modelValue || '');

      /* 侦听内容变化 -> 更新 modelValue & TOC */
      ctx.update(editorViewOptionsCtx, (prev) => ({
        ...prev,
        dispatchTransaction: (tr) => {
          prev.dispatchTransaction?.(tr);
          if (!tr.docChanged) return;

          if (emitTimer) clearTimeout(emitTimer);
          emitTimer = setTimeout(() => {
            try {
              const view = ctx.get(editorViewCtx);
              const serializer = ctx.get(serializerCtx);
              const markdown = serializer(view.state.doc);
              emit('update:modelValue', markdown);
              /* 更新目录 */
              updateOutline(ctx);
            } catch {
              /* 编辑器尚未完全就绪时跳过 */
            }
          }, 300);
        },
      }));
    })
    .use(commonmark)
    .config(nord)
    .use(history)
    .use(clipboard);
});

/* ---- 工具函数 ---- */

function updateOutline(ctx?: any) {
  const editor = ctx ? undefined : getEditor();
  if (!ctx && !editor) return;
  try {
    const cb = (c: any) => {
      const view = c.get(editorViewCtx);
      const items: HeadingItem[] = [];
      view.state.doc.descendants((node: any) => {
        if (node.type.name === 'heading') {
          const text = node.textContent;
          const level = node.attrs.level;
          const id = text.toLowerCase().replace(/[^\w一-鿿]+/g, '-').replace(/(^-|-$)/g, '');
          items.push({ text, level, id });
        }
      });
      headings.value = items;
    };
    if (ctx) cb(ctx);
    else editor!.action(cb);
  } catch {
    // 忽略
  }
}

/* ---- 格式化命令 ---- */

type EditorAction = (ctx: any) => void;

function exec(cb: EditorAction) {
  const editor = getEditor();
  if (!editor) return;
  editor.action(cb);
}

function toggleBold() { exec((ctx) => ctx.get(commandsCtx).call(toggleStrongCommand.key)); }
function toggleItalic() { exec((ctx) => ctx.get(commandsCtx).call(toggleEmphasisCommand.key)); }
function toggleInlineCode() { exec((ctx) => ctx.get(commandsCtx).call(toggleInlineCodeCommand.key)); }
function toggleHeading(level: 1 | 2 | 3 | 4 | 5 | 6) { exec((ctx) => ctx.get(commandsCtx).call(wrapInHeadingCommand.key, { level })); }
function toggleBulletList() { exec((ctx) => ctx.get(commandsCtx).call(wrapInBulletListCommand.key)); }
function toggleOrderedList() { exec((ctx) => ctx.get(commandsCtx).call(wrapInOrderedListCommand.key)); }
function toggleBlockquote() { exec((ctx) => ctx.get(commandsCtx).call(wrapInBlockquoteCommand.key)); }
function toggleCodeBlock(language = '') { exec((ctx) => ctx.get(commandsCtx).call(createCodeBlockCommand.key, language)); }
function insertHr() { exec((ctx) => ctx.get(commandsCtx).call(insertHrCommand.key)); }

function insertLink(url = '') {
  exec((ctx) => {
    const view = ctx.get(editorViewCtx);
    const { from, to, empty } = view.state.selection;
    if (empty) {
      ctx.get(commandsCtx).call(toggleLinkCommand.key, { href: url || 'url' });
    } else {
      const text = view.state.doc.textBetween(from, to);
      ctx.get(commandsCtx).call(toggleLinkCommand.key, { href: url || 'url' });
    }
  });
}

function insertImage(url = '') {
  exec((ctx) => ctx.get(commandsCtx).call(insertImageCommand.key, { src: url || '' }));
}

/** 删除线：Milkdown commonmark 不内置，手动插入 */
function toggleStrikethrough() {
  exec((ctx) => {
    const view = ctx.get(editorViewCtx);
    const { state, dispatch } = view;
    const { from, to, empty } = state.selection;
    const text = state.doc.textBetween(from, to);
    const wrapped = `~~${text || 'text'}~~`;
    const tr = state.tr.replaceWith(from, to, state.schema.text(wrapped));
    dispatch(tr);
  });
}

/** 任务列表：Milkdown 不内置，手动插入 */
function toggleTaskList() {
  exec((ctx) => {
    const view = ctx.get(editorViewCtx);
    const { state, dispatch } = view;
    const { from, to, empty } = state.selection;
    const text = empty ? '' : state.doc.textBetween(from, to);
    const lines = text ? text.split('\n').map((l: string) => `- [ ] ${l}`).join('\n') : '- [ ] ';
    const tr = state.tr.replaceWith(from, to, state.schema.text(lines));
    dispatch(tr);
  });
}

/* ---- 获取/设置内容 ---- */

async function getMarkdown(): Promise<string> {
  const editor = getEditor();
  if (!editor) return props.modelValue || '';

  try {
    return editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const serializer = ctx.get(serializerCtx);
      return serializer(view.state.doc);
    });
  } catch {
    return props.modelValue || '';
  }
}

function setMarkdown(content: string) {
  const editor = getEditor();
  if (!editor) return;

  try {
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { state } = view;
      const tr = state.tr.replaceWith(0, state.doc.content.size, state.schema.nodeFromJSON({
        type: 'paragraph',
        content: [{ type: 'text', text: content }],
      }));
      view.dispatch(tr);
    });
  } catch {
    // 忽略
  }
}

function getOutline(): HeadingItem[] {
  updateOutline();
  return headings.value;
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
});
</script>

<template>
  <div class="md-editor-wrapper">
    <MilkdownProvider>
      <Milkdown class="md-editor-area" />
    </MilkdownProvider>
    <div v-if="loading" class="md-editor-loading">
      <span>编辑器加载中...</span>
    </div>
  </div>
</template>

<style scoped>
.md-editor-wrapper {
  position: relative;
  height: 100%;
  min-height: 300px;
  overflow: hidden;
}

.md-editor-area {
  height: 100%;
  min-height: 300px;
}

.md-editor-area :deep(.milkdown) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.md-editor-area :deep(.editor) {
  flex: 1;
  padding: 1.25rem;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1rem;
  line-height: 1.8;
  color: var(--film-paper, #e0d8c8);
  min-height: 300px;
  outline: none;
  overflow-y: auto;
}

.md-editor-area :deep(.ProseMirror) {
  min-height: 300px;
  height: 100%;
  padding: 1.25rem;
  outline: none;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1rem;
  line-height: 1.8;
  color: var(--film-paper, #e0d8c8);
}

.md-editor-area :deep(.ProseMirror h1),
.md-editor-area :deep(.ProseMirror h2),
.md-editor-area :deep(.ProseMirror h3),
.md-editor-area :deep(.ProseMirror h4) {
  color: var(--film-gold-soft, #d4b87a);
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.md-editor-area :deep(.ProseMirror p) {
  margin: 0.75em 0;
}

.md-editor-area :deep(.ProseMirror code) {
  background: rgba(183, 140, 77, 0.15);
  color: var(--film-gold-soft, #d4b87a);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-family: Consolas, Monaco, monospace;
  font-size: 0.9em;
}

.md-editor-area :deep(.ProseMirror pre) {
  background: rgba(20, 12, 9, 0.5);
  border: 1px solid rgba(183, 140, 77, 0.2);
  border-radius: 12px;
  padding: 1rem;
  overflow-x: auto;
}

.md-editor-area :deep(.ProseMirror pre code) {
  background: none;
  padding: 0;
}

.md-editor-area :deep(.ProseMirror blockquote) {
  border-left: 3px solid var(--film-gold, #b78c4d);
  padding-left: 1rem;
  margin-left: 0;
  color: var(--film-paper-soft, #ccc2b0);
}

.md-editor-area :deep(.ProseMirror a) {
  color: var(--film-gold, #b78c4d);
  text-decoration: underline;
}

.md-editor-area :deep(.ProseMirror img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 0.5rem 0;
}

.md-editor-area :deep(.ProseMirror ul),
.md-editor-area :deep(.ProseMirror ol) {
  padding-left: 1.5rem;
  color: var(--film-paper-soft, #ccc2b0);
}

.md-editor-area :deep(.ProseMirror li) {
  margin: 0.25em 0;
}

.md-editor-area :deep(.ProseMirror table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

.md-editor-area :deep(.ProseMirror th),
.md-editor-area :deep(.ProseMirror td) {
  border: 1px solid rgba(183, 140, 77, 0.25);
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.md-editor-area :deep(.ProseMirror th) {
  background: rgba(183, 140, 77, 0.1);
  color: var(--film-gold-soft, #d4b87a);
}

.md-editor-area :deep(.ProseMirror hr) {
  border: none;
  border-top: 1px solid rgba(183, 140, 77, 0.25);
  margin: 2rem 0;
}

.md-editor-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(20, 12, 9, 0.6);
  color: var(--film-paper-soft);
  font-size: 0.95rem;
}

/* ---- Milkdown 深色主题 ---- */
.md-editor-area :deep(.milkdown) {
  --crepe-color-background: transparent;
  --crepe-color-on-background: var(--film-paper, #e0d8c8);
  --crepe-color-surface: transparent;
  --crepe-color-on-surface: var(--film-paper-soft, #ccc2b0);
  --crepe-color-primary: var(--film-gold, #b78c4d);
  --crepe-color-on-primary: var(--film-dark, #140c09);
  --crepe-color-outline: rgba(183, 140, 77, 0.25);
}
</style>
