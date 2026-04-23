// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  modules: ["@pinia/nuxt"],
  css: [
    "~/asset/css/main.css",
    "~/asset/css/global.css"
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
