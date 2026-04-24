<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { getBlogPostById, type BlogContentPost } from "~/utils/blog-content";

const route = useRoute();
const siteStore = useSiteStore();
const { blog } = storeToRefs(siteStore);

const postId = computed(() => Number(route.params.id));

// 使用静态 key 避免 Nuxt 客户端导航时缓存冲突
const { data: post, refresh } = await useAsyncData<BlogContentPost | null>(
  "blog-post-detail",
  () => getBlogPostById(postId.value),
);

// 监听路由参数变化，确保切换文章时正确刷新数据
watch(postId, () => {
  refresh();
});

useSeoMeta({
  title: () => post.value?.title || blog.value.emptyTitle,
  description: () => post.value?.excerpt || blog.value.articleFallbackDescription,
});
</script>

<template>
  <div class="blog-detail-wrapper">
    <div class="blog-sidebar blog-sidebar-left hidden lg:block">
      <div class="sticky top-32 space-y-6">
        <div class="film-reel-ornament">
          <div class="film-reel-inner"></div>
        </div>
        <div class="vintage-stamp">
          <span>APPROVED</span>
        </div>
        <div class="ticket-stub">
          <div class="ticket-stub-title">ADMIT ONE</div>
          <div class="ticket-stub-seat">SEAT A-01</div>
        </div>
      </div>
    </div>

    <div class="blog-detail-content">
      <template v-if="!post">
        <section class="film-frame overflow-hidden">
          <div class="space-y-3">
            <p class="film-label">{{ blog.articleLabel }}</p>
            <h1 class="text-3xl md:text-4xl blog-detail-title">{{ blog.emptyTitle }}</h1>
            <div class="mt-8 paper-panel">
              <div class="prose prose-film max-w-none" v-html="blog.emptyContent" />
            </div>
          </div>
        </section>
      </template>

      <template v-else>
        <section class="film-frame overflow-hidden">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div class="space-y-3">
              <p class="film-label">{{ blog.articleLabel }}</p>
              <h1 class="text-3xl md:text-4xl blog-detail-title">{{ post.title }}</h1>
              <p class="text-sm blog-detail-meta">
                {{ post.date || blog.unavailableDate }} / {{ post.readTime }}
              </p>

              <div v-if="post.tags.length" class="flex flex-wrap gap-2 pt-2">
                <span v-for="tag in post.tags" :key="tag" class="film-tag">
                  {{ tag }}
                </span>
              </div>
            </div>

            <span class="ticket-stamp">{{ blog.articleStamp }}</span>
          </div>
        </section>

        <section class="paper-panel mt-8">
          <ContentRenderer v-if="post.body" :value="post" class="prose prose-film max-w-none" />
          <div v-else class="prose prose-film max-w-none" v-html="blog.emptyContent" />
        </section>
      </template>

      <div class="mt-8 flex justify-center">
        <NuxtLink to="/blog" class="ticket-button ticket-button-secondary">
          {{ blog.backLabel }}
        </NuxtLink>
      </div>
    </div>

    <div class="blog-sidebar blog-sidebar-right hidden lg:block">
      <div class="sticky top-32 space-y-6">
        <div class="clapperboard-ornament">
          <div class="clapperboard-top"></div>
          <div class="clapperboard-bottom">
            <span>SCENE</span>
            <span>TAKE</span>
            <span>ROLL</span>
          </div>
        </div>
        <div class="film-perforations-vertical"></div>
        <div class="vintage-note">
          <p>NOTES</p>
          <p>Keep reading</p>
        </div>
      </div>
    </div>
  </div>
</template>
