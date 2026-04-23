<script setup lang="ts">
import { storeToRefs } from "pinia";
import type { InspirationItem } from "~/stores/site";

const props = defineProps<{
  inspirations: InspirationItem[];
  title?: string;
}>();

const getTypeIcon = (type: string) => {
  switch (type) {
    case "movie":
      return "🎬";
    case "music":
      return "🎵";
    case "book":
      return "📖";
    case "quote":
      return "💭";
    default:
      return "✨";
  }
};
</script>

<template>
  <div class="inspiration-sidebar">
    <p class="film-label">{{ title || "Inspiration" }}</p>
    <div class="space-y-3 mt-4">
      <div
        v-for="item in inspirations"
        :key="item.id"
        class="inspiration-item"
      >
        <div class="flex items-start gap-2">
          <span class="inspiration-icon text-lg">{{ getTypeIcon(item.type) }}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-semibold text-(--film-ink) text-sm">{{ item.title }}</p>
              <span v-if="item.year" class="text-xs text-(--film-muted)">{{ item.year }}</span>
            </div>
            <p v-if="item.subtitle" class="text-xs text-(--film-muted)">{{ item.subtitle }}</p>
            <p class="text-xs leading-6 text-(--film-muted) mt-1">{{ item.description }}</p>
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
