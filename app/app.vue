<script setup lang="ts">
useHead({
  htmlAttrs: {
    lang: "zh-CN",
  },
  link: [
    {
      rel: "icon",
      type: "image/png",
      href: "/icon.png",
    },
  ],
});
</script>

<template>
  <NuxtLoadingIndicator color="#b78c4d" />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
