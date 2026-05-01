<script setup lang="ts">
/**
 * YearTimeline 组件
 *
 * 互动式发布年份时间轴。点击/悬停时显示按年份分组的文章列表。
 *
 * Props:
 *   - posts → 文章列表（需包含 title, date, path 字段）
 *
 * 交互：
 *   - 点击 stat card 展开/收起时间轴
 *   - 点击文章标题跳转到对应文章页面
 */
import type { BlogPost } from "#shared/types/site";

const props = defineProps<{
  posts: BlogPost[];
}>();

const isOpen = ref(false);

/** 按年份分组的文章 */
const groupedByYear = computed(() => {
  const map = new Map<string, BlogPost[]>();
  for (const post of props.posts) {
    const year = post.date?.slice(0, 4) || "未知";
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(post);
  }
  // 按年份降序排列
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
});

/** 有文章的年份列表 */
const years = computed(() => groupedByYear.value.map(([year]) => year));

/** 年份总数 */
const yearCount = computed(() => years.value.length);

function toggle() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    console.log('[YearTimeline] 时间轴已展开，年份:', years.value.join(', '));
  }
}

function close() {
  isOpen.value = false;
}

/** 点击外部关闭 */
function onClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.year-timeline-wrapper')) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside);
});
</script>

<template>
  <div class="year-timeline-wrapper">
    <!-- 触发器：年份统计卡片 -->
    <div class="stat-card year-stat-card" @click.stop="toggle" :class="{ active: isOpen }">
      <div class="stat-value">{{ yearCount }}</div>
      <div class="stat-label">发布年份</div>
    </div>

    <!-- 时间轴浮层 -->
    <Teleport to="body">
      <Transition name="timeline-fade">
        <div v-if="isOpen" class="timeline-overlay" @click.self="close">
          <div class="timeline-popup">
            <div class="timeline-header">
              <h3>发布年份时间轴</h3>
              <button class="timeline-close" @click="close">×</button>
            </div>

            <div class="timeline-body">
              <div v-for="[year, articles] in groupedByYear" :key="year" class="timeline-year-group">
                <div class="timeline-year-marker">
                  <span class="timeline-dot"></span>
                  <span class="timeline-year-label">{{ year }}</span>
                  <span class="timeline-count">{{ articles.length }} 篇</span>
                </div>
                <div class="timeline-articles">
                  <NuxtLink
                    v-for="article in articles"
                    :key="article.path"
                    :to="article.path"
                    class="timeline-article-link"
                  >
                    <span class="timeline-article-date">{{ article.date?.slice(5) || '' }}</span>
                    <span class="timeline-article-title">{{ article.title || '未命名' }}</span>
                  </NuxtLink>
                </div>
              </div>

              <div v-if="groupedByYear.length === 0" class="timeline-empty">
                暂无文章数据
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.year-timeline-wrapper {
  display: contents;
}

.year-stat-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  position: relative;
}

.year-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(183, 140, 77, 0.15);
  border-color: rgba(183, 140, 77, 0.35);
}

.year-stat-card.active {
  border-color: var(--film-gold);
  box-shadow: 0 4px 20px rgba(183, 140, 77, 0.25);
}

/* 浮层 */
.timeline-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: grid;
  place-items: center;
  background: rgba(20, 12, 9, 0.6);
  backdrop-filter: blur(4px);
}

.timeline-popup {
  width: min(560px, 90vw);
  max-height: 75vh;
  border: 1px solid rgba(183, 140, 77, 0.35);
  border-radius: 20px;
  background: var(--film-dark, #140c09);
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid rgba(183, 140, 77, 0.15);
}

.timeline-header h3 {
  margin: 0;
  color: var(--film-gold-soft);
  font-size: 1.15rem;
}

.timeline-close {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(183, 140, 77, 0.25);
  border-radius: 50%;
  background: transparent;
  color: var(--film-paper-soft);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.timeline-close:hover {
  background: rgba(180, 60, 60, 0.3);
  border-color: rgba(180, 60, 60, 0.5);
  color: #e07a7a;
}

.timeline-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: grid;
  gap: 1.2rem;
}

/* 年份组 */
.timeline-year-group {
  display: grid;
  gap: 0.3rem;
}

.timeline-year-marker {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--film-gold);
  flex-shrink: 0;
}

.timeline-year-label {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--film-gold-soft);
}

.timeline-count {
  font-size: 0.8rem;
  color: var(--film-muted);
  margin-left: auto;
}

/* 文章链接 */
.timeline-articles {
  margin-left: 1.35rem;
  padding-left: 1rem;
  border-left: 2px solid rgba(183, 140, 77, 0.2);
  display: grid;
  gap: 0.35rem;
}

.timeline-article-link {
  display: flex;
  gap: 0.6rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  color: var(--film-paper-soft);
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
  font-size: 0.9rem;
}

.timeline-article-link:hover {
  background: rgba(183, 140, 77, 0.1);
  color: var(--film-gold-soft);
}

.timeline-article-date {
  color: var(--film-muted);
  font-size: 0.82rem;
  font-family: Consolas, Monaco, monospace;
  flex-shrink: 0;
  min-width: 2.7rem;
}

.timeline-article-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-empty {
  text-align: center;
  color: var(--film-muted);
  padding: 2rem 0;
}

/* 过渡动画 */
.timeline-fade-enter-active,
.timeline-fade-leave-active {
  transition: opacity 0.25s ease;
}

.timeline-fade-enter-from,
.timeline-fade-leave-to {
  opacity: 0;
}

.timeline-fade-enter-active .timeline-popup {
  animation: popIn 0.25s ease;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 640px) {
  .timeline-popup {
    width: 95vw;
    max-height: 80vh;
  }

  .timeline-body {
    padding: 1rem;
  }
}
</style>
