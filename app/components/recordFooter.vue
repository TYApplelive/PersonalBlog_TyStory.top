<script setup lang="ts">
/**
 * 备案页脚组件 (recordFooter.vue)
 *
 * 耦合关系：
 *   - layouts/default.vue → 挂载在主页脚下方
 */
const icpText = "蜀ICP备2026000219号-1";
const publicSecurityText = "川公网安备51011402001001号";
</script>

<template>
  <section class="film-frame mt-4 px-6 py-4 md:px-8" aria-label="备案信息">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p class="film-label">备案信息</p>
      <div
        class="flex flex-col gap-2 text-xs tracking-[0.18em] text-(--film-muted-light) md:items-end md:text-right">
        <p>{{ icpText }}</p>
        <p>{{ publicSecurityText }}</p>
      </div>
    </div>
  </section>
</template>
