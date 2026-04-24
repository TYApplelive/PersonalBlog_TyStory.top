<script setup lang="ts">
/**
 * 首页 (index.vue)
 * 
 * 展示个人博客的主页内容，包括：
 * - 个人品牌信息（头像、名称、别名）
 * - 主页标题和副标题
 * - 技能标签（badges）
 * - 行动号召按钮（CTA）
 * - 海报卡片区域
 * - 游戏人生抽屉组件
 * - 技术技能展示区
 */

// 从 Pinia 状态管理中获取响应式数据
import { storeToRefs } from "pinia";

// 初始化站点状态管理
const siteStore = useSiteStore();

// 解构需要使用的状态数据
// brand: 品牌信息（所有者、别名等）
// home: 首页相关配置数据
// stack: 技术栈信息
// isGameDrawerOpen: 游戏抽屉是否打开
const { brand, home, stack, isGameDrawerOpen } = storeToRefs(siteStore);

/**
 * SEO 元数据配置
 * 用于搜索引擎优化，设置页面标题和描述
 * 使用函数形式以便响应式获取最新数据
 */
useSeoMeta({
  title: () => home.value.seoTitle,      // SEO 标题
  description: () => home.value.intro,   // SEO 描述（使用简介内容）
});
</script>

<template>
  <!-- 主容器：垂直间距 -->
  <div class="space-y-8">

    <!-- 
      第一部分：电影胶片框架样式的主内容区
      采用双列布局：大屏下左侧 1.35fr，右侧 0.85fr
    -->
    <section class="film-frame overflow-hidden">
      <div class="grid gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-center">

        <!-- 左侧：主要信息区域 -->
        <div class="space-y-6">
          <!-- 标签文字（如"INTRO"） -->
          <p class="film-label">{{ home.kicker }}</p>

          <!-- 详细信息块 -->
          <div class="space-y-4">
            <!-- 品牌标签：所有者 / 别名 -->
            <p class="text-xs uppercase tracking-[0.45em] md:text-sm brand-label">
              {{ brand.owner }} / {{ brand.alias }}
            </p>

            <!-- 主标题（大字展示） -->
            <h1 class="hero-title">{{ home.title }}</h1>

            <!-- 副标题 -->
            <p class="max-w-3xl text-xl leading-8 md:text-2xl home-subtitle">
              {{ home.subtitle }}
            </p>

            <!-- 简介内容 -->
            <p class="max-w-2xl text-base leading-8 md:text-lg home-intro">
              {{ home.intro }}
            </p>
          </div>

          <!-- 技能/标签展示区 -->
          <div class="flex flex-wrap gap-3">
            <span v-for="badge in home.badges" :key="badge" class="contact-chip">
              {{ badge }}
            </span>
          </div>

          <!-- 行动号召按钮区域 -->
          <div class="flex flex-wrap gap-4 pt-2">
            <!-- 
              遍历 CTA 按钮配置
              variant 决定按钮样式：primary 为主按钮，secondary 为次按钮
            -->
            <NuxtLink v-for="action in home.ctas" :key="action.to" :to="action.to" class="ticket-button"
              :class="action.variant === 'primary' ? 'ticket-button-primary' : 'ticket-button-secondary'">
              {{ action.label }}
            </NuxtLink>
          </div>
        </div>

        <!-- 右侧：海报卡片区域 -->
        <aside class="poster-card">
          <!-- 海报标签 -->
          <p class="text-xs uppercase tracking-[0.35em] poster-label">
            {{ home.poster.label }}
          </p>

          <!-- 海报内容 -->
          <div class="mt-5 space-y-4">
            <!-- 标题区域 -->
            <div>
              <p class="text-sm uppercase tracking-[0.3em] poster-title-label">
                {{ home.poster.titleLabel }}
              </p>
              <h2 class="mt-2 text-3xl leading-tight poster-title">
                {{ home.poster.title }}
              </h2>
            </div>

            <!-- 正文内容 -->
            <p class="text-sm leading-7 poster-body">
              {{ home.poster.body }}
            </p>

            <!-- 分割线 -->
            <div class="story-divider" />

            <!-- 备注列表 -->
            <ul class="space-y-3 text-sm leading-7 poster-notes">
              <li v-for="note in home.notes" :key="note">{{ note }}</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>

    <!-- 
      第二部分：底部网格区域
      包含两个组件：
      - gameLifeDrawer: 游戏人生抽屉（可展开的游戏记录）
      - techReelSection: 技术技能展示区
      show-cards 属性控制技术卡片是否显示（仅在抽屉打开时显示）
    -->
    <section class="home-bottom-grid">
      <gameLifeDrawer />
      <techReelSection :show-cards="isGameDrawerOpen" />
    </section>
  </div>
</template>
