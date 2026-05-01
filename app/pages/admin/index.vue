<script setup lang="ts">
/**
 * 管理中心首页 (admin/index.vue)
 *
 * 耦合关系：
 *   - server/api/blog/posts.get.ts → 通过 $fetch 获取文章列表
 *   - app/pages/admin/posts/index.vue  → 导航跳转目标（文章管理+新建文章）
 *   - app/pages/admin/categories.vue   → 导航跳转目标（分类与标签管理）
 *   - app/pages/admin/imgbed-manager.vue → 导航跳转目标
 *   - app/pages/admin/settings.vue → 导航跳转目标
 *   - app/pages/admin/users.vue    → 导航跳转目标
 *   - shared/types/site.ts         → BlogPost 类型定义
 *
 * 函数表：
 *   - allTags       → computed，从文章列表提取去重标签集合
 *   - allCategories → computed，从文章标题首字提取分类集合
 *   - navItems      → 管理后台导航项配置（含动态 badge）
 */

useHead({ title: '管理中心 - TY\'s Blog' });

const { data: posts, error } = await useAsyncData<BlogPost[]>(
  'admin-posts',
  () => $fetch('/api/blog/posts'),
  { default: () => [] }
);

if (import.meta.client) {
  watchEffect(() => {
    if (error.value) {
      console.error('[Admin Dashboard] 文章数据加载失败:', error.value);
    } else {
      console.log(`[Admin Dashboard] 已加载 ${posts.value.length} 篇文章`);
    }
  });
}

const allTags = computed(() => [...new Set(posts.value.flatMap(p => p.tags).filter(Boolean))]);
const allCategories = computed(() => [...new Set(posts.value.map(p => p.title?.charAt(0) ?? '其他').filter(Boolean))]);

const navItems = [
  { to: '/admin/posts', icon: '📝', label: '文章管理', desc: '查看、编辑、创建和管理所有博客文章', badge: posts.value.length },
  { to: '/admin/categories', icon: '🏷️', label: '分类与标签', desc: '管理博客文章分类与标签', badge: allTags.value.length },
  { to: '/admin/imgbed-manager', icon: '☁️', label: '图床管理', desc: '配置 CloudFlare ImgBed API 与 Token' },
  { to: '/admin/settings', icon: '⚙️', label: '系统设置', desc: '查看和配置博客系统参数' },
  { to: '/admin/users', icon: '👤', label: '用户管理', desc: '管理博客用户和所有者信息' },
];
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">ADMIN ROOM</p>
      <h1>管理中心</h1>
      <p class="admin-subtitle">博客管理后台，涵盖文章、分类与标签、图床和系统配置。</p>
    </header>

    <main class="admin-main">
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">{{ posts.length }}</div>
          <div class="stat-label">文章总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ allTags.length }}</div>
          <div class="stat-label">标签总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ allCategories.length }}</div>
          <div class="stat-label">分类数</div>
        </div>
        <YearTimeline :posts="posts" />
      </div>

      <div class="nav-grid">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="tool-card">
          <span class="tool-icon">{{ item.icon }}</span>
          <span class="tool-copy">
            <strong>{{ item.label }}</strong>
            <small>{{ item.desc }}</small>
          </span>
          <span v-if="item.badge !== undefined" class="tool-badge">{{ item.badge }}</span>
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<style scoped>
.nav-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.tool-card {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1.3rem;
  border: 1px solid rgba(183, 140, 77, 0.24);
  border-radius: 16px;
  background: rgba(242, 221, 175, 0.06);
  color: var(--film-paper);
  text-decoration: none;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
  position: relative;
}

.tool-card:hover {
  transform: translateY(-2px);
  border-color: rgba(183, 140, 77, 0.46);
  background: rgba(183, 140, 77, 0.14);
}

.tool-icon {
  font-size: 1.5rem;
  display: grid;
  place-items: center;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 999px;
  background: rgba(20, 12, 9, 0.45);
}

.tool-copy {
  display: grid;
  gap: 0.25rem;
  flex: 1;
}

.tool-copy strong {
  color: var(--film-gold-soft);
  font-size: 1.1rem;
}

.tool-copy small {
  color: var(--film-paper-soft);
  font-size: 0.85rem;
}

.tool-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: rgba(183, 140, 77, 0.2);
  color: var(--film-gold-soft);
  font-size: 0.8rem;
  font-weight: 700;
}

@media (max-width: 720px) {
  .nav-grid {
    grid-template-columns: 1fr;
  }
}
</style>
