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
}));

const postId = computed(() => Number(route.params.id));
const post = computed(() => siteStore.getBlogPostById(postId.value) ?? fallbackPost.value);

useSeoMeta({
  title: () => post.value.title,
  description: () => post.value.excerpt || blog.value.articleFallbackDescription,
});
</script>

<template>
  <div class="space-y-6">
    <section class="film-frame">
      <p class="film-label">{{ blog.articleLabel }}</p>
      <h1 class="mt-4 text-4xl leading-tight text-[var(--film-paper)] md:text-5xl">
        {{ post.title }}
      </h1>
      <p class="mt-3 text-sm uppercase tracking-[0.3em] text-[var(--film-muted-light)]">
        {{ post.date || blog.unavailableDate }}
      </p>
    </section>

    <article class="paper-panel">
      <div class="prose-film max-w-none" v-html="post.content" />
    </article>

    <NuxtLink to="/blog" class="ticket-button ticket-button-secondary">
      {{ blog.backLabel }}
    </NuxtLink>
  </div>
</template>
