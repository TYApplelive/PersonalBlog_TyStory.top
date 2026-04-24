<script setup lang="ts">
/**
 * 首页 (index.vue)
 *
 * 耦合关系：
 *   - stores/site.ts     → 读取 brand / home / stack / isGameDrawerOpen
 *   - components/gameLifeDrawer.vue → 游戏人生抽屉
 *   - components/techReelSection.vue → 技术技能展示
 *
 * 函数表：
 *   无自定义函数，仅使用组合式 API
 */

import { storeToRefs } from "pinia";

const siteStore = useSiteStore();
const { brand, home, stack, isGameDrawerOpen } = storeToRefs(siteStore);

useSeoMeta({
  title: () => home.value.seoTitle,
  description: () => home.value.intro,
});
</script>

<template>
  <div class="space-y-8">
    <!-- 主内容区：个人LOGO + 海报卡片 -->
    <section class="film-frame overflow-hidden">
      <div class="grid gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-center">
        <!-- 左侧：个人LOGO卡片 -->
        <div class="space-y-6">
          <p class="film-label">{{ home.kicker }}</p>

          <div class="space-y-4">
            <p class="text-xs uppercase tracking-[0.45em] md:text-sm brand-label">
              {{ brand.owner }} / {{ brand.alias }}
            </p>
            <h1 class="hero-title">{{ home.title }}</h1>
            <p class="max-w-3xl text-xl leading-8 md:text-2xl home-subtitle">
              {{ home.subtitle }}
            </p>
            <p class="max-w-2xl text-base leading-8 md:text-lg home-intro">
              {{ home.intro }}
            </p>
          </div>

          <!-- 技能标签 -->
          <div class="flex flex-wrap gap-3">
            <span v-for="badge in home.badges" :key="badge" class="contact-chip">
              {{ badge }}
            </span>
          </div>

          <!-- CTA 按钮 -->
          <div class="flex flex-wrap gap-4 pt-2">
            <NuxtLink v-for="action in home.ctas" :key="action.to" :to="action.to" class="ticket-button"
              :class="action.variant === 'primary' ? 'ticket-button-primary' : 'ticket-button-secondary'">
              {{ action.label }}
            </NuxtLink>
          </div>
        </div>

        <!-- 右侧：海报卡片 -->
        <aside class="poster-card">
          <p class="text-xs uppercase tracking-[0.35em] poster-label">
            {{ home.poster.label }}
          </p>

          <div class="mt-5 space-y-4">
            <div>
              <p class="text-sm uppercase tracking-[0.3em] poster-title-label">
                {{ home.poster.titleLabel }}
              </p>
              <h2 class="mt-2 text-3xl leading-tight poster-title">
                {{ home.poster.title }}
              </h2>
            </div>

            <p class="text-sm leading-7 poster-body">
              {{ home.poster.body }}
            </p>

            <div class="story-divider" />

            <ul class="space-y-3 text-sm leading-7 poster-notes">
              <li v-for="note in home.notes" :key="note">{{ note }}</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>

    <!-- 底部网格：游戏人生 + 技术展示 -->
    <section class="home-bottom-grid">
      <gameLifeDrawer />
      <techReelSection :show-cards="isGameDrawerOpen" />
    </section>
  </div>
</template>
