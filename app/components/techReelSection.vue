<script setup lang="ts">
import { storeToRefs } from "pinia";

const props = defineProps<{
  showCards?: boolean;
}>();

const siteStore = useSiteStore();
const { home } = storeToRefs(siteStore);
const { getTechReelCards } = siteStore;

const techReel = computed(() => home.value.techReel);
</script>

<template>
  <article class="paper-panel h-full">
    <div class="flex flex-col gap-6 lg:flex-row lg:gap-8 h-full">
      <div class="lg:w-1/3 flex flex-col gap-4">
        <div>
          <p class="film-label">{{ techReel.label }}</p>
          <h2 class="mt-4 text-2xl font-bold text-(--film-ink) md:text-3xl">
            {{ techReel.title }}
          </h2>
        </div>
        <p class="text-sm leading-7 text-(--film-muted)">
          {{ techReel.body }}
        </p>
        <div class="pt-2">
          <a href="/about" class="ticket-button ticket-button-secondary inline-block">
            {{ techReel.actionLabel }}
          </a>
        </div>
      </div>

      <div class="lg:w-2/3 tech-reel-cards-wrapper">
        <transition name="cards-rise" mode="out-in">
          <div v-if="showCards" class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div v-for="card in getTechReelCards" :key="card.id" class="tech-card-mini">
              <p class="tech-card-kicker">{{ card.kicker }}</p>
              <h3 class="tech-card-title">{{ card.title }}</h3>
              <p class="tech-card-summary">{{ card.summary }}</p>
              <p class="tech-card-status">{{ card.status }}</p>
            </div>
          </div>
          <div v-else key="placeholder" class="tech-reel-placeholder">
            <div class="flex items-center justify-center h-full opacity-60">
              <p class="text-sm text-(--film-muted)">
                打开 GameLife 抽屉查看技术卡片
              </p>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </article>
</template>
