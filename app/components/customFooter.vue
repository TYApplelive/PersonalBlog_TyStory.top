<script setup lang="ts">
/**
 * 页脚组件 (customFooter.vue)
 *
 * 耦合关系：
 *   - stores/site.ts            → 读取 brand / footer
 *   - components/contactIcons.vue → 联系方式图标
 *
 * 函数表：
 *   无自定义函数
 */

import { storeToRefs } from "pinia";

const siteStore = useSiteStore();
const { brand, footer } = storeToRefs(siteStore);
const year = new Date().getFullYear();
</script>

<template>
  <footer class="film-frame mt-10 px-6 py-6 md:px-8">
    <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div class="space-y-3">
        <p class="film-label">{{ footer.label }}</p>
        <div>
          <h2 class="text-2xl text-(--film-paper)">{{ brand.title }}</h2>
          <p class="max-w-2xl text-sm leading-7 text-(--film-muted-light)">
            {{ footer.description }}
          </p>
        </div>
      </div>

      <div class="min-w-60">
        <contactIcons :title="footer.contactLabel" />
      </div>
    </div>

    <div class="story-divider my-5" />

    <div
      class="flex flex-col gap-3 text-xs uppercase tracking-[0.28em] text-(--film-muted) md:flex-row md:items-center md:justify-between">
      <p>{{ year }} {{ brand.title }}</p>
      <p>{{ footer.ending }} {{ brand.owner }}</p>
    </div>
  </footer>
</template>
