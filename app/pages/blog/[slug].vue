<script setup lang="ts">
/** 博客详情页：按 slug 获取文章并渲染正文 */
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";

// 禁用默认布局，使用页面独立结构
definePageMeta({ layout: false });

const route = useRoute();
const siteStore = useSiteStore();
const { blog } = storeToRefs(siteStore);

// 折叠卡片展开状态
const introCardOpen = ref(false);
// 从路由参数提取文章 slug
const slug = computed(() => route.params.slug as string);
// 动态 API 路径，带 URL 编码处理特殊字符
const articleApiPath = computed(() => `/api/blog/${encodeURIComponent(slug.value)}`);

// 按文章 slug 缓存请求，slug 变化时自动重新获取
const { data: post, pending } = await useFetch<any>(articleApiPath, {
  key: () => `blog-post-${slug.value}`,
  watch: [slug],
});

// 文章不存在时抛出 404 错误，由 [...slug].vue 捕获
watch(
  pending,
  (isPending) => {
    if (!isPending && !post.value) {
      throw createError({ statusCode: 404, statusMessage: "文章不存在" });
    }
  },
  { immediate: true },
);

// 文章元数据
const postTitle = computed(() => post.value?.title || blog.value.emptyTitle);
const postDescription = computed(() => post.value?.description || blog.value.articleFallbackDescription);
const postTags = computed(() => post.value?.tags || []);
const introSummary = computed(() => postDescription.value);

// 处理正文：移除 Markdown 中的 h1 标题（页面已有标题展示）
const displayBody = computed(() => {
  if (!post.value) return null;
  const clone = JSON.parse(JSON.stringify(post.value));
  const nodes = clone.body?.value;
  // 检测 AST 结构中的 h1 节点并跳过
  if (Array.isArray(nodes) && Array.isArray(nodes[0]) && nodes[0][0] === "h1") {
    clone.body.value = nodes.slice(1);
  }
  return clone;
});

useSeoMeta({
  title: () => postTitle.value,
  description: () => postDescription.value,
});

// 显示滚动条（默认隐藏）
onMounted(() => {
  document.documentElement.classList.add("show-scrollbar");
});

onUnmounted(() => {
  document.documentElement.classList.remove("show-scrollbar");
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
