<template>
  <div class="blog-post">
    <h1 class="text-3xl font-bold mb-4">{{ post.title }}</h1>
    <p class="text-gray-500 mb-6">{{ post.date }}</p>
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div v-html="post.content"></div>
    </div>
    <div class="mt-8">
      <NuxtLink to="/blog" class="text-blue-600 hover:text-blue-800">
        ← 返回博客列表
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
const postId = parseInt(route.params.id);

// 模拟博客数据
const posts = [
  {
    id: 1,
    title: "Nuxt 4 入门指南",
    date: "2026-04-15",
    content: `<p>Nuxt 4 是一个基于 Vue 3 的前端框架，它提供了许多强大的功能，使开发变得更加简单和高效。</p>
    <p>在本文中，我们将学习如何：</p>
    <ul>
      <li>初始化一个 Nuxt 4 项目</li>
      <li>配置项目设置</li>
      <li>创建页面和组件</li>
      <li>使用 Nuxt 的内置功能</li>
    </ul>
    <p>Nuxt 4 提供了自动路由、服务端渲染、静态站点生成等功能，这些功能可以帮助我们构建更好的 web 应用。</p>`
  },
  {
    id: 2,
    title: "Vue 3 Composition API 最佳实践",
    date: "2026-04-10",
    content: `<p>Vue 3 的 Composition API 是一个重大的更新，它提供了更灵活的代码组织方式。</p>
    <p>一些最佳实践包括：</p>
    <ul>
      <li>按功能组织代码</li>
      <li>使用 ref 和 reactive 管理状态</li>
      <li>使用 computed 和 watch 处理响应式数据</li>
      <li>使用 provide 和 inject 共享状态</li>
    </ul>
    <p>Composition API 使代码更加可维护和可测试，特别是对于大型应用。</p>`
  },
  {
    id: 3,
    title: "前端性能优化技巧",
    date: "2026-04-05",
    content: `<p>前端性能优化是提升用户体验的关键。以下是一些实用的优化技巧：</p>
    <ul>
      <li>减少 HTTP 请求</li>
      <li>使用 CDN 加速</li>
      <li>压缩资源文件</li>
      <li>使用懒加载</li>
      <li>优化图片</li>
      <li>使用缓存策略</li>
    </ul>
    <p>通过这些优化，可以显著提升页面加载速度和用户体验。</p>`
  }
];

// 查找当前文章
const post = posts.find(p => p.id === postId) || {
  title: "文章不存在",
  date: "",
  content: "抱歉，您请求的文章不存在。"
};
</script>