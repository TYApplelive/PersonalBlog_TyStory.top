<script setup lang="ts">
useHead({ title: '文章管理 - TY\'s Blog' });

const { data: posts, refresh } = await useAsyncData('admin-posts-list', () => $fetch('/api/blog/posts'), { default: () => [] });

const searchQuery = ref('');
const filteredPosts = computed(() => {
  if (!searchQuery.value) return posts.value;
  const q = searchQuery.value.toLowerCase();
  return posts.value.filter(p =>
    p.title?.toLowerCase().includes(q) ||
    p.tags?.some(t => t.toLowerCase().includes(q))
  );
});

function confirmDelete(post: any) {
  if (confirm(`确认删除文章「${post.title}」？\n此操作仅提示，实际需手动删除 content/blog/ 下的对应文件。`)) {
    return;
  }
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">CONTENT</p>
      <h1>文章管理</h1>
      <p class="admin-subtitle">查看和管理所有博客文章。文章的增删改需在 <code>content/blog/</code> 目录操作。</p>
    </header>

    <main class="admin-main">
      <div class="admin-panel">
        <div class="input-group">
          <input v-model="searchQuery" type="text" placeholder="搜索文章标题或标签..." class="form-input">
          <NuxtLink to="/admin/posts/new" class="btn btn-primary">新建文章</NuxtLink>
        </div>
      </div>

      <div class="admin-panel" style="padding:0;overflow:hidden;">
        <div v-if="filteredPosts.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-text">{{ searchQuery ? '没有匹配的文章' : '暂无文章' }}</div>
          <p class="empty-hint">在 <code>content/blog/</code> 目录创建 Markdown 文件即可添加文章。</p>
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>标题</th>
              <th>日期</th>
              <th>标签</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(post, index) in filteredPosts" :key="post.id">
              <td style="color:var(--film-muted-light);width:3rem;">{{ post.id }}</td>
              <td>
                <NuxtLink :to="`/blog/${post.id}`" class="admin-link">
                  {{ post.title || '未命名文章' }}
                </NuxtLink>
                <div style="font-size:0.8rem;color:var(--film-muted-light);margin-top:0.2rem;">
                  {{ post.excerpt?.slice(0, 60) }}{{ post.excerpt?.length > 60 ? '...' : '' }}
                </div>
              </td>
              <td style="white-space:nowrap;color:var(--film-paper-soft);">{{ post.date || '-' }}</td>
              <td>
                <span v-for="tag in (post.tags || [])" :key="tag" class="tag-badge" style="margin:0.15rem;">
                  {{ tag }}
                </span>
                <span v-if="!post.tags?.length" style="color:var(--film-muted-light);font-size:0.85rem;">-</span>
              </td>
              <td>
                <div class="btn-group" style="gap:0.4rem;">
                  <NuxtLink :to="`/blog/${post.id}`" class="btn btn-ghost btn-sm">查看</NuxtLink>
                  <button class="btn btn-ghost btn-sm" style="color:var(--film-accent-soft);"
                    @click="confirmDelete(post)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<style scoped>
code {
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: rgba(183, 140, 77, 0.15);
  color: var(--film-gold-soft);
  font-size: 0.9em;
}
</style>
