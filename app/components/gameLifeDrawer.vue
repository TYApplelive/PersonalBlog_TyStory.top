<script setup lang="ts">
import { nextTick, reactive, ref, watch, type ComponentPublicInstance } from "vue";
import { storeToRefs } from "pinia";
import type { GameEntry } from "~/stores/site";

const siteStore = useSiteStore();
const { gameLife, getActiveGame, isGameDrawerOpen, getGameOrderedList } = storeToRefs(siteStore);
const isClient = import.meta.client;

const pileRef = ref<HTMLElement | null>(null);
const pileBounds = reactive({
  width: 0,
  height: 0,
});
const cardRefs = new Map<string, HTMLElement>();
const dragState = reactive({
  activeId: null as string | null,
  pointerId: null as number | null,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
});

let resizeObserver: ResizeObserver | null = null;

const observePile = () => {
  resizeObserver?.disconnect();

  if (!pileRef.value) {
    return;
  }

  resizeObserver = new ResizeObserver(() => {
    syncPileBounds();
  });

  resizeObserver.observe(pileRef.value);
};

const syncPileBounds = () => {
  if (!pileRef.value) {
    return;
  }

  pileBounds.width = pileRef.value.clientWidth;
  pileBounds.height = pileRef.value.clientHeight;
};

onMounted(() => {
  window.addEventListener("pointermove", handleDragMove);
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (!isClient) {
    return;
  }

  window.removeEventListener("pointermove", handleDragMove);
  window.removeEventListener("pointerup", stopDrag);
  window.removeEventListener("pointercancel", stopDrag);
  document.body.style.userSelect = "";
});

const toggleDrawer = () => {
  siteStore.toggleGameDrawer();
};

const openEnvelope = (gameId: string) => {
  siteStore.openGameEnvelope(gameId);
};

const setCardRef = (gameId: string, element: Element | ComponentPublicInstance | null) => {
  if (!element) {
    cardRefs.delete(gameId);
    return;
  }

  const domElement = "$el" in element ? element.$el : element;

  if (domElement instanceof HTMLElement) {
    cardRefs.set(gameId, domElement);
  }
};

const getEnvelopeMetrics = (gameId: string) => {
  const element = cardRefs.get(gameId);
  const width = element?.offsetWidth ?? 184;
  const height = element?.offsetHeight ?? 148;
  const maxLeft = Math.max(pileBounds.width - width, 0);
  const maxTop = Math.max(pileBounds.height - height, 0);

  return {
    maxLeft,
    maxTop,
  };
};

const getEnvelopeStyle = (game: GameEntry) => {
  const { maxLeft, maxTop } = getEnvelopeMetrics(game.id);
  const left = maxLeft * (game.x / 100);
  const top = maxTop * (game.y / 100);

  return {
    "--envelope-rotate": game.angle,
    left: `${left}px`,
    top: `${top}px`,
    zIndex: String(game.zIndex),
  };
};

watch(
  isGameDrawerOpen,
  async (isOpen) => {
    if (!isOpen) {
      resizeObserver?.disconnect();
      dragState.activeId = null;
      dragState.pointerId = null;

      if (isClient) {
        document.body.style.userSelect = "";
      }

      return;
    }

    await nextTick();
    syncPileBounds();
    observePile();
  },
  { immediate: true },
);

const startDrag = (gameId: string, event: PointerEvent) => {
  const draggedGame = getGameOrderedList.value.find((game) => game.id === gameId);

  if (!draggedGame) {
    return;
  }

  siteStore.openGameEnvelope(gameId);

  dragState.activeId = gameId;
  dragState.pointerId = event.pointerId;
  dragState.startX = event.clientX;
  dragState.startY = event.clientY;
  dragState.originX = draggedGame.x;
  dragState.originY = draggedGame.y;

  // 拖拽中的临时状态留在组件内，最终坐标统一落回 Pinia。
  document.body.style.userSelect = "none";
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
};

const handleDragMove = (event: PointerEvent) => {
  if (!dragState.activeId || dragState.pointerId !== event.pointerId) {
    return;
  }

  const { maxLeft, maxTop } = getEnvelopeMetrics(dragState.activeId);
  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;
  const originLeft = maxLeft * (dragState.originX / 100);
  const originTop = maxTop * (dragState.originY / 100);
  const nextLeft = Math.min(Math.max(originLeft + deltaX, 0), maxLeft);
  const nextTop = Math.min(Math.max(originTop + deltaY, 0), maxTop);

  siteStore.updateGameCardPosition(dragState.activeId, {
    x: maxLeft === 0 ? 0 : (nextLeft / maxLeft) * 100,
    y: maxTop === 0 ? 0 : (nextTop / maxTop) * 100,
  });
};

const stopDrag = (event: PointerEvent) => {
  if (dragState.pointerId !== event.pointerId) {
    return;
  }

  dragState.activeId = null;
  dragState.pointerId = null;
  document.body.style.userSelect = "";
};
</script>

<template>
  <article class="paper-panel overflow-hidden">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="film-label">{{ gameLife.label }}</p>
        <h2 class="game-drawer-title mt-4">{{ gameLife.title }}</h2>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-[var(--film-muted)]">
          {{ gameLife.subtitle }}
        </p>
      </div>

      <button type="button" class="ticket-button game-drawer-toggle" @click="toggleDrawer">
        {{ isGameDrawerOpen ? gameLife.closeLabel : gameLife.openLabel }}
      </button>
    </div>

    <transition name="drawer-rise">
      <div v-if="isGameDrawerOpen" class="game-drawer mt-6">
        <div v-if="getActiveGame" class="game-letter">
          <p class="game-letter-meta">{{ getActiveGame.years }} / {{ getActiveGame.genre }} / {{ getActiveGame.hours }}</p>
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

        <div class="game-drawer-envelope-stage">
          <div class="game-envelope-stage-copy">
            <p class="game-drawer-hint">{{ gameLife.drawerHint }}</p>
          </div>

          <div ref="pileRef" class="game-envelope-pile" aria-label="Game cards tabletop">
            <button
              v-for="game in getGameOrderedList"
              :key="game.id"
              :ref="(element) => setCardRef(game.id, element)"
              type="button"
              class="game-envelope"
              :class="{
                'game-envelope-active': getActiveGame?.id === game.id,
                'game-envelope-wide': game.sizeVariant === 'wide',
                'game-envelope-dragging': dragState.activeId === game.id,
              }"
              :style="getEnvelopeStyle(game)"
              @pointerdown.prevent="startDrag(game.id, $event)"
              @keydown.enter.prevent="openEnvelope(game.id)"
              @keydown.space.prevent="openEnvelope(game.id)"
            >
              <span class="game-envelope-title">{{ game.title }}</span>
              <span class="game-envelope-meta">{{ game.genre }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </article>
</template>
