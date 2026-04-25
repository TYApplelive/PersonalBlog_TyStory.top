<script setup lang="ts">
/**
 * 分类管理页 (admin/categories.vue)
 *
 * 耦合关系：
 *   - server/api/blog/posts.get.ts → 通过 $fetch 获取文章列表，提取分类
 *
 * 函数表：
 *   - categories    → computed，从文章标签聚合分类并按文章数降序排列
 *   - addCategory() → 校验并记录新分类（需在文章 Frontmatter 中添加对应标签）
 */
useHead({ title: '分类管理 - TY\'s Blog' });

const { data: posts } = await useAsyncData('admin-cat-posts', () => $fetch('/api/blog/posts'), { default: () => [] });

const categories = computed(() => {
  const map = new Map<string, { name: string; count: number; posts: string[] }>();
  for (const post of posts.value) {
    const tags = (post.tags as string[]) || [];
    if (tags.length === 0) {
      const key = '未分类';
      if (!map.has(key)) map.set(key, { name: key, count: 0, posts: [] });
      map.get(key)!.count++;
      map.get(key)!.posts.push(post.title);
    } else {
      for (const tag of tags) {
        if (!map.has(tag)) map.set(tag, { name: tag, count: 0, posts: [] });
        map.get(tag)!.count++;
        map.get(tag)!.posts.push(post.title);
      }
    }
  }
  return [...map.entries()].map(([, v]) => v).sort((a, b) => b.count - a.count);
});

const newCategoryName = ref('');
const statusText = ref('');

function addCategory() {
  const name = newCategoryName.value.trim();
  if (!name) return;
  if (categories.value.some(c => c.name === name)) {
    statusText.value = `分类「${name}」已存在`;
    return;
  }
  statusText.value = `分类「${name}」已记录（需在文章 Frontmatter 中添加该标签）`;
  newCategoryName.value = '';
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">CATEGORIES</p>
      <h1>分类管理</h1>
      <p class="admin-subtitle">博客文章分类源于标签，在文章 Frontmatter 中定义。</p>
    </header>

    <main class="admin-main">
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">{{ categories.length }}</div>
          <div class="stat-label">分类总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ categories.filter(c => c.count > 1).length }}</div>
          <div class="stat-label">多文章分类</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ categories.reduce((s, c) => s + c.count, 0) }}</div>
          <div class="stat-label">标签总数</div>
        </div>
      </div>

      <div class="admin-panel">
        <div class="input-group" style="margin-bottom:1.25rem;">
          <input v-model="newCategoryName" type="text" placeholder="新建分类名称（将作为标签添加到文章）" class="form-input"
            @keyup.enter="addCategory">
          <button class="btn btn-primary" @click="addCategory">添加</button>
        </div>
        <p v-if="statusText" class="status-message info" style="margin-bottom:1rem;">{{ statusText }}</p>

        <div v-if="categories.length === 0" class="empty-state">
          <div class="empty-icon">🏷️</div>
          <div class="empty-text">暂无分类</div>
          <p class="empty-hint">在文章 Frontmatter 中添加 tags 字段即可创建分类。</p>
        </div>

        <div v-else class="category-grid">
          <div v-for="cat in categories" :key="cat.name" class="category-card">
            <div class="cat-header">
              <span class="cat-name">{{ cat.name }}</span>
              <span class="cat-count">{{ cat.count }} 篇</span>
            </div>
            <div class="cat-posts">
              <span v-for="postTitle in cat.posts.slice(0, 3)" :key="postTitle" class="cat-post-title">
                {{ postTitle }}
              </span>
              <span v-if="cat.posts.length > 3" class="cat-more">+{{ cat.posts.length - 3 }} 篇</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.85rem;
}

.category-card {
  padding: 1rem;
  border: 1px solid rgba(183, 140, 77, 0.18);
  border-radius: 12px;
  background: rgba(242, 221, 175, 0.04);
  transition: border-color 0.2s, background 0.2s;
}

.category-card:hover {
  border-color: rgba(183, 140, 77, 0.35);
  background: rgba(183, 140, 77, 0.08);
}

.cat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.cat-name {
  color: var(--film-gold-soft);
  font-weight: 700;
  font-size: 1.05rem;
}

.cat-count {
  color: var(--film-muted-light);
  font-size: 0.85rem;
}

.cat-posts {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.cat-post-title {
  font-size: 0.85rem;
  color: var(--film-paper-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cat-more {
  font-size: 0.8rem;
  color: var(--film-muted-light);
}
</style>
