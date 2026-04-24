/**
 * Nuxt 应用配置 (nuxt.config.ts)
 *
 * 耦合关系：
 *   - @pinia/nuxt      → 状态管理模块
 *   - @tailwindcss/vite → Tailwind CSS Vite 插件
 *   - @nuxt/content    → Markdown 内容解析与渲染
 */
import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  modules: ["@pinia/nuxt", "@nuxt/content"],
  css: [
    "~/assets/css/main.css",
    "~/assets/css/global.css",
    "~/assets/css/admin.css",
  ],
  runtimeConfig: {
    public: {
      imgBedConfigSalt: process.env.IMG_BED_CONFIG_SALT || "default-salt-change-me",
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  content: {
    experimental: {
      nativeSqlite: true,
    },
  },
});
