<script setup lang="ts">
/**
 * 自定义页脚组件
 * 
 * 显示站点品牌信息、描述、联系方式和版权信息
 * 采用电影胶片风格设计
 */

// 获取站点 store
const siteStore = useSiteStore();

// 获取当前年份
const year = new Date().getFullYear();
</script>

<!-- 模板部分：页脚布局 -->
<template>
  <!-- 页脚容器 - 使用电影胶片边框样式 -->
  <footer class="film-frame mt-10 px-6 py-6 md:px-8">
    <!-- 主要内容区：品牌信息和联系方式 -->
    <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <!-- 左侧：品牌标题和描述 -->
      <div class="space-y-3">
        <!-- "End Credits" 标签 -->
        <p class="film-label">{{ siteStore.footer.label }}</p>
        <div>
          <!-- 网站标题 -->
          <h2 class="text-2xl text-[var(--film-paper)]">{{ siteStore.brand.title }}</h2>
          <!-- 网站描述 -->
          <p class="max-w-2xl text-sm leading-7 text-[var(--film-muted-light)]">
            {{ siteStore.footer.description }}
          </p>
        </div>
      </div>

      <!-- 右侧：联系方式 -->
      <div class="min-w-60">
        <contactIcons :title="siteStore.footer.contactLabel" />
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="story-divider my-5" />

    <!-- 底部版权信息 -->
    <div
      class="flex flex-col gap-3 text-xs uppercase tracking-[0.28em] text-[var(--film-muted)] md:flex-row md:items-center md:justify-between">
      <p>{{ year }} {{ siteStore.brand.title }}</p>
      <p>{{ siteStore.footer.ending }} {{ siteStore.brand.owner }}</p>
    </div>
  </footer>
</template>
