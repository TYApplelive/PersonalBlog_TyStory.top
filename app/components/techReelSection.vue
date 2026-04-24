<script setup lang="ts">
import { storeToRefs } from "pinia";

const props = defineProps<{
  showCards?: boolean;
}>();

const siteStore = useSiteStore();
const { home } = storeToRefs(siteStore);
const { getTechReelCards } = siteStore;

// 文案常驻，技术卡片只在 GameLife 抽屉打开后再显式渲染。
const techReel = computed(() => home.value.techReel);
</script>

<template>
  <article class="paper-panel tech-reel-panel h-full">
    <div class="tech-reel-copy">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div class="tech-reel-heading">
          <p class="film-label">{{ techReel.label }}</p>
          <h2 class="tech-reel-title mt-4">
            {{ techReel.title }}
          </h2>
        </div>

        <NuxtLink to="/about" class="ticket-button ticket-button-secondary inline-flex shrink-0">
          {{ techReel.actionLabel }}
        </NuxtLink>
      </div>

      <p class="tech-reel-body mt-4">
        {{ techReel.body }}
      </p>

      <p v-if="props.showCards" class="tech-reel-state-note mt-4">
        这一组内容改成上下结构。上面先交代现在在做什么，下面再展开四张技术卡片。
      </p>
    </div>

    <transition name="tech-cards-fade">
      <div v-if="props.showCards" class="tech-reel-cards-wrapper mt-6">
        <div class="tech-reel-grid">
          <div v-for="card in getTechReelCards" :key="card.id" class="tech-card-mini">
            <p class="tech-card-kicker">{{ card.kicker }}</p>
            <h3 class="tech-card-title">{{ card.title }}</h3>
            <p class="tech-card-summary">{{ card.summary }}</p>
            <p class="tech-card-status">{{ card.status }}</p>
          </div>
        </div>
      </div>
    </transition>
  </article>
</template>
