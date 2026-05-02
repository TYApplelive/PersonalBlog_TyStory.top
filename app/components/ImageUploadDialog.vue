<script setup lang="ts">
const emit = defineEmits<{
  (e: 'insert-url', url: string): void;
  (e: 'upload-file', file: File): void;
  (e: 'close'): void;
}>();

const urlInput = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file?.type.startsWith('image/')) {
    emit('upload-file', file);
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit('upload-file', file);
    target.value = '';
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}

function insertUrl() {
  const url = urlInput.value.trim();
  if (url) {
    emit('insert-url', url);
    urlInput.value = '';
  }
}

function handleUrlKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    insertUrl();
  }
}
</script>

<template>
  <div class="iu-overlay" @click.self="emit('close')">
    <div class="iu-dialog">
      <div class="iu-header">
        <span class="iu-title">插入图片</span>
        <button class="iu-close" @click="emit('close')" title="关闭">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div
        class="iu-dropzone"
        :class="{ 'iu-dragging': isDragging }"
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @click="triggerFileInput"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="iu-upload-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <p class="iu-drop-text">拖拽图片到此处</p>
        <p class="iu-drop-hint">或点击选择文件</p>
        <input ref="fileInput" type="file" accept="image/*" @change="handleFileSelect" hidden>
      </div>

      <div class="iu-divider"><span>或输入图片 URL</span></div>

      <div class="iu-url-row">
        <input
          v-model="urlInput"
          type="text"
          class="iu-url-input"
          placeholder="https://example.com/image.png"
          @keydown="handleUrlKeydown"
        >
        <button class="iu-url-btn" @click="insertUrl" :disabled="!urlInput.trim()">插入</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.iu-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}

.iu-dialog {
  width: 420px;
  max-width: 90vw;
  background: var(--editor-bg, #1a1412);
  border: 1px solid var(--editor-border, rgba(183, 140, 77, 0.25));
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
}

.iu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--editor-border-light, rgba(183, 140, 77, 0.12));
}

.iu-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--editor-gold-soft, #d4b87a);
}

.iu-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--editor-text-soft, #ccc2b0);
  cursor: pointer;
  transition: all 0.12s;
}

.iu-close:hover {
  background: rgba(183, 140, 77, 0.15);
  color: var(--editor-text, #e0d8c8);
}

.iu-dropzone {
  margin: 1rem;
  padding: 2rem 1rem;
  border: 2px dashed var(--editor-border, rgba(183, 140, 77, 0.25));
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
}

.iu-dropzone:hover,
.iu-dragging {
  border-color: var(--editor-gold, #b78c4d);
  background: rgba(183, 140, 77, 0.06);
}

.iu-upload-icon {
  color: var(--editor-text-soft, #ccc2b0);
  margin-bottom: 0.5rem;
}

.iu-dragging .iu-upload-icon {
  color: var(--editor-gold, #b78c4d);
}

.iu-drop-text {
  margin: 0;
  color: var(--editor-text, #e0d8c8);
  font-size: 0.9rem;
}

.iu-drop-hint {
  margin: 0.25rem 0 0;
  color: var(--editor-text-soft, #ccc2b0);
  font-size: 0.78rem;
}

.iu-divider {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  margin-bottom: 1rem;
}

.iu-divider::before,
.iu-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--editor-border, rgba(183, 140, 77, 0.2));
}

.iu-divider span {
  padding: 0 0.75rem;
  font-size: 0.72rem;
  color: var(--editor-text-soft, #ccc2b0);
}

.iu-url-row {
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem 1rem;
}

.iu-url-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--editor-border, rgba(183, 140, 77, 0.25));
  border-radius: 6px;
  background: var(--editor-input-bg, rgba(20, 12, 9, 0.6));
  color: var(--editor-text, #e0d8c8);
  font-size: 0.82rem;
  outline: none;
  transition: border-color 0.15s;
}

.iu-url-input:focus {
  border-color: var(--editor-gold, #b78c4d);
}

.iu-url-input::placeholder {
  color: var(--editor-text-soft, #ccc2b0);
  opacity: 0.5;
}

.iu-url-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--editor-gold, #b78c4d);
  border-radius: 6px;
  background: transparent;
  color: var(--editor-gold-soft, #d4b87a);
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
}

.iu-url-btn:hover:not(:disabled) {
  background: rgba(183, 140, 77, 0.12);
}

.iu-url-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
