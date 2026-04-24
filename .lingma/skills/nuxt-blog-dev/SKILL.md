---
name: nuxt-blog-dev
description: Develop Nuxt 4 personal blog with retro film aesthetics, Markdown content, and vintage decorations.
---

# Nuxt 个人博客开发技能

适用于 TY's Blog 项目的开发指南，涵盖复古电影风格博客的构建模式。

## 项目技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Nuxt | ^4.2.2 |
| UI | Vue | ^3.5.26 |
| 路由 | Vue Router | ^4.6.4 |
| 状态管理 | Pinia | ^3.0.4 |
| CSS | Tailwind CSS | ^4.2.2 |
| 预处理器 | Less | ^4.6.4 |
| 包管理器 | Yarn | 1.22.22 |

## 核心开发模式

### 1. 路由结构

```
pages/
├── index.vue              # 首页 /
├── about.vue              # 关于页 /about
└── blog/
    ├── index.vue          # 博客列表 /blog
    └── [id].vue           # 博客详情 /blog/:id
```

**重要**: 嵌套路由必须使用 `blog/index.vue`，不能用 `blog.vue`，否则子路由无法渲染。

### 2. 博客内容加载

#### 列表页模式
```typescript
const { data: posts } = await useAsyncData<BlogPost[]>("blog-posts", () => {
  return getAllBlogPosts();
});
```

#### 详情页模式（静态 key + watch）
```typescript
const postId = computed(() => Number(route.params.id));
const { data: post, refresh } = await useAsyncData<BlogPost | null>(
  "blog-post-detail",  // 必须使用静态 key
  () => getBlogPostById(postId.value),
);

// 监听路由变化刷新数据
watch(postId, () => {
  refresh();
});
```

**注意**: 详情页必须使用静态 key，动态 key 会导致 Nuxt 缓存失效。

### 3. Markdown 博客文章

```md
---
id: 1
title: 文章标题
date: 2026-04-15
excerpt: 文章摘要（用于列表页展示）
readTime: 6 min
tags: [Nuxt, Vue, SSR]
---

# 文章标题

正文内容...
```

文章存放在 `content/blog/` 目录，通过 `blog-content.ts` 工具函数加载。

### 4. 配置数据管理

```
app/utils/site-data/
├── index.ts           # 统一导出
├── brand.ts           # 品牌配置（标题、副标题）
├── navigation.ts      # 导航配置
├── home.ts            # 首页配置
├── about.ts           # 关于页配置
├── blog.ts            # 博客配置
├── contacts.ts        # 联系方式
├── footer.ts          # 页脚配置
└── gameLife.ts        # 游戏抽屉配置
```

**原则**:
- 静态配置（不变的数据）→ `app/utils/site-data/`
- 运行时状态（用户交互）→ `app/stores/site.ts`

### 5. 状态管理

```typescript
// app/stores/site.ts
import { defineStore } from "pinia";
import { brandConfig } from "~/utils/site-data";

export const useSiteStore = defineStore("site", {
  state: () => ({
    brand: brandConfig,  // 静态配置
    ui: {
      hoveredContact: null,  // 运行时 UI 状态
    },
  }),
});

// 组件中使用
const siteStore = useSiteStore();
const { brand } = storeToRefs(siteStore);  // 使用 storeToRefs 保持响应式
```

### 6. 复古装饰挂件

博客页面使用三栏布局，左右侧栏放置装饰挂件：

```vue
<div class="blog-list-wrapper">  <!-- grid: 4rem 1fr 4rem -->
  <div class="blog-list-sidebar hidden lg:block">
    <div class="sticky top-48 space-y-6">
      <div class="film-reel-ornament-small auto-animate"></div>
      <div class="vintage-stamp-small auto-animate"><span>LIST</span></div>
      <div class="typewriter-paper-small auto-animate">...</div>
    </div>
  </div>
  <!-- 中间内容 -->
  <div class="blog-list-sidebar hidden lg:block">
    <div class="sticky top-48 space-y-6">
      <div class="film-perforations-vertical-small auto-animate"></div>
      <div class="vintage-note-small auto-animate">...</div>
      <div class="film-strip-small auto-animate"></div>
    </div>
  </div>
</div>
```

**装饰元素列表**:
- `film-reel-ornament-small` - 胶片卷轴（旋转动画）
- `vintage-stamp-small` - 复古邮票（呼吸动画）
- `typewriter-paper-small` - 打字机纸张（浮动动画）
- `film-perforations-vertical-small` - 胶片孔（闪烁动画）
- `vintage-note-small` - 复古便签（浮动动画）
- `film-strip-small` - 胶卷底片条（滚动动画）

**注意**: 所有装饰物使用 `sticky top-48`（192px）避免被导航栏遮挡，添加 `auto-animate` 类启用自动动画。

### 7. CSS 变量系统

```css
:root {
  --film-bg: #140f0d;              /* 深棕色背景 */
  --film-bg-soft: #271a16;
  --film-paper: #f2ddaf;           /* 纸张色 */
  --film-paper-soft: #ead8b4;
  --film-ink: #2f1e14;             /* 墨水色 */
  --film-accent: #7b1e1e;          /* 酒红强调色 */
  --film-accent-soft: #9f4a3d;
  --film-gold: #b78c4d;            /* 金色 */
  --film-gold-soft: #d6bc84;
  --film-muted: #816449;           /* 暗褐色 */
  --film-muted-light: #c9b590;
}
```

### 8. SEO 设置

```typescript
// 列表页
useSeoMeta({
  title: () => blog.value.seoTitle,
  description: () => blog.value.listLead,
});

// 详情页
useSeoMeta({
  title: () => post.value?.title || blog.value.emptyTitle,
  description: () => post.value?.excerpt || blog.value.articleFallbackDescription,
});
```

## 常见踩坑点

### 路由冲突
- **问题**: URL 跳转但页面不更新
- **原因**: `blog.vue` 和 `blog/[id].vue` 结构冲突
- **解决**: 使用 `blog/index.vue` 替代 `blog.vue`

### useAsyncData 缓存问题
- **问题**: 客户端导航时数据不刷新
- **原因**: 使用动态 key 导致缓存失效
- **解决**: 静态 key + watch 监听路由参数

### 装饰物被导航栏遮挡
- **问题**: 滚动时侧边栏装饰物被顶部导航覆盖
- **原因**: `top-32`（128px）不够
- **解决**: 使用 `top-48`（192px）或更大值

### Pinia 解构丢失响应式
- **问题**: 从 store 解构后数据不响应
- **原因**: 直接解构会丢失响应式引用
- **解决**: 使用 `storeToRefs()` 包装

## 开发命令

```bash
yarn           # 安装依赖
yarn dev       # 启动开发服务器
yarn build     # 构建生产版本
yarn generate  # 生成静态站点
yarn preview   # 预览构建结果
```

## 设计关键词

复古、电影感、胶片质感、深色背景、暖色纸面、叙事性、视觉表达
