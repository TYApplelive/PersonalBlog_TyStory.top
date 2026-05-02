<script setup lang="ts">
/**
 * 404 捕获所有路由 (app/pages/[...slug].vue)
 * 风格：美国西部 / 荒野大镖客 / WANTED 通缉令
 */

// 禁用默认布局，全屏显示通缉令
definePageMeta({ layout: false });

useHead({ title: 'Page Not Found' })

function goHome() {
  navigateTo('/')
}

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    window.history.back()
  } else {
    navigateTo('/')
  }
}
</script>

<template>
  <div class="wildwest-error">
    <!-- 沙漠背景层 -->
    <div class="desert-bg"></div>

    <!-- 飘尘粒子 -->
    <div class="dust-particles">
      <span v-for="i in 12" :key="i" class="dust" :style="{
        '--delay': `${Math.random() * 5}s`,
        '--duration': `${3 + Math.random() * 4}s`,
        '--x': `${Math.random() * 100}%`,
        '--size': `${2 + Math.random() * 3}px`,
      }"></span>
    </div>

    <!-- 通缉令主体 -->
    <div class="wanted-poster">
      <!-- 顶部装饰线 -->
      <div class="poster-border-top">
        <span class="ornament-left">⬥</span>
        <span class="ornament-line"></span>
        <span class="ornament-right">⬥</span>
      </div>

      <!-- WANTED 标题 -->
      <div class="wanted-header">
        <p class="wanted-eyebrow">— W A N T E D —</p>
        <h1 class="wanted-code">404</h1>
      </div>

      <!-- 分隔线 -->
      <div class="wanted-divider">
        <span class="divider-star">★</span>
      </div>

      <!-- 描述 -->
      <div class="wanted-body">
        <h2 class="wanted-title">DEAD OR ALIVE</h2>
        <p class="wanted-desc">
          这片荒野上没有你要找的地方。<br>
          风沙已经抹去了所有痕迹。
        </p>
      </div>

      <!-- 悬赏金额装饰 -->
      <div class="wanted-reward">
        <span class="reward-label">REWARD</span>
        <span class="reward-amount">$ 404,000</span>
      </div>

      <!-- 操作按钮 -->
      <div class="wanted-actions">
        <button class="btn-western btn-primary-western" @click="goHome">
          <p class="flex items-center">
            <LucideHome :size="20" /> <text class="ml-2">回到首页</text>
          </p>
        </button>
        <button class="btn-western btn-ghost-western" @click="goBack">
          <p class="flex items-center">
            <LucideArrowBigLeftDash :size="20" /> <text class="ml-2">掉头回去</text>
          </p>
        </button>
      </div>

      <!-- 底部装饰 -->
      <div class="poster-border-bottom">
        <span class="ornament-left">⬥</span>
        <span class="ornament-line"></span>
        <span class="ornament-right">⬥</span>
      </div>
    </div>

    <!-- 仙人掌装饰 -->
    <div class="cactus cactus-left">🌵</div>
    <div class="cactus cactus-right">🌵</div>
  </div>
</template>

<style scoped>
/* ===== 沙漠背景 ===== */
.wildwest-error {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(180deg, #3d2b1f 0%, #5c3d2e 30%, #8b6914 60%, #c4a35a 80%, #d4b96a 100%);
}

.desert-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 80%, rgba(196, 163, 90, 0.4), transparent 60%),
    radial-gradient(ellipse at 20% 60%, rgba(139, 105, 20, 0.3), transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(139, 105, 20, 0.2), transparent 50%);
}

/* ===== 飘尘粒子 ===== */
.dust-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.dust {
  position: absolute;
  bottom: 20%;
  left: var(--x);
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  background: rgba(212, 185, 106, 0.4);
  animation: dustFloat var(--duration) var(--delay) infinite ease-out;
}

@keyframes dustFloat {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }

  20% {
    opacity: 0.6;
  }

  100% {
    transform: translate(calc(var(--size) * 10), -200px) scale(0.3);
    opacity: 0;
  }
}

/* ===== 通缉令 ===== */
.wanted-poster {
  position: relative;
  z-index: 10;
  width: min(480px, 90vw);
  padding: 2.5rem 2rem;
  background: linear-gradient(135deg, #e8d5a3 0%, #d4bc7c 50%, #c4a35a 100%);
  border: 3px solid #5c3d2e;
  box-shadow:
    0 0 0 1px #8b6914,
    0 0 0 4px #5c3d2e,
    0 8px 32px rgba(0, 0, 0, 0.5),
    inset 0 0 60px rgba(92, 61, 46, 0.15);
  text-align: center;
  transform: rotate(-1deg);
  transition: transform 0.3s;
}

.wanted-poster:hover {
  transform: rotate(0deg) scale(1.02);
}

/* 做旧纹理覆盖 */
.wanted-poster::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg,
      transparent, transparent 2px,
      rgba(92, 61, 46, 0.03) 2px,
      rgba(92, 61, 46, 0.03) 4px);
  pointer-events: none;
}

/* 烧焦边角 */
.wanted-poster::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at top left, rgba(40, 20, 10, 0.3) 0%, transparent 30%),
    radial-gradient(ellipse at bottom right, rgba(40, 20, 10, 0.25) 0%, transparent 25%);
  pointer-events: none;
}

/* ===== 装饰线 ===== */
.poster-border-top,
.poster-border-bottom {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #5c3d2e;
  font-size: 0.8rem;
}

.ornament-line {
  flex: 1;
  height: 2px;
  background: repeating-linear-gradient(90deg,
      #5c3d2e 0px, #5c3d2e 6px,
      transparent 6px, transparent 10px);
}

/* ===== WANTED 标题 ===== */
.wanted-header {
  margin: 1.5rem 0 1rem;
}

.wanted-eyebrow {
  margin: 0;
  font-family: 'Cimero', serif;
  font-size: 1.1rem;
  letter-spacing: 0.4em;
  color: #5c3d2e;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.1);
}

.wanted-code {
  margin: 0.5rem 0 0;
  font-family: 'Miltonian-Tattoo', 'Miltonian', serif;
  font-size: 6rem;
  line-height: 1;
  color: #7b1e1e;
  text-shadow: 2px 2px 0 #5c3d2e, 4px 4px 0 rgba(0, 0, 0, 0.15);
  letter-spacing: 0.05em;
}

/* ===== 分隔线 ===== */
.wanted-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1rem 0;
  color: #5c3d2e;
  font-size: 1.2rem;
}

.wanted-divider::before,
.wanted-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #5c3d2e, transparent);
}

.divider-star {
  padding: 0 1rem;
}

/* ===== 正文 ===== */
.wanted-body {
  margin: 1rem 0;
}

.wanted-title {
  margin: 0;
  font-family: 'Cimero', serif;
  font-size: 1.8rem;
  letter-spacing: 0.15em;
  color: #3d2b1f;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.08);
}

.wanted-desc {
  margin: 0.8rem 0 0;
  font-family: 'QingKongMingChao', 'NotoSansSC', serif;
  font-size: 0.95rem;
  line-height: 1.8;
  color: #5c3d2e;
}

/* ===== 悬赏金额 ===== */
.wanted-reward {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  margin: 1.2rem 0;
  padding: 0.5rem 1rem;
  border: 2px solid #5c3d2e;
  border-radius: 4px;
  background: rgba(92, 61, 46, 0.08);
}

.reward-label {
  font-family: 'Cimero', serif;
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  color: #5c3d2e;
}

.reward-amount {
  font-family: 'Miltonian-Tattoo', serif;
  font-size: 1.4rem;
  color: #7b1e1e;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.1);
}

/* ===== 按钮 ===== */
.wanted-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.btn-western {
  padding: 0.7rem 1.5rem;
  border: 2px solid #5c3d2e;
  font-family: 'Cimero', serif;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.25s;
}

.btn-primary-western {
  background: #5c3d2e;
  color: #e8d5a3;
  box-shadow: 0 2px 8px rgba(92, 61, 46, 0.4);
}

.btn-primary-western:hover {
  background: #7b1e1e;
  border-color: #7b1e1e;
  box-shadow: 0 4px 16px rgba(123, 30, 30, 0.5);
  transform: translateY(-2px);
}

.btn-ghost-western {
  background: transparent;
  color: #5c3d2e;
}

.btn-ghost-western:hover {
  background: rgba(92, 61, 46, 0.1);
  transform: translateY(-1px);
}

/* ===== 仙人掌 ===== */
.cactus {
  position: absolute;
  bottom: 10%;
  font-size: 3rem;
  opacity: 0.5;
  z-index: 5;
  animation: cactusSway 4s ease-in-out infinite;
}

.cactus-left {
  left: 5%;
  animation-delay: 0s;
}

.cactus-right {
  right: 5%;
  animation-delay: 2s;
  transform: scaleX(-1);
}

@keyframes cactusSway {

  0%,
  100% {
    transform: rotate(-2deg);
  }

  50% {
    transform: rotate(2deg);
  }
}

.cactus-right {
  animation-name: cactusSwayRight;
}

@keyframes cactusSwayRight {

  0%,
  100% {
    transform: scaleX(-1) rotate(-2deg);
  }

  50% {
    transform: scaleX(-1) rotate(2deg);
  }
}

/* ===== 响应式 ===== */
@media (max-width: 512px) {
  .wanted-code {
    font-size: 4rem;
  }

  .wanted-title {
    font-size: 1.3rem;
  }

  .wanted-actions {
    flex-direction: column;
  }

  .cactus {
    display: none;
  }
}
</style>
