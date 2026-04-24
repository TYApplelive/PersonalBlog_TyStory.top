import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  modules: ["@pinia/nuxt", "@nuxt/content"],
  css: [
    "~/assets/css/main.css",
    "~/assets/css/global.css",
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
