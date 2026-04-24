<script setup lang="ts">
/**
 * 技术技能展示区组件 (techReelSection.vue)
 *
 * 耦合关系：
 *   - stores/site.ts → 读取 home.techReel / getTechReelCards
 *
 * 应用方式：
 *   <techReelSection :show-cards="isGameDrawerOpen" />
 *
 * 函数表：
 *   - techReel:  计算属性，获取技术展示配置
 *   - techCards: 计算属性，获取技术卡片列表
 */

import { storeToRefs } from "pinia";

const props = withDefaults(defineProps<{ showCards?: boolean }>(), {
  showCards: false,
});

const siteStore = useSiteStore();
const { home, getTechReelCards } = storeToRefs(siteStore);

const techReel = computed(() => home.value.techReel);
const techCards = computed(() => getTechReelCards.value);
</script>

<template>
  <article class="paper-panel tech-reel-panel">
    <div class="tech-reel-copy">
      <div class="film-label-wrapper">
        <p class="film-label">{{ techReel.label }}</p>
        <p v-if="!props.showCards" class="tech-reel-state-note">
          Open GameLife drawer to reveal tech cards.
        </p>
      </div>
      <h2 class="tech-reel-title">{{ techReel.title }}</h2>
      <p class="tech-reel-body">{{ techReel.body }}</p>
      <NuxtLink to="/about" class="ticket-button ticket-button-secondary tech-reel-action">
        {{ techReel.actionLabel }}
      </NuxtLink>
    </div>

    <transition name="tech-cards-fade">
      <div v-if="props.showCards" class="tech-reel-grid" aria-label="Tech cards">
        <article v-for="card in techCards" :key="card.id" class="tech-card-mini">
          <p class="tech-card-kicker">{{ card.kicker }}</p>
          <h3 class="tech-card-title">{{ card.title }}</h3>
          <p class="tech-card-summary">{{ card.summary }}</p>
          <p class="tech-card-status">{{ card.status }}</p>
        </article>
      </div>
    </transition>
  </article>
</template>
