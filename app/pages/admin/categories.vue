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
useHead({ title: '分类与标签管理 - TY\'s Blog' });

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

const newCategoryName = ref('');
const categoryStatusText = ref('');
const newTagName = ref('');
const tagStatusText = ref('');

function addCategory() {
  const name = newCategoryName.value.trim();
  if (!name) return;
  if (categories.value.some(c => c.name === name)) {
    console.warn(`[Categories] 分类「${name}」已存在`);
    categoryStatusText.value = `分类「${name}」已存在`;
    return;
  }
  categoryStatusText.value = `分类「${name}」已记录（需在文章 Frontmatter 中添加该标签）`;
  newCategoryName.value = '';
  console.log(`[Categories] 已添加分类: ${name}`);
}

function addTag() {
  const name = newTagName.value.trim();
  if (!name) return;
  if (tags.value.some(t => t.name === name)) {
    console.warn(`[Categories] 标签「${name}」已存在`);
    tagStatusText.value = `标签「${name}」已存在`;
    return;
  }
  tagStatusText.value = `标签「${name}」已记录（需在对应文章的 Frontmatter tags 中添加）`;
  newTagName.value = '';
  console.log(`[Categories] 已添加标签: ${name}`);
}

const deletingTag = ref('');
const deleteStatusText = ref('');

/**
 * 从所有文章中删除指定标签
 * 弹出确认框后调用 API 批量移除
 */
async function deleteTag(tagName: string) {
  if (!window.confirm(`确定要删除标签「${tagName}」吗？\n\n此操作将从所有包含该标签的文章 Frontmatter 中移除该标签，不可恢复！`)) return;

  deletingTag.value = tagName;
  deleteStatusText.value = '';
  console.log(`[Categories] 开始删除标签: ${tagName}`);

  try {
    const result = await $fetch('/api/admin/tags/delete', {
      method: 'POST',
      body: { tag: tagName },
    });
    console.log(`[Categories] 标签删除结果:`, result);
    deleteStatusText.value = `已从 ${result.removedFrom} 篇文章中移除标签「${tagName}」`;
    // 刷新页面数据
    await refreshNuxtData('admin-cat-posts');
    location.reload(); // 强制刷新以重新加载文章数据
  } catch (error: any) {
    console.error(`[Categories] 删除标签失败:`, error);
    deleteStatusText.value = `删除失败: ${error?.data?.message || error?.message || '未知错误'}`;
  } finally {
    deletingTag.value = '';
  }
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">CATEGORIES & TAGS</p>
      <h1>分类与标签管理</h1>
      <p class="admin-subtitle">分类源于标签，在文章 Frontmatter 中定义。下方可管理分类与标签云。</p>
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
        <p v-if="categoryStatusText" class="status-message info" style="margin-bottom:1rem;">{{ categoryStatusText }}</p>

        <div v-if="categories.length === 0" class="empty-state">
          <div class="empty-icon">🏷️</div>
          <div class="empty-text">暂无分类</div>
          <p class="empty-hint">在文章 Frontmatter 中添加 tags 字段即可创建分类。</p>
        </div>

        <div v-else class="category-grid">
          <div v-for="cat in categories" :key="cat.name" class="category-card">
            <div class="cat-header">
              <span class="cat-name">{{ cat.name }}</span>
              <div class="cat-header-right">
                <span class="cat-count">{{ cat.count }} 篇</span>
                <button class="btn-delete-sm" @click.stop="deleteTag(cat.name)" :disabled="deletingTag === cat.name"
                  title="删除此分类/标签">
                  {{ deletingTag === cat.name ? '...' : '×' }}
                </button>
              </div>
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

      <!-- ===== 标签云 (合并自 admin/tags.vue) ===== -->
      <hr class="section-divider" />
      <h2 class="section-heading">标签云</h2>
      <p class="section-desc">所有标签从博客文章 Frontmatter 中提取，按使用频率排序。</p>

      <div class="admin-panel">
        <div class="input-group" style="margin-bottom:1.25rem;">
          <input v-model="newTagName" type="text" placeholder="新建标签名称" class="form-input"
            @keyup.enter="addTag">
          <button class="btn btn-primary" @click="addTag">添加</button>
        </div>
        <p v-if="deleteStatusText" class="status-message info" style="margin: 0 0 1rem;">{{ deleteStatusText }}</p>
        <p v-if="tagStatusText" class="status-message info" style="margin-bottom:1rem;">{{ tagStatusText }}</p>

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
            <button class="btn-delete-tag" @click.stop="deleteTag(tag.name)" :disabled="deletingTag === tag.name"
              :title="`删除标签「${tag.name}」`">
              {{ deletingTag === tag.name ? '...' : '×' }}
            </button>
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

.cat-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-delete-sm {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(180, 60, 60, 0.3);
  border-radius: 50%;
  background: rgba(180, 60, 60, 0.1);
  color: #e07a7a;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  line-height: 1;
}

.btn-delete-sm:hover {
  background: rgba(180, 60, 60, 0.7);
  color: #fff;
  border-color: rgba(200, 80, 80, 0.8);
}

.btn-delete-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* ===== 标签云样式 (合并自 tags.vue) ===== */
.section-divider {
  margin: 2rem 0 1.5rem;
  border: none;
  border-top: 1px solid rgba(183, 140, 77, 0.2);
}

.section-heading {
  margin: 0 0 0.35rem;
  color: var(--film-gold-soft);
  font-size: 1.3rem;
}

.section-desc {
  margin: 0 0 1rem;
  color: var(--film-muted);
  font-size: 0.88rem;
}

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

.btn-delete-tag {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(180, 60, 60, 0.25);
  border-radius: 50%;
  background: rgba(180, 60, 60, 0.08);
  color: #e07a7a;
  font-size: 0.65rem;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
}

.btn-delete-tag:hover {
  background: rgba(180, 60, 60, 0.6);
  color: #fff;
  border-color: rgba(200, 80, 80, 0.7);
}

.btn-delete-tag:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
