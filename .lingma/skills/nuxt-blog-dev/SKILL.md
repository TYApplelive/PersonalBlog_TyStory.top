# Nuxt 个人博客开发规范

> 适用于 PersonalBlog 项目的开发指南和代码规范。

## 项目信息

- **名称**: TY's Blog
- **框架**: Nuxt 4 + Vue 3 + TypeScript
- **状态管理**: Pinia 3
- **样式**: Tailwind CSS 4 + Less
- **包管理器**: Yarn 1.22.22
- **设计理念**: 复古电影感、胶片质感、深色背景、暖色纸面

## 技术栈


| 类别         | 技术         | 版本    |
| ------------ | ------------ | ------- |
| 框架         | Nuxt         | ^4.2.2  |
| UI 框架      | Vue          | ^3.5.26 |
| 路由         | Vue Router   | ^4.6.4  |
| 状态管理     | Pinia        | ^3.0.4  |
| CSS 框架     | Tailwind CSS | ^4.2.2  |
| CSS 预处理器 | Less         | ^4.6.4  |

## 目录结构规范

```
PersonalBlog/
├── app/
│   ├── app.vue                    # 应用根组件
│   ├── assets/css/                # 样式文件
│   │   ├── main.css               # 主入口
│   │   ├── global.css             # 全局样式
│   │   ├── blog.css               # 博客页面样式
│   │   ├── home.css               # 首页样式
│   │   └── components/            # 组件专用样式
│   ├── components/                # Vue 组件
│   ├── layouts/default.vue        # 默认布局
│   ├── pages/                     # 页面路由
│   │   ├── index.vue              # 首页 /
│   │   ├── about.vue              # 关于页 /about
│   │   └── blog/                  # 博客路由组
│   │       ├── index.vue          # 博客列表 /blog
│   │       └── [id].vue           # 博客详情 /blog/:id
│   ├── stores/site.ts             # Pinia 状态管理
│   └── utils/
│       ├── blog-content.ts        # 博客内容工具
│       └── site-data/             # 静态配置数据
│           ├── index.ts           # 统一导出
│           ├── brand.ts           # 品牌配置
│           ├── navigation.ts      # 导航配置
│           ├── home.ts            # 首页配置
│           ├── about.ts           # 关于页配置
│           ├── blog.ts            # 博客配置
│           ├── contacts.ts        # 联系方式
│           ├── footer.ts          # 页脚配置
│           └── gameLife.ts        # 游戏抽屉配置
├── content/blog/                  # Markdown 博客文章
├── public/                        # 静态资源
├── nuxt.config.ts                 # Nuxt 配置
└── package.json
```

## 代码编写规范

### 1. 通用规范

- 所有代码必须添加注释，但注释要精简且重要
- 使用 TypeScript，启用严格模式
- 遵循 Vue 3 Composition API 最佳实践
- 组件命名使用 camelCase（如 `customLogo.vue`）

### 2. Vue 组件规范

```vue
<script setup lang="ts">
// 1. 导入依赖
import { computed } from "vue";
import { storeToRefs } from "pinia";

// 2. Props 定义
const props = withDefaults(
  defineProps<{
    title?: string;
    fontSize?: string;
  }>(),
  {
    title: "",
    fontSize: "25px",
  },
);

// 3. Store 使用
const siteStore = useSiteStore();
const { brand } = storeToRefs(siteStore);

// 4. 计算属性
const resolvedTitle = computed(() => props.title || brand.value.title);

// 5. 注释说明重要逻辑
</script>

<template>
  <!-- 模板内容 -->
</template>
```

### 3. 页面组件规范

```typescript
// 页面头部使用 useSeoMeta 设置 SEO
useSeoMeta({
  title: () => blog.value.seoTitle,
  description: () => blog.value.listLead,
});

// 使用 useAsyncData 获取异步数据
const { data: posts } = await useAsyncData("key-name", () => {
  return Promise.resolve(getAllBlogPosts());
});
```

### 4. 路由规范

#### ✅ 正确的路由结构

```
pages/
├── blog/
│   ├── index.vue    # 匹配 /blog
│   └── [id].vue     # 匹配 /blog/:id
```

#### ❌ 错误的路由结构（会导致路由冲突）

```
pages/
├── blog.vue         # 会拦截所有 /blog/* 路径
└── blog/
    └── [id].vue     # 不会被正确渲染
```

**重要**: 当存在父路由和子路由时，父路由必须使用 `index.vue`，不能使用 `blog.vue`。

### 5. 状态管理规范

#### 静态配置 vs 运行时状态

- **静态配置**（不变的数据）: 存放在 `app/utils/site-data/`
- **运行时状态**（用户交互产生的动态数据）: 存放在 `app/stores/site.ts`

```typescript
// site-data/brand.ts - 静态配置
export const brandConfig = {
  title: "TY's Blog",
  eyebrow: "Personal Blog",
};

// stores/site.ts - 运行时状态
export const useSiteStore = defineStore("site", {
  state: () => ({
    brand: brandConfig,  // 从静态配置导入
    ui: {
      hoveredContact: null as ContactKey | null,  // 运行时 UI 状态
    },
  }),
});
```

### 6. 博客内容规范

#### Markdown 文件格式

```md
---
id: 1
title: 文章标题
date: 2026-04-15
excerpt: 文章摘要
readTime: 6 min
tags: [Nuxt, Vue, SSR]
---

# 文章标题

正文内容...
```

#### 博客内容加载

```typescript
// 列表页
const { data: posts } = await useAsyncData("blog-posts", () => {
  return Promise.resolve(getAllBlogPosts());
});

// 详情页
const postId = computed(() => Number(route.params.id));
const { data: post, refresh } = await useAsyncData(
  "blog-post-detail",  // 使用静态 key
  () => Promise.resolve(getBlogPostById(postId.value)),
);

// 监听路由参数变化
watch(postId, () => {
  refresh();
});
```

### 7. 样式规范

#### CSS 变量

```css
:root {
  --film-bg: #140f0d;
  --film-bg-soft: #271a16;
  --film-paper: #f2ddaf;
  --film-ink: #2f1e14;
  --film-accent: #7b1e1e;
  --film-gold: #b78c4d;
}
```

#### 类名命名

- 页面级容器: `blog-list-wrapper`, `blog-detail-wrapper`
- 内容区域: `blog-list-content`, `blog-detail-content`
- 侧边栏: `blog-sidebar`, `blog-list-sidebar`
- 装饰元素: `film-reel-ornament`, `vintage-stamp`

### 8. TypeScript 类型定义

```typescript
// 在 stores/site.ts 或专门的 types 文件中定义
export interface BlogPost {
  id: number;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  readTime: string;
  tags: string[];
}
```

## 常见踩坑点

### 1. 路由冲突

**问题**: URL 跳转了但页面没变

**原因**: 父路由文件 `blog.vue` 和子路由 `[id].vue` 结构冲突

**解决**: 将 `blog.vue` 改为 `blog/index.vue`

### 2. useAsyncData 动态 key 问题

**问题**: 客户端导航时视图不更新

**原因**: 使用动态 key 导致 Nuxt 缓存机制失效

**解决**: 使用静态 key + watch 监听路由参数变化

```typescript
// ❌ 错误
const { data: post } = await useAsyncData(
  () => `blog-post-${postId.value}`,
  () => Promise.resolve(getBlogPostById(postId.value)),
);

// ✅ 正确
const { data: post, refresh } = await useAsyncData(
  "blog-post-detail",
  () => Promise.resolve(getBlogPostById(postId.value)),
);

watch(postId, () => {
  refresh();
});
```

### 3. 静态配置与运行时状态混淆

**问题**: 将不变的配置数据放入 Pinia state

**解决**:

- 静态配置 → `app/utils/site-data/`
- 运行时状态 → `app/stores/site.ts`

## 开发工作流

### 1. 添加新页面

1. 在 `app/pages/` 创建 `.vue` 文件
2. 在 `app/utils/site-data/navigation.ts` 添加导航项
3. 设置 SEO 元数据（使用 `useSeoMeta`）
4. 添加页面专用样式到 `app/assets/css/`

### 2. 添加博客文章

1. 在 `content/blog/` 创建 `.md` 文件
2. 填写 frontmatter 元数据（id、title、date、excerpt、readTime、tags）
3. 编写正文内容
4. 无需修改代码，文章会自动加载

### 3. 修改站点配置

1. 静态配置修改 → `app/utils/site-data/` 对应文件
2. 运行时状态修改 → `app/stores/site.ts`
3. 样式修改 → `app/assets/css/` 对应文件

## 开发命令

```bash
# 安装依赖
yarn

# 启动开发服务器
yarn dev

# 构建生产版本
yarn build

# 生成静态站点
yarn generate

# 预览构建结果
yarn preview
```

## 设计关键词

复古、电影感、胶片质感、深色背景、暖色纸面、叙事性、视觉表达
