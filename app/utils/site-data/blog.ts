/**
 * 博客配置数据
 * 
 * 注意：博客文章内容已迁移至 app/content/blog/*.md
 * 使用 Nuxt Content 模块管理
 */

import type { BlogOrnament } from "@stores/site";

export const blogConfig = {
  seoTitle: "博客",
  listLabel: "Blog Archive",
  listTitle: "博客文章",
  listLead: "这里保留文章入口,但整体气质已经从'文件夹式目录'转向更完整的个人站。博客会继续写,只是不再是首页唯一的主角。",
  articleLabel: "Article",
  articleEyebrow: "Projector Notes",
  articleStamp: "35MM CUT",
  articleFrameLabel: "Feature Reading",
  backLabel: "Back To Blog",
  emptyTitle: "文章不存在",
  emptyContent: "<p>抱歉，你访问的文章不存在。</p>",
  unavailableDate: "Unavailable",
  articleFallbackDescription: "博客文章详情页",
  readLabel: "Read Article",

  listDecorations: [
    { id: "catalog", label: "Catalog", value: "Archive Strip" },
    { id: "lighting", label: "Lighting", value: "Warm Grain" },
  ] as BlogOrnament[],

  articleDecorations: [
    { id: "reel", label: "Reel", value: "Side Channel A" },
    { id: "stamp", label: "Stamp", value: "Print Verified" },
    { id: "subtitle", label: "Subtitle", value: "Mono Theatre" },
  ] as BlogOrnament[],
};