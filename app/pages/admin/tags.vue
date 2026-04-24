<script setup lang="ts">
useHead({ title: '标签管理 - TY\'s Blog' });

const { data: posts } = await useAsyncData('admin-tag-posts', () => $fetch('/api/blog/posts'), { default: () => [] });

const tags = computed(() => {
  const map = new Map<string, { name: string; count: number; articles: string[] }>();
  for (const post of posts.value) {
    for (const tag of (post.tags as string[]) || []) {
      if (!map.has(tag)) map.set(tag, { name: tag, count: 0, articles: [] });
      map.get(tag)!.count++;
      map.get(tag)!.articles.push(post.title);
    }
  }
  return [...map.entries()].map(([, v]) => v).sort((a, b) => b.count - a.count);
});

const newTagName = ref('');
const statusText = ref('');

function addTag() {
  const name = newTagName.value.trim();
  if (!name) return;
  if (tags.value.some(t => t.name === name)) {
    statusText.value = `标签「${name}」已存在`;
    return;
  }
  statusText.value = `标签「${name}」已记录（需在对应文章的 Frontmatter tags 中添加）`;
  newTagName.value = '';
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">TAGS</p>
      <h1>标签管理</h1>
      <p class="admin-subtitle">所有标签从博客文章的 Frontmatter 中提取，按使用频率排序。</p>
    </header>

    <main class="admin-main">
      <div class="admin-panel">
        <div class="input-group" style="margin-bottom:1.25rem;">
          <input v-model="newTagName" type="text" placeholder="新建标签名称" class="form-input"
            @keyup.enter="addTag">
          <button class="btn btn-primary" @click="addTag">添加</button>
        </div>
        <p v-if="statusText" class="status-message info" style="margin-bottom:1rem;">{{ statusText }}</p>

        <div v-if="tags.length === 0" class="empty-state">
          <div class="empty-icon">🔖</div>
          <div class="empty-text">暂无标签</div>
          <p class="empty-hint">在文章 Frontmatter 中添加 tags 字段即可。</p>
        </div>

        <div v-else class="tag-cloud">
          <div v-for="tag in tags" :key="tag.name" class="tag-item" :style="{
            fontSize: `${Math.min(1.4, 0.85 + tag.count * 0.15)}rem`,
            opacity: Math.min(1, 0.6 + tag.count * 0.1),
          }">
            <span class="tag-name">{{ tag.name }}</span>
            <span class="tag-count">× {{ tag.count }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 0.5rem;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(183, 140, 77, 0.25);
  border-radius: 999px;
  background: rgba(183, 140, 77, 0.08);
  transition: all 0.2s ease;
  cursor: default;
}

.tag-item:hover {
  border-color: rgba(183, 140, 77, 0.5);
  background: rgba(183, 140, 77, 0.16);
  transform: translateY(-2px);
}

.tag-name {
  color: var(--film-gold-soft);
  font-weight: 700;
}

.tag-count {
  color: var(--film-muted-light);
  font-size: 0.75em;
  font-weight: 600;
}
</style>
