/**
 * Nuxt 应用配置 (nuxt.config.ts)
 *
 * 耦合关系：
 *   - @pinia/nuxt      → 状态管理模块
 *   - @tailwindcss/vite → Tailwind CSS Vite 插件
 *   - @nuxt/content    → Markdown 内容解析与渲染
 *   - nuxt-notify       → Toast 通知组件（Tailwind 原生）
 *
 * 自定义路径别名（按功能模块组织）：
 *   - @components → app/components/    UI 组件
 *   - @stores     → app/stores/        状态管理
 *   - @utils      → app/utils/         工具函数
 *   - @layouts    → app/layouts/       布局组件
 */
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  modules: ["@pinia/nuxt", "@nuxt/content", "nuxt-notify"],
  notify: {
    position: "bottom-right",
    duration: 4000,
  },

  // 按功能模块组织的自定义路径别名
  alias: {
    "@components": fileURLToPath(new URL("./app/components", import.meta.url)),
    "@stores": fileURLToPath(new URL("./app/stores", import.meta.url)),
    "@utils": fileURLToPath(new URL("./app/utils", import.meta.url)),
    "@layouts": fileURLToPath(new URL("./app/layouts", import.meta.url)),
    "@serverUtils": fileURLToPath(new URL("./server/utils", import.meta.url)),
  },

  css: [
    "~/assets/css/main.css",
    "~/assets/css/global.css",
    "~/assets/css/admin.css",
  ],
  runtimeConfig: {
    logLevel: process.env.LOG_LEVEL || "debug",
    imgBedApiUrl: process.env.IMG_BED_API_URL || "https://ty-imgbed.pages.dev",
    imgBedToken: process.env.IMG_BED_TOKEN || "",
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
  nitro: {
    imports: {
      dirs: ["shared/utils", "shared/types"],
    },
  },
});
