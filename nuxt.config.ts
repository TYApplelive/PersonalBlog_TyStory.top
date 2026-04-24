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
  ],
  imports: {
    dirs: [
      "shared/utils",
      "shared/types",
    ],
  },
  nitro: {
    imports: {
      dirs: [
        "shared/utils",
        "shared/types",
      ],
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
