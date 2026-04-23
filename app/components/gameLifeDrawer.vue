<script setup lang="ts">
import { storeToRefs } from "pinia";

const siteStore = useSiteStore();
const { gameLife, getActiveGame, isGameDrawerOpen, getGameOrderedList } = storeToRefs(siteStore);

const toggleDrawer = () => {
  siteStore.toggleGameDrawer();
};

const openEnvelope = (gameId: string) => {
  siteStore.openGameEnvelope(gameId);
};
</script>

<template>
  <article class="paper-panel overflow-hidden">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="film-label">{{ gameLife.label }}</p>
        <h2 class="mt-4 text-3xl text-(--film-ink)">{{ gameLife.title }}</h2>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-(--film-muted)">
          {{ gameLife.subtitle }}
        </p>
      </div>

      <button type="button" class="ticket-button game-drawer-toggle" @click="toggleDrawer">
        {{ isGameDrawerOpen ? gameLife.closeLabel : gameLife.openLabel }}
      </button>
    </div>

    <transition name="drawer-rise">
      <div v-if="isGameDrawerOpen" class="game-drawer mt-6">
        <!-- 左侧：游戏信封舞台（流动式网格布局） -->
        <div class="game-drawer-envelope-stage">
          <p class="game-drawer-hint">{{ gameLife.drawerHint }}</p>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <button v-for="game in getGameOrderedList" :key="game.id" type="button" class="game-envelope"
              :class="{ 'game-envelope-active': getActiveGame?.id === game.id, [game.sizeVariant as string]: game.sizeVariant }" :style="{ rotate: game.angle }"
              @click="openEnvelope(game.id)">
              <span class="game-envelope-title">{{ game.title }}</span>
              <span class="game-envelope-meta">{{ game.genre }}</span>
            </button>
          </div>
        </div>

        <!-- 右侧：游戏详情卡 -->
        <div v-if="getActiveGame" class="game-letter">
          <p class="game-letter-meta">{{ getActiveGame.years }} / {{ getActiveGame.genre }} / {{ getActiveGame.hours }}
          </p>
          <h3 class="game-letter-title">{{ getActiveGame.title }}</h3>
          <p class="game-letter-hook">{{ getActiveGame.hook }}</p>
          <div class="story-divider my-4" />

          <div class="space-y-2">
            <p class="game-letter-section">Game Intro</p>
            <p class="game-letter-note">{{ getActiveGame.intro }}</p>
          </div>

          <div class="story-divider my-4" />

          <div class="space-y-2">
            <p class="game-letter-section">Your Notes</p>
            <p class="game-letter-note">{{ getActiveGame.note }}</p>
          </div>
        </div>
      </div>
    </transition>
  </article>
</template>
