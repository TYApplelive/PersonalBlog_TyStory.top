<script setup lang="ts">
/**
 * 应用根组件 (app.vue)
 *
 * 耦合关系：
 *   - 无外部依赖，仅配置全局 HTML 属性和图标
 */
useHead({
  htmlAttrs: { lang: "zh-CN" },
  link: [{ rel: "icon", type: "image/png", href: "/icon.png" }],
});

if (import.meta.client) {
  useScrollReveal();
}
</script>

<template>
  <NuxtLoadingIndicator color="#b78c4d" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
