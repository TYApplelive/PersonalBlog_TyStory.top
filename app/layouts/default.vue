<script setup lang="ts">
import { storeToRefs } from "pinia";

const route = useRoute();
const siteStore = useSiteStore();
const { nav } = storeToRefs(siteStore);

// 统一处理导航高亮，避免页面里重复写路由匹配逻辑。
const isActive = (to: string) => {
  if (to === "/") {
    return route.path === "/";
  }

  return route.path === to || route.path.startsWith(`${to}/`);
};

const navLinkClass = (to: string) => {
  return isActive(to) ? "nav-link nav-link-active" : "nav-link";
};
</script>

<template>
  <div class="film-shell">
    <div class="page-wrap">
      <header class="sticky top-4 z-50">
        <div class="film-frame px-5 py-4 md:px-7">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <customLogo />

            <nav class="flex flex-wrap items-center gap-2 md:justify-end">
              <NuxtLink
                v-for="item in nav"
                :key="item.to"
                :to="item.to"
                :class="navLinkClass(item.to)"
              >
                {{ item.label }}
              </NuxtLink>
            </nav>
          </div>
        </div>
      </header>

      <main class="pt-8">
        <slot />
      </main>

      <customFooter />
    </div>
  </div>
</template>
