<script setup lang="ts">
/**
 * 博客详情页 (blog/[slug].vue)
 *
 * 耦合关系：
 *   - stores/site.ts                    → 读取 blog 配置
 *   - server/api/blog/[slug].get.ts     → 通过 API 获取单篇文章
 */

import { computed, ref } from "vue";
import { storeToRefs } from "pinia";

const route = useRoute();
const siteStore = useSiteStore();
const { blog } = storeToRefs(siteStore);

const introCardOpen = ref(false);

const slug = computed(() => route.params.slug as string);

// 直接请求单篇 API，拿到完整 Content 文档
const { data: post } = await useFetch<any>(`/api/blog/${slug.value}`, {
  key: `blog-post-${slug.value}`,
});

const postTitle = computed(() => post.value?.title || blog.value.emptyTitle);
const postExcerpt = computed(() => post.value?.excerpt || blog.value.articleFallbackDescription);
const postTags = computed(() => post.value?.tags || []);
const postDate = computed(() => post.value?.date || '');

const introSummary = computed(() => postExcerpt.value);

// 去掉正文中的 h1 标题（页面已有标题展示）
const displayBody = computed(() => {
  if (!post.value) return null;
  const clone = JSON.parse(JSON.stringify(post.value));
  const nodes = clone.body?.value;
  if (Array.isArray(nodes) && Array.isArray(nodes[0]) && nodes[0][0] === 'h1') {
    clone.body.value = nodes.slice(1);
  }
  return clone;
});

useSeoMeta({
  title: () => postTitle.value,
  description: () => postExcerpt.value,
});
</script>

<template>
  <div class="article-view">
    <div class="article-view-rail hidden lg:block">
      <div class="film-perforations article-view-perforations"></div>
    </div>

    <div class="article-view-main">
      <section class="article-shell">
        <div class="article-shell-body">
          <section class="article-intro-card" :class="{ 'article-intro-card-open': introCardOpen }">
            <header class="article-intro-head">
              <div>
                <p class="article-intro-kicker">{{ blog.articleEyebrow }}</p>
                <h3 class="article-intro-title">{{ postTitle }}</h3>
              </div>

              <button type="button" class="article-intro-toggle" @click="introCardOpen = !introCardOpen">
                <svg class="toggle-arrow-icon" :class="{ 'toggle-arrow-rotated': introCardOpen }" fill="none"
                  stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </header>

            <transition name="article-card-fade">
              <div v-if="introCardOpen" class="article-intro-body">
                <p class="article-intro-summary">{{ introSummary }}</p>

                <div v-if="postTags.length" class="article-intro-tags">
                  <span v-for="tag in postTags" :key="tag" class="meta-tag article-meta-tag">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </transition>
          </section>

          <!-- 使用 ContentRenderer 渲染 Markdown 正文 -->
          <article class="article-reading-card">
            <ContentRenderer v-if="displayBody" :value="displayBody"
              class="article-reading-content prose prose-film max-w-none" />
            <div v-else class="article-reading-content prose prose-film max-w-none">
              <p>{{ blog.emptyContent }}</p>
            </div>
          </article>
        </div>
      </section>
    </div>

    <div class="article-view-rail hidden lg:block">
      <div class="film-perforations article-view-perforations"></div>
    </div>
  </div>
</template>
