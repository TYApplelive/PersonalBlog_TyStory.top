<script setup lang="ts">
/**
 * 游戏人生抽屉组件 (gameLifeDrawer.vue)
 *
 * 耦合关系：
 *   - stores/site.ts → 读取 gameLife / isGameDrawerOpen / getActiveGame / getGameOrderedList
 *
 * 应用方式：
 *   <gameLifeDrawer />
 *
 * 函数表：
 *   - toggleDrawer()          切换抽屉开关
 *   - cardStyle(game)         根据游戏位置生成内联样式
 *   - clamp(value, min, max)  数值钳制
 *   - toPercent(value, total) 像素值转百分比
 *   - getStageMetrics()       获取舞台容器尺寸信息
 *   - makeCardSlots(count, w, h) 生成分散卡牌位置
 *   - generateCards()         初始化所有卡牌位置
 *   - pickCard(gameId)        点击卡牌，打开信封
 *   - startDrag(event, game)  开始拖拽卡牌
 *   - moveDrag(event)         拖拽移动中
 *   - endDrag(event)          结束拖拽
 */

import { storeToRefs } from "pinia";
import type { GameEntry } from "~/stores/site";

// 拖拽状态接口
interface DragState {
  id: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  cardWidth: number;
  cardHeight: number;
  startClientX: number;
  startClientY: number;
  hasMoved: boolean;
}

// 卡牌固定尺寸
const CARD_WIDTH = 150;
const CARD_HEIGHT = 68;

// 获取 store 数据
const siteStore = useSiteStore();
const { gameLife, isGameDrawerOpen, getActiveGame, getGameOrderedList } = storeToRefs(siteStore);
const { toggleGameDrawer, openGameEnvelope, updateGameCardPosition } = siteStore;

// 组件内部状态
const stageRef = ref<HTMLElement | null>(null);
const hasGeneratedCards = ref(false);
const suppressClick = ref(false);
const dragState = ref<DragState | null>(null);

// 切换抽屉开关
const toggleDrawerLocal = () => {
  toggleGameDrawer();
};

// 根据游戏位置生成卡牌内联样式
const cardStyle = (game: GameEntry) => ({
  left: `${game.x}%`,
  top: `${game.y}%`,
  zIndex: game.zIndex,
  "--card-angle": game.angle,
}) as Record<string, string | number>;

// 数值钳制：限制 value 在 [min, max] 范围内
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// 像素值转百分比
function toPercent(value: number, total: number) {
  return total <= 0 ? 0 : (value / total) * 100;
}

// 获取舞台容器的尺寸信息
function getStageMetrics() {
  const stage = stageRef.value;
  if (!stage) return null;
  return { rect: stage.getBoundingClientRect() };
}

// 生成分散卡牌位置：根据容器尺寸计算网格布局 + 随机抖动
function makeCardSlots(count: number, width: number, height: number) {
  const columns = width >= 360 ? 2 : 1;
  const rows = Math.ceil(count / columns);
  const maxLeft = Math.max(0, width - CARD_WIDTH);
  const maxTop = Math.max(0, height - CARD_HEIGHT);
  const cellWidth = columns === 1 ? maxLeft : maxLeft / (columns - 1);
  const cellHeight = rows <= 1 ? 0 : maxTop / (rows - 1);

  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const direction = index % 2 === 0 ? 1 : -1;
    const overlapOffset = row % 2 === 0 ? 0 : CARD_WIDTH * 0.18;
    const jitterX = direction * Math.min(14, width * 0.035);
    const jitterY = ((index % 3) - 1) * 8;

    const left = clamp(column * cellWidth + overlapOffset + jitterX, 0, maxLeft);
    const top = clamp(row * cellHeight + jitterY, 0, maxTop);

    return {
      x: toPercent(left, width),
      y: toPercent(top, height),
      angle: `${direction * (3 + (index % 3))}deg`,
      zIndex: index + 2,
    };
  });
}

// 初始化所有卡牌位置
function generateCards() {
  const stage = stageRef.value;
  if (!stage) return;

  const rect = stage.getBoundingClientRect();
  const slots = makeCardSlots(getGameOrderedList.value.length, rect.width, rect.height);

  getGameOrderedList.value.forEach((game, index) => {
    const slot = slots[index];
    if (!slot) return;

    updateGameCardPosition(game.id, { x: slot.x, y: slot.y });
    game.angle = slot.angle;
    game.zIndex = slot.zIndex;
  });

  hasGeneratedCards.value = true;
}

// 点击卡牌，打开信封
function pickCard(gameId: string) {
  // 拖拽后不触发点击
  if (suppressClick.value) {
    suppressClick.value = false;
    return;
  }
  openGameEnvelope(gameId);
}

// 开始拖拽卡牌
function startDrag(event: PointerEvent, game: GameEntry) {
  const stageMetrics = getStageMetrics();
  const target = event.currentTarget as HTMLElement | null;
  if (!stageMetrics || !target) return;

  const cardRect = target.getBoundingClientRect();
  event.preventDefault();
  openGameEnvelope(game.id);

  dragState.value = {
    id: game.id,
    pointerId: event.pointerId,
    offsetX: event.clientX - cardRect.left,
    offsetY: event.clientY - cardRect.top,
    cardWidth: cardRect.width,
    cardHeight: cardRect.height,
    startClientX: event.clientX,
    startClientY: event.clientY,
    hasMoved: false,
  };

  window.addEventListener("pointermove", moveDrag);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
}

// 拖拽移动中：更新卡牌位置
function moveDrag(event: PointerEvent) {
  const drag = dragState.value;
  const stageMetrics = getStageMetrics();
  if (!drag || !stageMetrics || drag.pointerId !== event.pointerId) return;

  const deltaX = event.clientX - drag.startClientX;
  const deltaY = event.clientY - drag.startClientY;
  // 移动距离小于 4px 不触发
  if (!drag.hasMoved && Math.hypot(deltaX, deltaY) < 4) return;

  drag.hasMoved = true;

  const maxLeft = Math.max(0, stageMetrics.rect.width - drag.cardWidth);
  const maxTop = Math.max(0, stageMetrics.rect.height - drag.cardHeight);
  const nextLeft = clamp(event.clientX - stageMetrics.rect.left - drag.offsetX, 0, maxLeft);
  const nextTop = clamp(event.clientY - stageMetrics.rect.top - drag.offsetY, 0, maxTop);

  updateGameCardPosition(drag.id, {
    x: toPercent(nextLeft, stageMetrics.rect.width),
    y: toPercent(nextTop, stageMetrics.rect.height),
  });
}

// 结束拖拽：清理事件监听
function endDrag(event: PointerEvent) {
  const drag = dragState.value;
  if (!drag || drag.pointerId !== event.pointerId) return;

  suppressClick.value = drag.hasMoved;
  dragState.value = null;
  window.removeEventListener("pointermove", moveDrag);
  window.removeEventListener("pointerup", endDrag);
  window.removeEventListener("pointercancel", endDrag);
}

// 监听抽屉状态：首次打开时生成卡牌布局
watch(
  isGameDrawerOpen,
  async (isOpen) => {
    if (!isOpen || hasGeneratedCards.value) return;
    await nextTick();
    generateCards();
  },
);

// 组件卸载时清理事件监听
onBeforeUnmount(() => {
  window.removeEventListener("pointermove", moveDrag);
  window.removeEventListener("pointerup", endDrag);
  window.removeEventListener("pointercancel", endDrag);
});
</script>

<template>
  <article class="paper-panel game-life-panel">
    <!-- 头部：标题 + 切换按钮 -->
    <header class="game-life-head">
      <div>
        <p class="film-label">{{ gameLife.label }}</p>
        <h2 class="game-life-title">{{ gameLife.title }}</h2>
        <p class="game-life-subtitle">{{ gameLife.subtitle }}</p>
      </div>

      <button type="button" class="ticket-button game-drawer-toggle" @click="toggleDrawerLocal">
        {{ isGameDrawerOpen ? gameLife.closeLabel : gameLife.openLabel }}
      </button>
    </header>

    <!-- 抽屉内容区 -->
    <transition name="drawer-rise">
      <div v-if="isGameDrawerOpen" class="game-drawer-stack">
        <!-- 活跃游戏信件详情 -->
        <section v-if="getActiveGame" class="game-letter">
          <p class="game-letter-meta">
            {{ getActiveGame.years }} / {{ getActiveGame.genre }} / {{ getActiveGame.hours }}
          </p>
          <h3 class="game-letter-title">{{ getActiveGame.title }}</h3>
          <p class="game-letter-hook">{{ getActiveGame.hook }}</p>

          <div class="story-divider" />

          <p class="game-letter-section">Game Intro</p>
          <p class="game-letter-note">{{ getActiveGame.intro }}</p>

          <div class="story-divider" />

          <p class="game-letter-section">Your Notes</p>
          <p class="game-letter-note">{{ getActiveGame.note }}</p>
        </section>

        <!-- 卡牌桌面：可拖拽的游戏卡牌 -->
        <section class="game-tabletop-wrap">
          <p class="game-drawer-hint">{{ gameLife.drawerHint }}</p>
          <div ref="stageRef" class="game-envelope-stage">
            <button v-for="game in getGameOrderedList" :key="game.id" type="button" class="game-envelope"
              :class="{ 'game-envelope-active': getActiveGame?.id === game.id }" :style="cardStyle(game)"
              @pointerdown="startDrag($event, game)" @click="pickCard(game.id)">
              <span class="game-envelope-title">{{ game.title }}</span>
              <span class="game-envelope-meta">{{ game.genre }}</span>
            </button>
          </div>
        </section>
      </div>
    </transition>
  </article>
</template>
