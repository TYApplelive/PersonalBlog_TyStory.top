<script setup lang="ts">
import { storeToRefs } from "pinia";

const siteStore = useSiteStore();
const { blog, getBlogPosts } = storeToRefs(siteStore);

useSeoMeta({
  title: () => blog.value.seoTitle,
  description: () => blog.value.listLead,
});
</script>

<template>
  <div class="space-y-6">
    <section class="film-frame">
      <p class="film-label">{{ blog.listLabel }}</p>
      <h1 class="mt-4 text-4xl text-[var(--film-paper)] md:text-5xl">{{ blog.listTitle }}</h1>
      <p class="mt-4 max-w-3xl text-base leading-8 text-[var(--film-paper-soft)]">
        {{ blog.listLead }}
      </p>
    </section>

    <section class="grid gap-5">
      <article
        v-for="post in getBlogPosts"
        :key="post.id"
        class="paper-panel"
      >
        <p class="text-xs uppercase tracking-[0.3em] text-[var(--film-muted)]">{{ post.date }}</p>
        <h2 class="mt-3 text-2xl text-[var(--film-ink)]">
          <NuxtLink :to="`/blog/${post.id}`" class="hover:text-[var(--film-accent)]">
            {{ post.title }}
          </NuxtLink>
        </h2>
        <p class="mt-3 text-sm leading-8 text-[var(--film-muted)]">
          {{ post.excerpt }}
        </p>
        <div class="mt-5">
          <NuxtLink :to="`/blog/${post.id}`" class="ticket-button ticket-button-secondary">
            {{ blog.readLabel }}
          </NuxtLink>
        </div>
      </article>
    </section>
  </div>
</template>
