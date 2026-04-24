<script setup lang="ts">
/**
 * 文章管理页：浏览、筛选、排序、图片修复与删除操作
 */
useHead({ title: "Post Manager - TY's Blog" });

interface AdminPostItem {
  title?: string;
  date?: string;
  excerpt?: string;
  readTime?: string;
  tags?: string[];
  path: string;
}

interface RepairResult {
  scannedPosts: number;
  localImageCount: number;
  fixedCount: number;
  updatedPosts: string[];
  errors: Array<{ postPath: string; imagePath: string; error: string }>;
}

// 状态管理
const searchQuery = ref("");
const selectedTag = ref("");
const sortMode = ref<"date-desc" | "date-asc" | "title">("date-desc");
const isRepairing = ref(false);
const repairResult = ref<RepairResult | null>(null);
const repairMessage = ref("");
const showStats = ref(false);

// 数据加载
const { data: posts, pending, refresh } = await useAsyncData<AdminPostItem[]>(
  "admin-posts-list",
  () => $fetch("/api/blog/posts"),
  { default: () => [] },
);

// 计算属性
const allTags = computed(() => {
  const tagSet = new Set<string>();
  posts.value.forEach((post) => post.tags?.forEach((tag) => tagSet.add(tag)));
  return [...tagSet].sort();
});

const filteredPosts = computed(() => {
  let result = posts.value;

  // 标签筛选
  if (selectedTag.value) {
    result = result.filter((post) => post.tags?.includes(selectedTag.value));
  }

  // 关键词搜索
  const keyword = searchQuery.value.trim().toLowerCase();
  if (keyword) {
    result = result.filter((post) => {
      const inTitle = post.title?.toLowerCase().includes(keyword);
      const inTags = post.tags?.some((tag) => tag.toLowerCase().includes(keyword));
      const inExcerpt = post.excerpt?.toLowerCase().includes(keyword);
      return Boolean(inTitle || inTags || inExcerpt);
    });
  }

  // 排序
  if (sortMode.value === "date-desc") {
    result = [...result].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  } else if (sortMode.value === "date-asc") {
    result = [...result].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  } else if (sortMode.value === "title") {
    result = [...result].sort((a, b) =>
      (a.title || "").localeCompare(b.title || ""),
    );
  }

  return result;
});

// 方法
function clearFilters() {
  searchQuery.value = "";
  selectedTag.value = "";
}

async function repairImages() {
  isRepairing.value = true;
  repairMessage.value = "正在修复 Markdown 图片引用...";
  repairResult.value = null;

  try {
    repairResult.value = await $fetch<RepairResult>("/api/admin/repair-blog-images", {
      method: "POST",
    });
    repairMessage.value = `修复完成！共修复 ${repairResult.value.fixedCount} 处图片引用`;
    await refresh();
  } catch (error: any) {
    repairMessage.value = error?.data?.message || error?.message || "修复失败";
  } finally {
    isRepairing.value = false;
  }
}

function confirmDelete(post: AdminPostItem) {
  if (window.confirm(`确定要删除文章「${post.title || "未命名"}」吗？\n\n请手动在 content/blog/ 目录下删除对应文件`)) {
    notify({
      type: "info",
      text: `请在 content/blog/ 目录手动删除文件：${post.path}`,
    });
  }
}

function copyPath(post: AdminPostItem) {
  navigator.clipboard.writeText(post.path);
  notify({ type: "success", text: "路径已复制到剪贴板" });
}
</script>

<template>
  <div class="admin-page">
    <!-- 页头 -->
    <header class="admin-header">
      <p class="eyebrow">POST ARCHIVE</p>
      <h1>文章管理</h1>
      <p class="admin-subtitle">
        浏览、筛选和跳转所有博客文章。创建与编辑请前往「新建文章」页。
      </p>
    </header>

    <main class="admin-main admin-posts-main">
      <!-- ===== 工具栏 ===== -->
      <section class="admin-panel admin-toolbar">
        <!-- 左侧：统计 -->
        <div class="toolbar-stats" @click="showStats = !showStats">
          <div class="stat-item">
            <span class="stat-num">{{ posts.length }}</span>
            <span class="stat-label">篇文章</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num">{{ allTags.length }}</span>
            <span class="stat-label">个标签</span>
          </div>
        </div>

        <!-- 右侧：操作区 -->
        <div class="toolbar-actions">
          <!-- 搜索 -->
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索标题、摘要或标签..."
              class="form-input admin-search-input"
            >
            <button v-if="searchQuery || selectedTag" class="btn-clear" @click="clearFilters" title="清除筛选">✕</button>
          </div>

          <!-- 排序切换 -->
          <div class="sort-group">
            <button
              :class="['btn-sort', { active: sortMode === 'date-desc' }]"
              @click="sortMode = 'date-desc'"
              title="按日期降序"
            >最新</button>
            <button
              :class="['btn-sort', { active: sortMode === 'date-asc' }]"
              @click="sortMode = 'date-asc'"
              title="按日期升序"
            >最早</button>
            <button
              :class="['btn-sort', { active: sortMode === 'title' }]"
              @click="sortMode = 'title'"
              title="按标题排序"
            >标题</button>
          </div>

          <!-- 功能按钮 -->
          <button class="btn btn-secondary" @click="refresh()" :disabled="pending">
            {{ pending ? "..." : "刷新" }}
          </button>

          <button class="btn btn-accent" :disabled="isRepairing" @click="repairImages()">
            {{ isRepairing ? "修复中..." : "修复图片" }}
          </button>
        </div>
      </section>

      <!-- 标签筛选条 -->
      <section v-if="allTags.length > 0" class="admin-panel tag-filter-bar">
        <span class="tag-filter-label">按标签筛选：</span>
        <div class="tag-filter-list">
          <button
            v-for="tag in allTags"
            :key="tag"
            :class="['tag-badge', { clickable: true, active: selectedTag === tag }]"
            @click="selectedTag = selectedTag === tag ? '' : tag"
          >
            {{ tag }}
          </button>
        </div>
      </section>

      <!-- 修复结果面板 -->
      <Transition name="fade">
        <section v-if="repairMessage" class="admin-panel repair-panel">
          <div class="repair-header">
            <span class="repair-icon">🔧</span>
            <p class="repair-message">{{ repairMessage }}</p>
          </div>

          <div v-if="repairResult" class="repair-stats-grid">
            <div class="repair-stat-card">
              <span class="repair-stat-num">{{ repairResult.scannedPosts }}</span>
              <span class="repair-stat-label">扫描文章</span>
            </div>
            <div class="repair-stat-card">
              <span class="repair-stat-num">{{ repairResult.localImageCount }}</span>
              <span class="repair-stat-label">本地图片</span>
            </div>
            <div class="repair-stat-card success">
              <span class="repair-stat-num">{{ repairResult.fixedCount }}</span>
              <span class="repair-stat-label">已修复</span>
            </div>
            <div class="repair-stat-card" :class="{ error: repairResult.errors.length > 0 }">
              <span class="repair-stat-num">{{ repairResult.errors.length }}</span>
              <span class="repair-stat-label">错误数</span>
            </div>
          </div>

          <div v-if="repairResult?.updatedPosts?.length" class="repair-updated-list">
            <strong>已更新的文章：</strong>
            <div class="repair-chip-list">
              <NuxtLink
                v-for="path in repairResult.updatedPosts"
                :key="path"
                :to="path"
                class="tag-badge link-badge"
              >{{ path.replace("/blog/", "") }}</NuxtLink>
            </div>
          </div>

          <div v-if="repairResult?.errors?.length" class="repair-error-list">
            <strong>错误详情：</strong>
            <div
              v-for="(item, idx) in repairResult.errors"
              :key="`${item.postPath}-${item.imagePath}`"
              class="repair-error-item"
            >
              <code>{{ item.imagePath }}</code>
              <span>{{ item.error }}</span>
            </div>
          </div>
        </section>
      </Transition>

      <!-- 文章卡片列表 -->
      <TransitionGroup name="post-list" tag="div" class="admin-posts-list">
        <article
          v-for="(post, index) in filteredPosts"
          :key="post.path"
          class="admin-post-card"
          :style="{ animationDelay: `${Math.min(index * 40, 300)}ms` }"
        >
          <!-- 序号 -->
          <div class="post-index">{{ index + 1 }}</div>

          <!-- 主内容 -->
          <div class="admin-post-main">
            <p class="admin-post-meta">
              <span class="meta-date">{{ post.date || "无日期" }}</span>
              <span v-if="post.readTime" class="meta-readtime">· {{ post.readTime }}</span>
              <span class="meta-path">{{ post.path.replace("/blog/", "") }}</span>
            </p>
            <h2 class="admin-post-title">
              <NuxtLink :to="post.path" class="post-title-link">{{ post.title || "未命名文章" }}</NuxtLink>
            </h2>
            <p class="admin-post-excerpt">{{ post.excerpt || "暂无摘要" }}</p>

            <!-- 标签 -->
            <div v-if="post.tags?.length" class="admin-post-tags">
              <span
                v-for="tag in post.tags"
                :key="tag"
                :class="['tag-badge', { clickable: true }]"
                @click="selectedTag = tag; window.scrollTo({ top: 0, behavior: 'smooth' })"
              >{{ tag }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="admin-post-actions">
            <NuxtLink :to="post.path" class="btn btn-primary btn-sm btn-action-view">
              <span class="btn-icon">👁</span> 查看
            </NuxtLink>
            <button class="btn btn-sm btn-action-copy" @click="copyPath(post)" title="复制路径">
              📋 路径
            </button>
            <button class="btn btn-danger btn-sm btn-action-delete" @click="confirmDelete(post)">
              <span class="btn-icon">🗑</span> 删除
            </button>
          </div>
        </article>
      </TransitionGroup>

      <!-- 空状态 -->
      <div v-if="!pending && filteredPosts.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-text">{{ searchQuery || selectedTag ? "没有匹配的文章" : "暂无文章" }}</div>
        <p class="empty-hint">
          {{ searchQuery || selectedTag ? "试试其他关键词或清除筛选条件" : "前往「新建文章」页面上传 Markdown 文件" }}
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ===== 布局 ===== */
.admin-posts-main {
  gap: 1rem;
}

.admin-posts-list {
  display: grid;
  gap: 1rem;
}

/* ===== 工具栏 ===== */
.admin-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.toolbar-stats {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.8rem 1.2rem;
  border-radius: 14px;
  background: rgba(183, 140, 77, 0.08);
  cursor: pointer;
  transition: background 0.25s;
}

.toolbar-stats:hover {
  background: rgba(183, 140, 77, 0.15);
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.stat-num {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--film-gold);
  line-height: 1;
}

.stat-label {
  font-size: 0.82rem;
  color: var(--film-muted);
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(183, 140, 77, 0.25);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* 搜索框 */
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 0.9rem;
  pointer-events: none;
}

.admin-search-input {
  width: min(26rem, 100%);
  padding-left: 2.2rem;
  padding-right: 2.2rem;
}

.btn-clear {
  position: absolute;
  right: 8px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(180, 60, 60, 0.7);
  color: #fff;
  font-size: 0.72rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, background 0.2s;
}

.btn-clear:hover {
  transform: scale(1.15);
  background: rgba(200, 70, 70, 0.9);
}

/* 排序按钮组 */
.sort-group {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 10px;
  background: rgba(242, 221, 175, 0.06);
  border: 1px solid rgba(183, 140, 77, 0.18);
}

.btn-sort {
  padding: 0.45rem 0.85rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--film-muted);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-sort:hover {
  color: var(--film-gold-soft);
  background: rgba(183, 140, 77, 0.1);
}

.btn-sort.active {
  background: var(--film-gold);
  color: var(--film-dark);
  box-shadow: 0 2px 8px rgba(183, 140, 77, 0.35);
}

/* ===== 标签筛选 ===== */
.tag-filter-bar {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
  padding: 0.85rem 1.2rem;
}

.tag-filter-label {
  font-size: 0.85rem;
  color: var(--film-muted);
  white-space: nowrap;
  font-weight: 500;
}

.tag-filter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

/* ===== 修复结果面板 ===== */
.repair-panel {
  border-color: rgba(183, 140, 77, 0.3);
  background: linear-gradient(135deg, rgba(242, 221, 175, 0.04), rgba(183, 140, 77, 0.06));
}

.repair-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.repair-icon {
  font-size: 1.3rem;
}

.repair-message {
  margin: 0;
  color: var(--film-paper);
  font-weight: 500;
}

.repair-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.8rem;
  margin-top: 1rem;
}

.repair-stat-card {
  padding: 0.85rem;
  border-radius: 12px;
  background: rgba(242, 221, 175, 0.05);
  border: 1px solid rgba(183, 140, 77, 0.15);
  text-align: center;
  display: grid;
  gap: 0.3rem;
}

.repair-stat-card.success {
  background: rgba(76, 150, 90, 0.1);
  border-color: rgba(76, 150, 90, 0.3);
}

.repair-stat-card.error {
  background: rgba(180, 60, 60, 0.1);
  border-color: rgba(180, 60, 60, 0.3);
}

.repair-stat-num {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--film-gold);
}

.repair-stat-card.success .repair-stat-num {
  color: #6ec98f;
}

.repair-stat-card.error .repair-stat-num {
  color: #e07a7a;
}

.repair-stat-label {
  font-size: 0.78rem;
  color: var(--film-muted);
  letter-spacing: 0.03em;
}

.repair-updated-list,
.repair-error-list {
  margin-top: 1.2rem;
  display: grid;
  gap: 0.6rem;
}

.repair-updated-list strong,
.repair-error-list strong {
  color: var(--film-paper-soft);
  font-size: 0.9rem;
}

.repair-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.link-badge {
  transition: all 0.2s;
}

.link-badge:hover {
  background: var(--film-gold);
  color: var(--film-dark);
  transform: translateY(-1px);
}

.repair-error-item {
  display: grid;
  gap: 0.3rem;
  padding: 0.8rem 1rem;
  border-radius: 10px;
  background: rgba(123, 30, 30, 0.16);
  border: 1px solid rgba(180, 60, 60, 0.2);
}

.repair-error-item code {
  padding: 0.15rem 0.5rem;
  border-radius: 5px;
  background: rgba(183, 140, 77, 0.12);
  color: var(--film-gold-soft);
  font-size: 0.84rem;
}

.repair-error-item span {
  color: #e07a7a;
  font-size: 0.84rem;
}

/* ===== 文章卡片 ===== */
.admin-post-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1.2rem;
  padding: 1.3rem 1.5rem;
  border: 1px solid rgba(183, 140, 77, 0.18);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(242, 221, 175, 0.03), rgba(242, 221, 175, 0.06));
  transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
  animation: cardIn 0.4s ease both;
}

.admin-post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(183, 140, 77, 0.25);
  border-color: rgba(183, 140, 77, 0.35);
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.post-index {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(183, 140, 77, 0.12);
  color: var(--film-muted);
  font-size: 0.85rem;
  font-weight: 600;
  flex-shrink: 0;
}

.admin-post-main {
  min-width: 0;
}

.admin-post-meta {
  margin: 0 0 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  color: var(--film-muted-light);
  font-size: 0.82rem;
  letter-spacing: 0.05em;
}

.meta-date {
  color: var(--film-gold-soft);
  font-weight: 500;
}

.meta-readtime {
  color: var(--film-muted);
}

.meta-path {
  font-family: Consolas, Monaco, monospace;
  font-size: 0.76rem;
  color: var(--film-muted);
  opacity: 0.7;
}

.admin-post-title {
  margin: 0;
  font-size: 1.3rem;
  line-height: 1.3;
}

.post-title-link {
  color: var(--film-gold-soft);
  text-decoration: none;
  transition: color 0.2s;
  display: inline-block;
}

.post-title-link:hover {
  color: var(--film-gold);
}

.admin-post-excerpt {
  margin: 0.7rem 0 0;
  color: var(--film-paper-soft);
  line-height: 1.75;
  font-size: 0.92rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.admin-post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.85rem;
}

/* 操作按钮区 */
.admin-post-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
  flex-shrink: 0;
}

.btn-sm {
  padding: 0.4rem 0.85rem;
  font-size: 0.82rem;
  white-space: nowrap;
}

.btn-icon {
  margin-right: 0.25rem;
}

.btn-action-view {
  background: rgba(183, 140, 77, 0.15);
  color: var(--film-gold-soft);
  border: 1px solid rgba(183, 140, 77, 0.25);
  transition: all 0.2s;
}

.btn-action-view:hover {
  background: var(--film-gold);
  color: var(--film-dark);
  border-color: var(--film-gold);
}

.btn-action-copy {
  background: rgba(120, 140, 170, 0.12);
  color: var(--film-paper-soft);
  border: 1px solid rgba(120, 140, 170, 0.2);
  transition: all 0.2s;
}

.btn-action-copy:hover {
  background: rgba(120, 140, 170, 0.25);
  border-color: rgba(120, 140, 170, 0.4);
}

.btn-action-delete {
  background: rgba(160, 50, 50, 0.15);
  color: #e07a7a;
  border: 1px solid rgba(180, 60, 60, 0.3);
  font-weight: 600;
  transition: all 0.2s;
}

.btn-action-delete:hover {
  background: rgba(180, 60, 60, 0.7);
  color: #fff;
  border-color: rgba(200, 80, 80, 0.8);
  box-shadow: 0 2px 10px rgba(180, 60, 60, 0.3);
}

/* ===== 空状态 ===== */
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  border-radius: 18px;
  background: rgba(242, 221, 175, 0.03);
  border: 1px dashed rgba(183, 140, 77, 0.2);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.8rem;
}

.empty-text {
  font-size: 1.1rem;
  color: var(--film-paper-soft);
  margin-bottom: 0.4rem;
}

.empty-hint {
  color: var(--film-muted);
  font-size: 0.88rem;
  margin: 0;
}

/* ===== 过渡动画 ===== */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.post-list-enter-active,
.post-list-leave-active {
  transition: all 0.35s ease;
}

.post-list-enter-from,
.post-list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.post-list-move {
  transition: transform 0.35s ease;
}

/* ===== 响应式 ===== */
@media (max-width: 1024px) {
  .admin-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-stats {
    justify-content: center;
  }

  .toolbar-actions {
    justify-content: center;
  }

  .search-wrapper {
    flex: 1;
  }

  .admin-search-input {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .admin-post-card {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .post-index {
    display: none;
  }

  .admin-post-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .btn-sm {
    flex: 1;
    min-width: 0;
    justify-content: center;
  }

  .repair-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .tag-filter-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
