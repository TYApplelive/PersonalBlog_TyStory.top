<script setup lang="ts">
/**
 * 关于页面 (about.vue)
 * 
 * 展示个人简介和相关信息，包含：
 * - 页面主标题和导语
 * - 三个章节卡片（个人经历、技能等）
 * - 名言引用区域
 * - 灵感侧边栏（电影、音乐、书籍等）
 */

// 从 Pinia 状态管理中获取响应式数据
import { storeToRefs } from "pinia";

// 初始化站点状态管理
const siteStore = useSiteStore();

// 解构需要使用的状态数据
// about: 关于页面相关配置（标题、章节、引言、灵感等）
const { about } = storeToRefs(siteStore);

/**
 * SEO 元数据配置
 * 设置页面标题和描述
 */
useSeoMeta({
  title: () => about.value.seoTitle,    // SEO 标题
  description: () => about.value.lead,  // SEO 描述（使用导语）
});
</script>

<template>
  <!-- 主容器：垂直间距 -->
  <div class="space-y-8">

    <!-- 
      第一部分：页面标题区域
      包含：标签、主标题、导语
    -->
    <section class="film-frame">
      <div class="max-w-4xl space-y-5">
        <!-- 标签（如"ABOUT"） -->
        <p class="film-label">{{ about.sectionLabel }}</p>

        <!-- 主标题 -->
        <h1 class="text-4xl leading-tight text-[var(--film-paper)] md:text-6xl">
          {{ about.title }}
        </h1>

        <!-- 导语/介绍 -->
        <p class="max-w-3xl text-lg leading-8 text-[var(--film-paper-soft)]">
          {{ about.lead }}
        </p>
      </div>
    </section>

    <!-- 
      第二部分：章节卡片区域
      三列布局（lg:grid-cols-3），展示个人经历/技能等
    -->
    <section class="grid gap-6 lg:grid-cols-3">
      <!-- 遍历渲染每个章节 -->
      <article v-for="chapter in about.chapters" :key="chapter.label" class="paper-panel h-full">
        <!-- 章节标签 -->
        <p class="text-xs uppercase tracking-[0.35em] text-[var(--film-muted)]">
          {{ chapter.label }}
        </p>

        <!-- 章节标题 -->
        <h2 class="mt-4 text-2xl text-[var(--film-ink)]">{{ chapter.title }}</h2>

        <!-- 章节内容 -->
        <p class="mt-4 text-sm leading-8 text-[var(--film-muted)]">
          {{ chapter.body }}
        </p>
      </article>
    </section>

    <!-- 
      第三部分：引言和灵感侧边栏
      不等宽布局：左侧 1.2fr，右侧 0.8fr
    -->
    <section class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <!-- 左侧：名言引用区域 -->
      <article class="paper-panel">
        <!-- 引用标签 -->
        <p class="film-label">{{ about.note.label }}</p>

        <!-- 名言引用内容 -->
        <blockquote class="mt-5 border-l border-[rgba(92,58,32,0.22)] pl-5 text-lg leading-9 text-[var(--film-ink)]">
          {{ about.note.quote }}
        </blockquote>

        <!-- 引言补充说明 -->
        <p class="mt-5 text-sm leading-8 text-[var(--film-muted)]">
          {{ about.note.body }}
        </p>
      </article>

      <!-- 右侧：灵感侧边栏 -->
      <aside class="paper-panel">
        <!-- 
          inspirationSidebar: 展示灵感来源（电影、音乐、书籍、语录）
          传入：灵感列表数据、标题
        -->
        <inspirationSidebar :inspirations="about.inspirations" :title="about.inspirationLabel" />
      </aside>
    </section>
  </div>
</template>
