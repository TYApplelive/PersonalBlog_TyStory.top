<script setup lang="ts">
/**
 * 联系图标组件
 * 
 * 显示社交媒体联系方式 (GitHub, QQ, 微信)
 * 支持悬停效果，点击可跳转或显示信息
 */
import { storeToRefs } from "pinia";
import type { ContactKey } from "~/stores/site";

// 定义组件 props
const props = withDefaults(defineProps<{
  compact?: boolean;    // 是否使用紧凑模式
  title?: string;       // 标题文本
}>(), {
  compact: false,
  title: "Contacts",
});

// 获取站点 store
const siteStore = useSiteStore();
// 使用 storeToRefs 保持响应性
const { contactOrder, contacts, getHoveredContact, getHoveredContactItem } = storeToRefs(siteStore);

/**
 * 鼠标进入处理 - 设置当前悬停的联系方式
 */
const handleEnter = (key: ContactKey) => {
  siteStore.setHoveredContact(key);
};

/**
 * 鼠标离开处理 - 清除悬停状态
 */
const handleLeave = () => {
  siteStore.setHoveredContact(null);
};
</script>

<!-- 模板部分：显示联系方式图标列表 -->
<template>
  <div class="space-y-4">
    <!-- 标题标签 -->
    <p class="film-label">{{ title }}</p>

    <!-- 联系方式图标容器 -->
    <div class="contact-icons-shell" @mouseleave="handleLeave">
      <!-- 图标列表 -->
      <div class="flex items-center gap-3">
        <!-- 遍历 contactOrder 数组，按顺序显示各联系方式 -->
        <component :is="contacts[key].href ? 'a' : 'button'" v-for="key in contactOrder" :key="key"
          :href="contacts[key].href" :target="contacts[key].href ? '_blank' : undefined"
          :rel="contacts[key].href ? 'noreferrer' : undefined" :type="contacts[key].href ? undefined : 'button'"
          class="contact-icon-button" :class="{ 'contact-icon-active': getHoveredContact === key }"
          @mouseenter="handleEnter(key)" @focus="handleEnter(key)" @blur="handleLeave">
          <!-- GitHub 图标 -->
          <svg v-if="key === 'github'" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.57 0-.28-.01-1.03-.02-2.03-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.1-.75.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.08 1.85 2.84 1.31 3.53 1 .11-.78.42-1.31.76-1.61-2.67-.31-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.31-.54-1.56.12-3.25 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0112 6.8c1.02 0 2.05.14 3.01.41 2.29-1.55 3.29-1.23 3.29-1.23.66 1.69.25 2.94.12 3.25.77.84 1.23 1.92 1.23 3.23 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .31.21.68.83.57C20.57 21.79 24 17.31 24 12 24 5.37 18.63 0 12 0z" />
          </svg>

          <!-- QQ 图标 -->
          <svg v-else-if="key === 'qq'" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M12 2c-4.4 0-7.5 3.3-7.5 7.9 0 2.3.7 4.4 1.9 5.9-.4.7-1 1.5-1.7 2.2-.3.3-.2.8.2.9 1.3.1 2.7-.3 3.8-.9.9.4 2 .6 3.3.6s2.4-.2 3.3-.6c1.1.6 2.5 1 3.8.9.4-.1.5-.6.2-.9-.7-.7-1.3-1.5-1.7-2.2 1.2-1.5 1.9-3.6 1.9-5.9C19.5 5.3 16.4 2 12 2zm-3 7.2a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zm6 0a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zM12 16c-1.5 0-2.8-.5-3.8-1.4-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 .8.7 1.9 1.1 3.1 1.1s2.3-.4 3.1-1.1c.2-.2.5-.2.7 0 .2.2.2.5 0 .7-1 .9-2.3 1.4-3.8 1.4z" />
          </svg>

          <!-- 微信图标 (默认) -->
          <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M8.69 11.7c0 1.33-.96 2.41-2.15 2.41s-2.15-1.08-2.15-2.41c0-1.33.96-2.41 2.15-2.41s2.15 1.08 2.15 2.41zm8.77-2.53c-1.19 0-2.15 1.08-2.15 2.41 0 1.33.96 2.41 2.15 2.41s2.15-1.08 2.15-2.41c0-1.33-.96-2.41-2.15-2.41zM12.02 5C7.26 5 3.4 8.27 3.4 12.3c0 2.16 1.1 4.11 2.85 5.45l-.74 2.41c-.08.27.18.51.44.4l3.13-1.35c.94.24 1.92.36 2.94.36 4.76 0 8.62-3.27 8.62-7.3S16.78 5 12.02 5zm0 12.11c-.94 0-1.83-.12-2.66-.35l-.19-.05-1.89.81.46-1.5-.17-.13c-1.51-1.14-2.37-2.72-2.37-4.39 0-3.08 3.06-5.59 6.82-5.59s6.82 2.51 6.82 5.59-3.06 5.61-6.82 5.61z" />
          </svg>
        </component>
      </div>

      <!-- 悬停提示框 - 显示联系方式详情 -->
      <transition name="contact-fade">
        <div v-if="getHoveredContactItem" class="contact-tooltip" :class="{ 'contact-tooltip-compact': compact }">
          <span class="contact-tooltip-label">{{ getHoveredContactItem.label }}</span>
          <span class="contact-tooltip-value">{{ getHoveredContactItem.value }}</span>
        </div>
      </transition>
    </div>
  </div>
</template>
