<script setup lang="ts">
/**
 * MilkdownEditorInner - Milkdown WYSIWYG 编辑器
 *
 * 此组件必须在 MilkdownProvider 内部使用。
 * 基于 Milkdown v7，提供 Typora 风格所见即所得编辑。
 */

import { Editor, rootCtx, defaultValueCtx, editorViewCtx, commandsCtx, prosePluginsCtx } from '@milkdown/core';
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
import { history } from '@milkdown/plugin-history';
import { clipboard } from '@milkdown/plugin-clipboard';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { upload, uploadConfig } from '@milkdown/plugin-upload';
import { getMarkdown, replaceAll } from '@milkdown/utils';
import { Milkdown, useEditor } from '@milkdown/vue';
import { Decoration } from 'prosemirror-view';
import { Plugin, PluginKey, TextSelection } from '@milkdown/prose/state';
import type { EditorView } from '@milkdown/prose/view';

interface HeadingItem {
  text: string;
  level: number;
  id: string;
}

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits(['update:modelValue', 'ready']);

const headings = ref<HeadingItem[]>([]);

/** 路径转换：./images/ → /api/blog-images/（Milkdown 显示用） */
function toApiPath(markdown: string): string {
  return markdown.replace(/\]\(\.\/images\//g, '](/api/blog-images/');
}

/** 路径转换：/api/blog-images/ → ./images/（文件存储用） */
function toLocalPath(markdown: string): string {
  return markdown.replace(/\]\(\/api\/blog-images\//g, '](./images/');
}

/** 自定义图片上传器 — 保存到本地 content/blog/images/ */
async function customUploader(files: FileList, schema: any, _ctx: any, _insertPos: number) {
  const nodes = [];
  for (let i = 0; i < files.length; i++) {
    const file = files.item(i)!;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await $fetch<{ success: boolean; path: string; filename: string }>('/api/admin/save-local-image', {
        method: 'POST',
        body: formData,
      });
      if (result.success && result.filename) {
        // Milkdown 内部用 /api/blog-images/ 路径（浏览器可访问）
        nodes.push(schema.nodes.image.createAndFill({ src: `/api/blog-images/${result.filename}`, alt: file.name }));
      }
    } catch (err) {
      console.error('本地图片保存失败:', err);
    }
  }
  return nodes;
}

/* ---- 行内代码导航插件 ---- */
// 按向右键时，如果光标在行内代码内部，自动跳到代码末尾
// 按退格键时，如果光标紧跟在行内代码后面，删除整个代码段而非逐字删除
function handleArrowRightInCode(view: EditorView): boolean {
  const { state, dispatch } = view;
  const { doc, schema, selection } = state;
  const { $from } = selection;
  const codeType = schema.marks.code;
  if (!codeType) return false;

  // 仅在光标位于行内代码内部时生效
  if (!$from.marks().some(m => m.type === codeType)) return false;

  // 向前扫描找到代码标记的终点
  let endPos = $from.pos;
  while (endPos < doc.content.size) {
    const $next = doc.resolve(endPos + 1);
    if (!$next.marks().some(m => m.type === codeType)) break;
    endPos++;
  }

  if (endPos > $from.pos) {
    dispatch(state.tr.setSelection(TextSelection.create(doc, endPos + 1)));
    return true;
  }
  return false;
}

function handleBackspaceAfterCode(view: EditorView): boolean {
  const { state, dispatch } = view;
  const { doc, schema, selection } = state;
  const { $from } = selection;
  const codeType = schema.marks.code;
  if (!codeType) return false;
  if ($from.pos <= 0) return false;

  // 光标在代码内部时不做拦截（允许逐字删除）
  if ($from.marks().some(m => m.type === codeType)) return false;

  // 光标前一位置有代码标记 → 光标紧跟在代码段后面
  const $prev = doc.resolve($from.pos - 1);
  if (!$prev.marks().some(m => m.type === codeType)) return false;

  // 找到代码段的全文范围
  let start = $from.pos - 1;
  while (start > 0) {
    const $s = doc.resolve(start - 1);
    if (!$s.marks().some(m => m.type === codeType)) break;
    start--;
  }

  let end = $from.pos - 1;
  while (end < doc.content.size) {
    const $e = doc.resolve(end + 1);
    if (!$e.marks().some(m => m.type === codeType)) break;
    end++;
  }

  dispatch(state.tr.delete(start, end + 1));
  return true;
}

function createInlineCodeNavPlugin() {
  return new Plugin({
    key: new PluginKey('INLINE_CODE_NAV'),
    props: {
      handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
        // 有文本选区时不拦截
        if (!view.state.selection.empty) return false;

        if (event.key === 'ArrowRight') {
          return handleArrowRightInCode(view);
        }
        if (event.key === 'Backspace') {
          return handleBackspaceAfterCode(view);
        }
        return false;
      },
    },
  });
}

/** 初始化编辑器 */
const { get: getEditor } = useEditor((root) => {
  return Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, root);
      // 移除 Frontmatter 部分，只传入正文内容
      const contentWithoutFrontmatter = (props.modelValue || '').replace(/^---\n[\s\S]*?\n---\n/, '');
      // 转换 ./images/ → /api/blog-images/ 以便在 Milkdown 中显示
      ctx.set(defaultValueCtx, toApiPath(contentWithoutFrontmatter));

      /* 自定义图片上传 — 简单占位符 */
      ctx.set(uploadConfig.key, {
        uploader: customUploader,
        enableHtmlFileUploader: true,
        uploadWidgetFactory: (pos: number, spec: any) => {
          const el = document.createElement('span');
          el.className = 'image-upload-placeholder';
          return Decoration.widget(pos, el, spec);
        },
      });

      /* 监听内容变化 */
      ctx.get(listenerCtx)
        .markdownUpdated((_ctx, markdown) => {
          // remark-stringify 会转义 ` 为 \`，取消此转义以保留用户输入的原始 `
          const cleaned = markdown.replace(/\\`/g, '`');
          // 转换 /api/blog-images/ → ./images/ 后发出，保持存储格式一致
          emit('update:modelValue', toLocalPath(cleaned));
          updateOutline();
        })
        .mounted(() => {
          updateOutline();
        });

      /* 行内代码导航 */
      ctx.update(prosePluginsCtx, prev => [...prev, createInlineCodeNavPlugin()]);

    })
    .use(commonmark)
    .use(history)
    .use(clipboard)
    .use(listener)
    .use(upload);
});

/* ---- 工具函数 ---- */

function updateOutline() {
  const editor = getEditor();
  if (!editor) return;
  try {
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
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
    });
  } catch {
    // 编辑器尚未就绪
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
    ctx.get(commandsCtx).call(toggleLinkCommand.key, { href: url || 'url' });
  });
}

function insertImage(url = '') {
  exec((ctx) => ctx.get(commandsCtx).call(insertImageCommand.key, { src: url || '' }));
}

/** 任务列表：通过插入 markdown 文本实现 */
function toggleTaskList() {
  exec((ctx) => {
    const view = ctx.get(editorViewCtx);
    const { state, dispatch } = view;
    const { from, to } = state.selection;
    const text = state.doc.textBetween(from, to);
    const lines = text ? text.split('\n').map((l: string) => `- [ ] ${l}`).join('\n') : '- [ ] ';
    const tr = state.tr.replaceWith(from, to, state.schema.text(lines));
    dispatch(tr);
  });
}

/* ---- 获取/设置内容 ---- */

async function getEditorMarkdown(): Promise<string> {
  const editor = getEditor();
  if (!editor) return props.modelValue || '';
  try {
    const markdown = await editor.action(getMarkdown());
    return toLocalPath(markdown);
  } catch {
    return props.modelValue || '';
  }
}

function setEditorMarkdown(content: string) {
  const editor = getEditor();
  if (!editor) return;
  try {
    editor.action(replaceAll(toApiPath(content), true));
  } catch {
    // 忽略
  }
}

function getOutline(): HeadingItem[] {
  updateOutline();
  return headings.value;
}

/* ---- 暴露方法给父组件 ---- */
onMounted(() => {
  emit('ready', {
    getEditor,
    getMarkdown: getEditorMarkdown,
    setMarkdown: setEditorMarkdown,
    getOutline,
    toggleBold,
    toggleItalic,
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
});
</script>

<template>
  <Milkdown class="md-editor-area" />
</template>

<style scoped>
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
  color: var(--editor-text, #e0d8c8);
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
  color: var(--editor-text, #e0d8c8);
}

.md-editor-area :deep(.ProseMirror h1),
.md-editor-area :deep(.ProseMirror h2),
.md-editor-area :deep(.ProseMirror h3),
.md-editor-area :deep(.ProseMirror h4) {
  color: var(--editor-gold-soft, #d4b87a);
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.md-editor-area :deep(.ProseMirror p) {
  margin: 0.75em 0;
}

.md-editor-area :deep(.ProseMirror code) {
  background: var(--editor-code-bg, rgba(183, 140, 77, 0.15));
  color: var(--editor-gold-soft, #d4b87a);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-family: Consolas, Monaco, monospace;
  font-size: 0.9em;
}

.md-editor-area :deep(.ProseMirror pre) {
  background: var(--editor-pre-bg, rgba(20, 12, 9, 0.5));
  border: 1px solid var(--editor-border, rgba(183, 140, 77, 0.2));
  border-radius: 12px;
  padding: 1rem;
  overflow-x: auto;
}

.md-editor-area :deep(.ProseMirror pre code) {
  background: none;
  padding: 0;
}

.md-editor-area :deep(.ProseMirror blockquote) {
  border-left: 3px solid var(--editor-gold, #b78c4d);
  padding-left: 1rem;
  margin-left: 0;
  color: var(--editor-text-soft, #ccc2b0);
}

.md-editor-area :deep(.ProseMirror a) {
  color: var(--editor-gold, #b78c4d);
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
  color: var(--editor-text-soft, #ccc2b0);
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
  border: 1px solid var(--editor-border, rgba(183, 140, 77, 0.25));
  padding: 0.5rem 0.75rem;
  text-align: left;
}

.md-editor-area :deep(.ProseMirror th) {
  background: rgba(183, 140, 77, 0.1);
  color: var(--editor-gold-soft, #d4b87a);
}

.md-editor-area :deep(.ProseMirror hr) {
  border: none;
  border-top: 1px solid var(--editor-border, rgba(183, 140, 77, 0.25));
  margin: 2rem 0;
}

/* 任务列表复选框 */
.md-editor-area :deep(.ProseMirror li.task-list-item) {
  list-style: none;
  position: relative;
}

.md-editor-area :deep(.ProseMirror li.task-list-item input[type="checkbox"]) {
  margin-right: 0.5rem;
  accent-color: var(--editor-gold, #b78c4d);
}

/* 删除线 */
.md-editor-area :deep(.ProseMirror s),
.md-editor-area :deep(.ProseMirror del) {
  text-decoration: line-through;
  opacity: 0.7;
}

/* ---- Milkdown 主题变量 ---- */
.md-editor-area :deep(.milkdown) {
  --crepe-color-background: transparent;
  --crepe-color-on-background: var(--editor-text, #e0d8c8);
  --crepe-color-surface: transparent;
  --crepe-color-on-surface: var(--editor-text-soft, #ccc2b0);
  --crepe-color-primary: var(--editor-gold, #b78c4d);
  --crepe-color-on-primary: #140c09;
  --crepe-color-outline: var(--editor-border, rgba(183, 140, 77, 0.25));
}

/* ---- 选中图片高亮 ---- */
.md-editor-area :deep(.ProseMirror img.ProseMirror-selectednode) {
  outline: 3px solid var(--editor-gold, #b78c4d);
  outline-offset: 3px;
  border-radius: 4px;
}

/* ---- 图片上传占位符（无光标） ---- */
.md-editor-area :deep(.image-upload-placeholder) {
  display: inline-block;
  vertical-align: middle;
  min-width: 100px;
  height: 48px;
  margin: 0.5rem 0.25rem;
  border: 1.5px dashed var(--editor-border, rgba(183, 140, 77, 0.3));
  border-radius: 6px;
  background: var(--editor-code-bg, rgba(183, 140, 77, 0.06));
}

/* ---- 代码块 ---- */
.md-editor-area :deep(.ProseMirror pre) {
  background: var(--editor-pre-bg, rgba(20, 12, 9, 0.5));
  border: 1px solid var(--editor-border, rgba(183, 140, 77, 0.2));
  border-radius: 10px;
  padding: 1rem;
  overflow-x: auto;
  margin: 0.8em 0;
}

.md-editor-area :deep(.ProseMirror pre code) {
  background: none;
  padding: 0;
  font-size: 0.85em;
  line-height: 1.65;
  color: var(--editor-text, #e0d8c8);
}

/* 行内代码 */
.md-editor-area :deep(.ProseMirror p code) {
  background: var(--editor-code-bg, rgba(183, 140, 77, 0.15));
  color: var(--editor-gold-soft, #d4b87a);
  padding: 0.12rem 0.4rem;
  border-radius: 4px;
  font-family: Consolas, Monaco, monospace;
  font-size: 0.88em;
}
</style>
