<script setup lang="ts">
import { storeToRefs } from "pinia";

const siteStore = useSiteStore();
const { brand, home, stack } = storeToRefs(siteStore);

useSeoMeta({
  title: () => home.value.seoTitle,
  description: () => home.value.intro,
});
</script>

<template>
  <div class="space-y-8">
    <section class="film-frame overflow-hidden">
      <div class="grid gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-center">
        <div class="space-y-6">
          <p class="film-label">{{ home.kicker }}</p>

          <div class="space-y-4">
            <p class="text-xs uppercase tracking-[0.45em] text-[var(--film-gold-soft)] md:text-sm">
              {{ brand.owner }} / {{ brand.alias }}
            </p>
            <h1 class="hero-title">{{ home.title }}</h1>
            <p class="max-w-3xl text-xl leading-8 text-[var(--film-paper-soft)] md:text-2xl">
              {{ home.subtitle }}
            </p>
            <p class="max-w-2xl text-base leading-8 text-[var(--film-muted-light)] md:text-lg">
              {{ home.intro }}
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <span v-for="badge in home.badges" :key="badge" class="contact-chip">
              {{ badge }}
            </span>
          </div>

          <div class="flex flex-wrap gap-4 pt-2">
            <NuxtLink
              v-for="action in home.ctas"
              :key="action.to"
              :to="action.to"
              class="ticket-button"
              :class="action.variant === 'primary' ? 'ticket-button-primary' : 'ticket-button-secondary'"
            >
              {{ action.label }}
            </NuxtLink>
          </div>
        </div>

        <aside class="poster-card">
          <p class="text-xs uppercase tracking-[0.35em] text-[var(--film-gold-soft)]">
            {{ home.poster.label }}
          </p>
          <div class="mt-5 space-y-4">
            <div>
              <p class="text-sm uppercase tracking-[0.3em] text-[var(--film-muted-light)]">
                {{ home.poster.titleLabel }}
              </p>
              <h2 class="mt-2 text-3xl leading-tight text-[var(--film-paper)]">
                {{ home.poster.title }}
              </h2>
            </div>

            <p class="text-sm leading-7 text-[var(--film-paper-soft)]">
              {{ home.poster.body }}
            </p>

            <div class="story-divider" />

            <ul class="space-y-3 text-sm leading-7 text-[var(--film-muted-light)]">
              <li v-for="note in home.notes" :key="note">{{ note }}</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>

    <section class="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <gameLifeDrawer />

      <article class="paper-panel">
        <div class="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p class="film-label">{{ home.techReel.label }}</p>
            <h2 class="mt-4 text-3xl text-[var(--film-ink)]">{{ home.techReel.title }}</h2>
            <p class="mt-3 max-w-2xl text-sm leading-7 text-[var(--film-muted)]">
              {{ home.techReel.body }}
            </p>
          </div>
          <NuxtLink to="/about" class="ticket-button ticket-button-secondary">
            {{ home.techReel.actionLabel }}
          </NuxtLink>
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <span
            v-for="item in stack"
            :key="item"
            class="rounded-full border border-[rgba(92,58,32,0.16)] bg-[rgba(255,248,235,0.88)] px-4 py-2 text-sm text-[var(--film-ink)]"
          >
            {{ item }}
          </span>
        </div>
      </article>
    </section>
  </div>
</template>
