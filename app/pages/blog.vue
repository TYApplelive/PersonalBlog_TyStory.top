<template>
  <div class="blog">
    <h1 class="text-3xl font-bold mb-6">博客文章</h1>
    <div class="space-y-6">
      <div v-for="post in posts" :key="post.id" class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold mb-2">
          <NuxtLink :to="`/blog/${post.id}`">{{ post.title }}</NuxtLink>
        </h2>
        <p class="text-gray-500 mb-4">{{ post.date }}</p>
        <p class="mb-4">{{ post.excerpt }}</p>
        <NuxtLink :to="`/blog/${post.id}`" class="text-blue-600 hover:text-blue-800">
          阅读更多 →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
// 模拟博客数据
const posts = [
  {
    id: 1,
    title: "Nuxt 4 入门指南",
    date: "2026-04-15",
    excerpt: "Nuxt 4 是一个强大的前端框架，本文将介绍如何快速上手 Nuxt 4 并构建现代化的 web 应用。"
  },
  {
    id: 2,
    title: "Vue 3 Composition API 最佳实践",
    date: "2026-04-10",
    excerpt: "Vue 3 的 Composition API 提供了更灵活的代码组织方式，本文将分享一些最佳实践和使用技巧。"
  },
  {
    id: 3,
    title: "前端性能优化技巧",
    date: "2026-04-05",
    excerpt: "前端性能优化是提升用户体验的关键，本文将介绍一些实用的性能优化技巧。"
  }
];
</script>