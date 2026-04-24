<script setup lang="ts">
/**
 * 关于页面 (about.vue)
 *
 * 耦合关系：
 *   - stores/site.ts     → 读取 about 配置
 *   - components/inspirationSidebar.vue → 灵感侧边栏
 *
 * 函数表：
 *   无自定义函数，仅使用组合式 API
 */

import { storeToRefs } from "pinia";

const siteStore = useSiteStore();
const { about } = storeToRefs(siteStore);

useSeoMeta({
  title: () => about.value.seoTitle,
  description: () => about.value.lead,
});
</script>

<template>
  <div class="space-y-8">
    <!-- 标题区域 -->
    <section class="film-frame">
      <div class="max-w-4xl space-y-5">
        <p class="film-label">{{ about.sectionLabel }}</p>
        <h1 class="text-4xl leading-tight text-(--film-paper) md:text-6xl">
          {{ about.title }}
        </h1>
        <p class="max-w-3xl text-lg leading-8 text-(--film-paper-soft)">
          {{ about.lead }}
        </p>
      </div>
    </section>

    <!-- 章节卡片（三列布局） -->
    <section class="grid gap-6 lg:grid-cols-3">
      <article v-for="chapter in about.chapters" :key="chapter.label" class="paper-panel h-full">
        <p class="text-xs uppercase tracking-[0.35em] text-(--film-muted)">
          {{ chapter.label }}
        </p>
        <h2 class="mt-4 text-2xl text-(--film-ink)">{{ chapter.title }}</h2>
        <p class="mt-4 text-sm leading-8 text-(--film-muted)">
          {{ chapter.body }}
        </p>
      </article>
    </section>

    <!-- 引言 + 灵感侧边栏 -->
    <section class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <article class="paper-panel">
        <p class="film-label">{{ about.note.label }}</p>
        <blockquote class="mt-5 border-l border-[rgba(92,58,32,0.22)] pl-5 text-lg leading-9 text-(--film-ink)">
          {{ about.note.quote }}
        </blockquote>
        <p class="mt-5 text-sm leading-8 text-(--film-muted)">
          {{ about.note.body }}
        </p>
      </article>

      <aside class="paper-panel">
        <inspirationSidebar :inspirations="about.inspirations" :title="about.inspirationLabel" />
      </aside>
    </section>
  </div>
</template>
