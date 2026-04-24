<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import type { BlogContentPost } from "~/utils/blog-content";

const route = useRoute();
const siteStore = useSiteStore();
const { blog } = storeToRefs(siteStore);

const introCardOpen = ref(false);

const postId = computed(() => Number(route.params.id));

// 同时返回 Nuxt Content 文档（供 ContentRenderer）和 API 元数据（供 excerpt/title 等）
const { data: postBundle } = await useAsyncData<{ doc: any; apiMeta: BlogContentPost } | null>(
  `blog-post-${postId.value}`,
  async () => {
    const meta = await $fetch<BlogContentPost | null>(`/api/blog/${postId.value}`);
    if (!meta?.stem) return null;
    const allDocs = await queryCollection('blog').all();
    const doc = (allDocs as any[]).find((d: any) => d.stem === meta.stem);
    if (!doc) return null;
    return { doc, apiMeta: meta };
  },
);

const post = computed(() => postBundle.value?.doc || null);
const postApiMeta = computed(() => postBundle.value?.apiMeta || null);

const postTitle = computed(() => post.value?.title || blog.value.emptyTitle);
// excerpt 来自 API 正确解析的 frontmatter，而非 Nuxt Content 自动生成的 description
const postExcerpt = computed(() => postApiMeta.value?.excerpt || blog.value.articleFallbackDescription);
const postTags = computed(() => post.value?.meta?.tags || []);
const postDate = computed(() => post.value?.meta?.date || '');

const introSummary = computed(() => postExcerpt.value);

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
