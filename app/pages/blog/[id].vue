<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import type { BlogPost } from "~/stores/site";

const route = useRoute();
const siteStore = useSiteStore();
const { blog } = storeToRefs(siteStore);

const fallbackPost = computed<BlogPost>(() => ({
  id: 0,
  title: blog.value.emptyTitle,
  date: "",
  excerpt: "",
  content: blog.value.emptyContent,
  readTime: "",
  tags: [],
}));

const postId = computed(() => Number(route.params.id));
const post = computed(() => siteStore.getBlogPostById(postId.value) ?? fallbackPost.value);

useSeoMeta({
  title: () => post.value.title,
  description: () => post.value.excerpt || blog.value.articleFallbackDescription,
});

// 加载博客文章数据
onMounted(() => {
  siteStore.loadBlogPosts();
});
</script>

<template>
  <div class="blog-detail-wrapper">
    <!-- 左侧装饰挂件 -->
    <div class="blog-sidebar blog-sidebar-left hidden lg:block">
      <div class="sticky top-32 space-y-6">
        <!-- 复古胶片卷轴装饰 -->
        <div class="film-reel-ornament">
          <div class="film-reel-inner"></div>
        </div>
        <!-- 复古邮票装饰 -->
        <div class="vintage-stamp">
          <span>APPROVED</span>
        </div>
        <!-- 老电影票根 -->
        <div class="ticket-stub">
          <div class="ticket-stub-title">ADMIT ONE</div>
          <div class="ticket-stub-seat">SEAT A-01</div>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="blog-detail-content">
      <!-- Hero 区域 - 胶片框 -->
      <section class="film-frame overflow-hidden">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div class="space-y-3">
            <p class="film-label">{{ blog.articleLabel }}</p>
            <h1 class="text-3xl md:text-4xl blog-detail-title">{{ post.title }}</h1>
            <p class="text-sm blog-detail-meta">
              {{ post.date || blog.unavailableDate }} · {{ post.readTime }}
            </p>
            <!-- 文章标签 -->
            <div class="flex flex-wrap gap-2 pt-2" v-if="post.tags?.length">
              <span v-for="tag in post.tags" :key="tag" class="film-tag">
                {{ tag }}
              </span>
            </div>
          </div>

          <span class="ticket-stamp">{{ blog.articleStamp }}</span>
        </div>
      </section>

      <!-- 文章内容区域 - 纸张面板 -->
      <section class="paper-panel mt-8">
        <article class="prose prose-film max-w-none">
          <div v-html="post.content" />
        </article>
      </section>

      <!-- 返回博客按钮 -->
      <div class="mt-8 flex justify-center">
        <NuxtLink to="/blog" class="ticket-button ticket-button-secondary">
          {{ blog.backLabel }}
        </NuxtLink>
      </div>
    </div>

    <!-- 右侧装饰挂件 -->
    <div class="blog-sidebar blog-sidebar-right hidden lg:block">
      <div class="sticky top-32 space-y-6">
        <!-- 复古电影场记板 -->
        <div class="clapperboard-ornament">
          <div class="clapperboard-top"></div>
          <div class="clapperboard-bottom">
            <span>SCENE</span>
            <span>TAKE</span>
            <span>ROLL</span>
          </div>
        </div>
        <!-- 胶片孔装饰条 -->
        <div class="film-perforations-vertical"></div>
        <!-- 复古便签 -->
        <div class="vintage-note">
          <p>NOTES</p>
          <p>Keep reading</p>
        </div>
      </div>
    </div>
  </div>
</template>
