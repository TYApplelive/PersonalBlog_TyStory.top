<script setup lang="ts">
/**
 * 默认布局 (default.vue)
 *
 * 耦合关系：
 *   - stores/site.ts             → 读取 nav 导航菜单
 *   - components/customLogo.vue  → 站点 Logo
 *   - components/customFooter.vue → 页脚
 *
 * 函数表：
 *   - isActive(to)      → 判断路由是否匹配当前路径
 *   - navLinkClass(to)  → 根据路由匹配返回导航链接样式类
 */

import { storeToRefs } from "pinia";

const route = useRoute();
const siteStore = useSiteStore();
const { nav } = storeToRefs(siteStore);
const { loggedIn, user } = useUserSession();

const isAdmin = computed(() => user.value?.role === "admin");

const isActive = (to: string) => {
  if (to === "/") return route.path === "/";
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
        <div class="film-frame nav-film-frame px-5 py-4 md:px-7">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <customLogo />

            <nav class="flex flex-wrap items-center gap-2 md:justify-end">
              <NuxtLink v-for="item in nav" :key="item.to" :to="item.to" :class="navLinkClass(item.to)">
                {{ item.label }}
              </NuxtLink>
              <NuxtLink v-if="isAdmin" to="/admin" :class="navLinkClass('/admin')">
                管理
              </NuxtLink>
              <NuxtLink v-if="!loggedIn" to="/login" class="nav-link">登录</NuxtLink>
              <userMenu v-else />
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
