# TY's Blog

基于 `Nuxt 4 + Vue 3 + Pinia + Tailwind CSS 4` 的个人博客项目。

项目定位不是传统文章目录首页，而是带复古电影感的个人站。首页负责视觉表达和个人叙事，博客页负责文章列表与阅读，关于页负责说明站点的创建经历。

## 目录结构

```text
.
├─ app/
│  ├─ app.vue
│  ├─ assets/
│  │  └─ css/
│  ├─ components/
│  ├─ layouts/
│  ├─ pages/
│  │  ├─ index.vue
│  │  ├─ about.vue
│  │  ├─ blog.vue
│  │  └─ blog/[id].vue
│  ├─ stores/
│  └─ utils/
│     ├─ blog-content.ts
│     └─ site-data/
├─ content/
│  └─ blog/
├─ public/
│  ├─ icon.png
│  └─ robots.txt
├─ nuxt.config.ts
└─ package.json
```

## 页面

- `/`：首页，包含品牌主视觉、海报区、`GameLife` 和 `Tech Reel`
- `/about`：关于页，讲述站点创建经历
- `/blog`：博客列表页
- `/blog/:id`：博客详情页，按文章 frontmatter 中的 `id` 读取正文

## 博客内容

文章唯一来源是根目录下的 `content/blog/*.md`。`public/` 只存放浏览器可直接访问的静态资源，不再存放博客文章。

文章格式：

```md
---
id: 1
title: Nuxt 4 入门指南
date: 2026-04-15
excerpt: 文章摘要
readTime: 6 min
tags: [Nuxt, Vue, SSR]
---

# 文章标题

正文内容...
```

博客列表页通过 `getAllBlogPosts()` 读取文章，详情页通过 `getBlogPostById(id)` 读取同一份数据。文件名只用于存储和排序辅助，不参与路由匹配。

## 状态与配置

- `app/stores/site.ts`：Pinia 运行时状态，包括导航状态、联系方式 hover、`GameLife` 抽屉状态和卡片位置
- `app/utils/site-data`：站点静态配置，包括品牌、导航、首页、关于页、游戏抽屉和页脚数据
- `app/utils/blog-content.ts`：博客 Markdown 读取、frontmatter 解析和 HTML 渲染工具

## 站点图标

站点图标来自：

```text
public/icon.png
```

全局入口 `app/app.vue` 会通过 `useHead` 注入：

```html
<link rel="icon" type="image/png" href="/icon.png">
```

## 开发命令

安装依赖：

```bash
yarn
```

启动开发环境：

```bash
yarn dev
```

构建：

```bash
yarn build
```

预览构建结果：

```bash
yarn preview
```

## 技术栈

- `Nuxt 4`
- `Vue 3`
- `Pinia`
- `Tailwind CSS 4`
- `TypeScript`
