<script setup lang="ts">
useHead({ title: '新建文章 - TY\'s Blog' });

const title = ref('');
const date = ref(new Date().toISOString().slice(0, 10));
const excerpt = ref('');
const tags = ref('');
const readTime = ref('');
const body = ref('');
const generatedContent = ref('');
const showPreview = ref(false);

const { data: posts } = await useAsyncData('admin-new-post-id', () => $fetch('/api/blog/posts'), { default: () => [] });
const nextId = computed(() => {
  const maxId = Math.max(0, ...posts.value.map(p => Number(p.id) || 0));
  return maxId + 1;
});

function generateMarkdown() {
  const tagArray = tags.value.split(/[,，\s]+/).filter(Boolean);
  const content = [
    '---',
    `id: ${nextId.value}`,
    `title: ${title.value || '未命名文章'}`,
    `date: ${date.value}`,
    `excerpt: ${excerpt.value || ''}`,
    ...(readTime.value ? [`readTime: ${readTime.value}`] : []),
    ...(tagArray.length ? [`tags: [${tagArray.join(', ')}]`] : []),
    '---',
    '',
    body.value,
  ].join('\n');
  generatedContent.value = content;
  showPreview.value = true;
}

function downloadFile() {
  if (!generatedContent.value) return;
  const blob = new Blob([generatedContent.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nextId.value}.${title.value || 'untitled'}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function copyContent() {
  if (!generatedContent.value) return;
  navigator.clipboard.writeText(generatedContent.value).then(() => {
    statusText.value = '已复制到剪贴板';
  }).catch(() => {
    statusText.value = '复制失败';
  });
}

const statusText = ref('');
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">NEW POST</p>
      <h1>新建文章</h1>
      <p class="admin-subtitle">填写信息生成 Markdown 文件，下载后放入 <code>content/blog/</code> 目录即可。</p>
    </header>

    <main class="admin-main">
      <div class="admin-panel">
        <h2>文章信息</h2>

        <div class="form-group">
          <label>文章标题</label>
          <input v-model="title" type="text" placeholder="输入文章标题" class="form-input">
        </div>

        <div class="form-row">
          <div class="form-group" style="flex:1;">
            <label>发布日期</label>
            <input v-model="date" type="date" class="form-input">
          </div>
          <div class="form-group" style="flex:1;">
            <label>阅读时间</label>
            <input v-model="readTime" type="text" placeholder="例如: 6 min" class="form-input">
          </div>
        </div>

        <div class="form-group">
          <label>文章摘要</label>
          <textarea v-model="excerpt" placeholder="简短描述文章内容" class="form-input form-textarea" style="min-height:80px;" />
        </div>

        <div class="form-group">
          <label>标签（逗号或空格分隔）</label>
          <input v-model="tags" type="text" placeholder="Nuxt, Vue, CSS" class="form-input">
        </div>
      </div>

      <div class="admin-panel">
        <h2>正文（Markdown）</h2>
        <div class="form-group">
          <textarea v-model="body" placeholder="在此输入 Markdown 正文内容..." class="form-input form-textarea"
            style="min-height:300px;font-family:monospace;line-height:1.7;" />
        </div>
      </div>

      <div class="btn-group">
        <button class="btn btn-primary" @click="generateMarkdown">生成 Markdown</button>
        <NuxtLink to="/admin/md-images" class="btn btn-secondary">图片处理工具</NuxtLink>
        <NuxtLink to="/admin/posts" class="btn btn-ghost">返回文章列表</NuxtLink>
      </div>

      <p v-if="statusText" class="status-message info">{{ statusText }}</p>

      <div v-if="showPreview" class="admin-panel">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
          <h2 style="margin:0;">预览</h2>
          <div class="btn-group" style="gap:0.5rem;">
            <button class="btn btn-sm" @click="downloadFile">下载文件</button>
            <button class="btn btn-sm btn-secondary" @click="copyContent">复制内容</button>
          </div>
        </div>
        <pre style="max-height:400px;overflow:auto;background:rgba(20,12,9,0.4);padding:1rem;border-radius:10px;white-space:pre-wrap;word-break:break-word;color:var(--film-paper-soft);font-family:monospace;line-height:1.6;">{{ generatedContent }}</pre>
      </div>
    </main>
  </div>
</template>

<style scoped>
.form-row {
  display: flex;
  gap: 1rem;
}

code {
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: rgba(183, 140, 77, 0.15);
  color: var(--film-gold-soft);
  font-size: 0.9em;
}

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
