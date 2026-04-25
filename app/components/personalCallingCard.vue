<script setup lang="ts">
/**
 * 个人电子名片组件 (personalCallingCard.vue)
 *
 * 耦合关系：
 *   - stores/site.ts → 读取 brand / home / contacts / contactOrder / stack
 *
 * 应用方式：
 *   <personalCallingCard />
 *
 * 函数表：
 *   - callsign:     组合站点主人与别名
 *   - profileTags:  合并首页标签与技术栈标签
 *   - contactItems: 按导航配置顺序生成联系方式列表
 */

import { storeToRefs } from "pinia";

const siteStore = useSiteStore();
const { brand, home, contacts, contactOrder, stack } = storeToRefs(siteStore);

const callsign = computed(() => `${brand.value.owner} / ${brand.value.alias}`);
const profileTags = computed(() => [...home.value.badges, ...stack.value].slice(0, 6));
const contactItems = computed(() =>
  contactOrder.value.map((key) => ({
    key,
    ...contacts.value[key],
  })),
);
</script>

<template>
  <article class="personal-card" tabindex="0" aria-labelledby="personal-card-title">
    <!-- 视觉层：电子扫描光与猎魔纹章，不承载内容 -->
    <span class="personal-card-scan" aria-hidden="true" />
    <span class="personal-card-corner personal-card-corner-top" aria-hidden="true" />
    <span class="personal-card-corner personal-card-corner-bottom" aria-hidden="true" />

    <div class="personal-card-front">
      <div class="personal-card-sigil" aria-hidden="true">
        <span>{{ brand.owner }}</span>
      </div>

      <div class="personal-card-copy">
        <p class="personal-card-kicker">Hunter ID / Personal Signal</p>
        <h2 id="personal-card-title" class="personal-card-title">{{ brand.title }}</h2>
        <p class="personal-card-callsign">{{ callsign }}</p>
      </div>

      <div class="personal-card-code" aria-hidden="true">
        <span>NO. 2003</span>
        <span>ACT II</span>
      </div>
    </div>

    <div class="personal-card-reveal">
      <div class="personal-card-reveal-copy">
        <p class="personal-card-reveal-label">Identity Unsealed</p>
        <p class="personal-card-reveal-text">{{ home.subtitle }}</p>
      </div>

      <div class="personal-card-tags" aria-label="Profile tags">
        <span v-for="tag in profileTags" :key="tag" class="personal-card-tag">{{ tag }}</span>
      </div>

      <div class="personal-card-contacts" aria-label="Contact links">
        <component
          :is="item.href ? 'a' : 'span'"
          v-for="item in contactItems"
          :key="item.key"
          class="personal-card-contact"
          :href="item.href"
          :target="item.href ? '_blank' : undefined"
          :rel="item.href ? 'noreferrer' : undefined"
        >
          <span class="personal-card-contact-mark">{{ item.label.slice(0, 1) }}</span>
          <span>
            <strong>{{ item.label }}</strong>
            <em>{{ item.value }}</em>
          </span>
        </component>
      </div>
    </div>
  </article>
</template>
