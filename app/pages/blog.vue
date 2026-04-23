<script setup lang="ts">
import { storeToRefs } from "pinia";

const siteStore = useSiteStore();
const { blog, getBlogPosts } = storeToRefs(siteStore);

useSeoMeta({
  title: () => blog.value.seoTitle,
  description: () => blog.value.listLead,
});

// 加载博客文章数据
onMounted(() => {
  siteStore.loadBlogPosts();
});
</script>

<template>
  <div class="blog-list-wrapper">
    <!-- 左侧装饰 - 大屏显示 -->
    <div class="blog-list-sidebar hidden lg:block">
      <div class="sticky top-32 space-y-6">
        <div class="film-reel-ornament-small"></div>
        <div class="vintage-stamp-small">
          <span>LIST</span>
        </div>
      </div>
    </div>

    <!-- 主内容 -->
    <div class="blog-list-content">
      <section class="film-frame">
        <p class="film-label">{{ blog.listLabel }}</p>
        <h1 class="mt-4 text-3xl md:text-4xl lg:text-5xl blog-title">{{ blog.listTitle }}</h1>
        <p class="mt-4 max-w-3xl text-sm leading-7 md:text-base md:leading-8 blog-lead">
          {{ blog.listLead }}
        </p>
      </section>

      <section class="mt-6 grid gap-4 md:gap-5">
        <article
          v-for="post in getBlogPosts"
          :key="post.id"
          class="paper-panel"
        >
          <p class="text-xs uppercase tracking-[0.3em] blog-date">{{ post.date }}</p>
          <h2 class="mt-3 text-xl md:text-2xl blog-post-title">
            <NuxtLink :to="`/blog/${post.id}`" class="blog-title-link">
              {{ post.title }}
            </NuxtLink>
          </h2>
          <p class="mt-3 text-sm leading-7 blog-excerpt">
            {{ post.excerpt }}
          </p>
          <!-- 文章标签 -->
          <div class="flex flex-wrap gap-2 mt-4" v-if="post.tags?.length">
            <span v-for="tag in post.tags" :key="tag" class="film-tag-small">
              {{ tag }}
            </span>
          </div>
          <div class="mt-5">
            <NuxtLink :to="`/blog/${post.id}`" class="ticket-button ticket-button-secondary">
              {{ blog.readLabel }}
            </NuxtLink>
          </div>
        </article>
      </section>
    </div>

    <!-- 右侧装饰 - 大屏显示 -->
    <div class="blog-list-sidebar hidden lg:block">
      <div class="sticky top-32 space-y-6">
        <div class="film-perforations-vertical-small"></div>
        <div class="vintage-note-small">
          <p>SELECT</p>
          <p>Read more</p>
        </div>
      </div>
    </div>
  </div>
</template>
