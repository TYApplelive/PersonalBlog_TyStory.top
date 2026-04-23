<script setup lang="ts">
const siteStore = useSiteStore();
const year = new Date().getFullYear();
</script>

<template>
  <footer class="film-frame mt-10 px-6 py-6 md:px-8">
    <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div class="space-y-3">
        <p class="film-label">{{ siteStore.footer.label }}</p>
        <div>
          <h2 class="text-2xl text-(--film-paper)">{{ siteStore.brand.title }}</h2>
          <p class="max-w-2xl text-sm leading-7 text-(--film-muted-light)">
            {{ siteStore.footer.description }}
          </p>
        </div>
      </div>

      <div class="min-w-60">
        <contactIcons :title="siteStore.footer.contactLabel" />
      </div>
    </div>

    <div class="story-divider my-5" />

    <div class="flex flex-col gap-3 text-xs uppercase tracking-[0.28em] text-(--film-muted) md:flex-row md:items-center md:justify-between">
      <p>{{ year }} {{ siteStore.brand.title }}</p>
      <p>{{ siteStore.footer.ending }} {{ siteStore.brand.owner }}</p>
    </div>
  </footer>
</template>
