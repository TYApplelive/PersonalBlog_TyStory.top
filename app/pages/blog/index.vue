<script setup lang="ts">
/**
 * 博客列表页 (blog/index.vue)
 *
 * 耦合关系：
 *   - stores/site.ts              → useSiteStore 读取 blog 配置
 *   - server/api/blog/posts.get.ts → useFetch 调用 GET /api/blog/posts
 *   - app/pages/blog/[slug].vue   → 列表中的文章链接跳转目标
 */

import { storeToRefs } from "pinia";
import type { BlogPost } from "#shared/types/site";

const siteStore = useSiteStore();
const { blog } = storeToRefs(siteStore);

// 非阻塞加载文章列表
const { data: posts, pending } = useLazyFetch<BlogPost[]>("/api/blog/posts", {
  default: () => [],
})

const articlePath = (path: string) => encodeURI(path);

useSeoMeta({
  title: () => blog.value.seoTitle,
  description: () => blog.value.listLead,
});
</script>

<template>
  <div class="blog-list-wrapper">
    <!-- 左侧装饰栏 -->
    <div class="blog-list-sidebar hidden lg:block">
      <div class="sticky top-48 space-y-6">
        <div class="film-reel-ornament-small auto-animate"></div>
        <div class="vintage-stamp-small auto-animate">
          <span>LIST</span>
        </div>
        <div class="typewriter-paper-small auto-animate">
          <div class="typewriter-text">
            <p>TYPE</p>
            <p>DRAFT</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 文章列表主体 -->
    <div class="blog-list-content">
      <section class="film-frame">
        <p class="film-label">{{ blog.listLabel }}</p>
        <h1 class="mt-4 text-3xl md:text-4xl lg:text-5xl blog-title">{{ blog.listTitle }}</h1>
        <p class="mt-4 max-w-3xl text-sm leading-7 md:text-base md:leading-8 blog-lead">
          {{ blog.listLead }}
        </p>
      </section>

      <section class="mt-6 grid gap-4 md:gap-5">
        <!-- 加载骨架屏 -->
        <div v-if="pending" class="space-y-4">
          <div v-for="i in 3" :key="i" class="paper-panel animate-pulse">
            <div class="h-3 w-20 rounded bg-[var(--film-gold)] opacity-20"></div>
            <div class="mt-3 h-6 w-3/4 rounded bg-[var(--film-gold)] opacity-15"></div>
            <div class="mt-3 h-4 w-full rounded bg-[var(--film-paper)] opacity-10"></div>
            <div class="mt-2 h-4 w-2/3 rounded bg-[var(--film-paper)] opacity-10"></div>
          </div>
        </div>

        <!-- 文章列表 -->
        <template v-else>
          <article v-for="post in posts" :key="post.path" class="paper-panel">
            <p class="text-xs uppercase tracking-[0.3em] blog-date">{{ post.date }}</p>

            <h2 class="mt-3 text-xl md:text-2xl blog-post-title">
              <NuxtLink :to="articlePath(post.path)" class="blog-title-link">
                {{ post.title }}
              </NuxtLink>
            </h2>

            <p class="mt-3 text-sm leading-7 blog-excerpt">
              {{ post.description }}
            </p>

            <div v-if="post.tags?.length" class="mt-4 flex flex-wrap gap-2">
              <span v-for="tag in post.tags" :key="tag" class="film-tag-small">
                {{ tag }}
              </span>
            </div>

            <div class="mt-5">
              <NuxtLink :to="articlePath(post.path)" class="ticket-button ticket-button-secondary">
                {{ blog.readLabel }}
              </NuxtLink>
            </div>
          </article>
        </template>
      </section>
    </div>

    <!-- 右侧装饰栏 -->
    <div class="blog-list-sidebar hidden lg:block">
      <div class="sticky top-48 space-y-6">
        <div class="film-perforations-vertical-small auto-animate"></div>
        <div class="vintage-note-small auto-animate">
          <p>SELECT</p>
          <p>Read more</p>
        </div>
        <div class="film-strip-small auto-animate"></div>
      </div>
    </div>
  </div>
</template>
