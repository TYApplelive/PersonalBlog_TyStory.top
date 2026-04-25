<script setup lang="ts">
/**
 * 灵感侧边栏组件 (inspirationSidebar.vue)
 *
 * 耦合关系：
 *   - stores/site.ts → InspirationItem 类型
 *
 * 应用方式：
 *   <inspirationSidebar :inspirations="about.inspirations" :title="about.inspirationLabel" />
 *
 * 函数表：
 *   - getTypeIcon(type): 根据灵感类型返回对应图标字符
 */

import type { InspirationItem } from "#shared/types/site";

defineProps<{
  inspirations: InspirationItem[];
  title?: string;
}>();

const getTypeIcon = (type: string) => {
  switch (type) {
    case "movie": return "◐";
    case "music": return "♫";
    case "book": return "▤";
    case "quote": return "※";
    default: return "•";
  }
};
</script>

<template>
  <div class="inspiration-sidebar">
    <p class="film-label">{{ title || "Inspiration" }}</p>
    <div class="mt-4 space-y-3">
      <div v-for="item in inspirations" :key="item.id" class="inspiration-item">
        <div class="flex items-start gap-2">
          <span class="inspiration-icon text-lg">{{ getTypeIcon(item.type) }}</span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold text-(--film-ink)">{{ item.title }}</p>
              <span v-if="item.year" class="text-xs text-(--film-muted)">{{ item.year }}</span>
            </div>
            <p v-if="item.subtitle" class="text-xs text-(--film-muted)">{{ item.subtitle }}</p>
            <p class="mt-1 text-xs leading-6 text-(--film-muted)">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.inspiration-sidebar {
  height: 100%;
}

.inspiration-item {
  padding: 0.75rem;
  background: rgba(255, 248, 235, 0.5);
  border-radius: 6px;
  border: 1px solid rgba(92, 58, 32, 0.1);
  transition: all 0.3s ease;
  cursor: default;
}

.inspiration-item:hover {
  background: rgba(255, 248, 235, 0.8);
  border-color: rgba(92, 58, 32, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.inspiration-icon {
  opacity: 0.8;
  line-height: 1;
}
</style>
