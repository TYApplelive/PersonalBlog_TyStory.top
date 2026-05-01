# TY's Blog

这是一个基于 `Nuxt 4 + Vue 3 + Pinia + Nuxt Content + Tailwind CSS 4` 的个人博客工程。项目不是传统的文章目录首页，而是一个带复古电影感的个人站点：前台负责个人表达、博客阅读和视觉呈现，后台负责 Markdown 文章导入、图床配置、图片处理和文章管理。

## 技术栈

- `Nuxt 4`：应用框架、文件路由、服务端 API、Nitro 服务端能力。
- `Vue 3`：页面和组件开发。
- `Pinia`：站点运行时状态与静态配置聚合。
- `@nuxt/content`：读取 `content/blog/*.md` 并生成博客内容集合。
- `Tailwind CSS 4`：原子类与基础样式能力。
- `nuxt-notify`：后台保存、删除、复制等交互提示。
- `better-sqlite3`：Nuxt Content 原生 SQLite 内容缓存依赖。
- `zod`：Nuxt Content collection schema 校验。

## 工程结构

```
.
├─ app/
│  ├─ app.vue
│  ├─ assets/css/
│  │  ├─ main.css
│  │  ├─ global.css
│  │  ├─ admin.css
│  │  ├─ blog.css
│  │  ├─ home.css
│  │  ├─ font.css
│  │  └─ components/
│  ├─ components/
│  ├─ layouts/
│  ├─ pages/
│  │  ├─ index.vue
│  │  ├─ about/index.vue
│  │  ├─ blog/
│  │  └─ admin/
│  ├─ stores/
│  └─ utils/site-data/
├─ content/blog/
├─ public/
├─ server/
│  ├─ api/
│  ├─ routes/
│  └─ utils/
├─ shared/utils/
├─ content.config.ts
├─ nuxt.config.ts
├─ package.json
└─ tsconfig.json
```

## 核心配置文件

| 文件 | 作用 |
| --- | --- |
| `package.json` | 定义项目脚本和依赖。常用脚本包括 `dev`、`build`、`generate`、`preview`、`postinstall`。 |
| `nuxt.config.ts` | Nuxt 主配置。注册 Pinia、Nuxt Content、nuxt-notify、Tailwind Vite 插件、全局 CSS、运行时配置和路径别名。 |
| `content.config.ts` | 定义 `blog` collection，数据源为 `content/blog/**/*.md`，并校验 `title`、`date`、`description`、`readTime`、`tags` 等 frontmatter 字段。 |
| `tsconfig.json` | 继承 Nuxt 生成的 tsconfig，并补充 `@components`、`@stores`、`@utils`、`@layouts`、`@serverUtils` 路径别名。 |
| `.gitignore` | 忽略 Nuxt 构建产物、依赖目录、本地环境变量、`.data`、编辑器配置等。 |

## 应用入口与布局

| 文件 | 作用 |
| --- | --- |
| `app/app.vue` | 应用根组件。设置 `html lang="zh-CN"`、站点图标、全局加载条，并挂载 `NuxtLayout` 与 `NuxtPage`。 |
| `app/layouts/default.vue` | 默认布局。读取 Pinia 中的导航数据，渲染顶部 Logo、导航菜单、页面主体和页脚。 |
| `app/components/customLogo.vue` | Logo 组件。默认读取站点品牌配置，也支持通过 props 覆盖标题、字号和是否显示图标。 |
| `app/components/customFooter.vue` | 页脚组件。展示站点说明、当前年份、署名和联系入口。 |
| `app/components/contactIcons.vue` | 联系方式组件。读取 GitHub、QQ、微信等配置，提供 hover/focus 提示。 |

## 页面结构

### 前台页面

| 路由 | 文件 | 作用 |
| --- | --- | --- |
| `/` | `app/pages/index.vue` | 首页。展示品牌主视觉、个人说明、标签、CTA、海报卡片、GameLife 抽屉和 Tech Reel 区域。 |
| `/about` | `app/pages/about/index.vue` | 关于页。展示站点创建经历、章节叙事、引用说明和灵感侧栏。 |
| `/blog` | `app/pages/blog/index.vue` | 博客列表页。通过 `GET /api/blog/posts` 获取文章列表并渲染文章卡片。 |
| `/blog/:slug` | `app/pages/blog/[slug].vue` | 博客详情页。通过 `GET /api/blog/:slug` 获取单篇文章，使用 `ContentRenderer` 渲染 Markdown 正文。 |

### 后台页面

| 路由 | 文件 | 作用 |
| --- | --- | --- |
| `/admin` | `app/pages/admin/index.vue` | 后台首页。展示文章数量、标签数量、分类数量和管理入口。 |
| `/admin/posts` | `app/pages/admin/posts/index.vue` | 文章管理页。支持文章搜索、标签筛选、排序、复制路径、删除文章和触发图片修复。 |
| `/admin/posts/new` | `app/pages/admin/posts/new.vue` | 新建文章页。支持拖拽 Markdown 文件，先处理本地图片，再保存到 `content/blog/`。 |
| `/admin/imgbed-manager` | `app/pages/admin/imgbed-manager.vue` | 图床配置页。读取、测试、保存和重置图床 API URL 与 Token。 |
| `/admin/categories` | `app/pages/admin/categories.vue` | 分类页。当前分类来源于文章 tags，按出现次数统计。 |
| `/admin/tags` | `app/pages/admin/tags.vue` | 标签页。统计所有文章 frontmatter 中的 tags 并生成标签云。 |
| `/admin/settings` | `app/pages/admin/settings.vue` | 设置页。展示站点、导航、页脚、缓存等说明信息。 |
| `/admin/users` | `app/pages/admin/users.vue` | 用户页。展示站点所有者信息和当前后台模块权限说明。 |

## 组件职责

| 文件 | 作用 |
| --- | --- |
| `app/components/gameLifeDrawer.vue` | 首页 GameLife 交互组件。支持展开抽屉、查看游戏详情、生成卡片散列布局、拖拽游戏卡片和切换当前游戏。 |
| `app/components/techReelSection.vue` | 技术展示组件。根据 GameLife 抽屉状态决定是否显示技术卡片。 |
| `app/components/inspirationSidebar.vue` | 关于页灵感侧栏。根据灵感类型展示不同图标和说明。 |
| `app/components/contactIcons.vue` | 联系方式与 hover 状态展示。 |
| `app/components/customLogo.vue` | 站点 Logo 与品牌标题。 |
| `app/components/customFooter.vue` | 全站页脚。 |

## 状态与静态数据

| 文件 | 作用 |
| --- | --- |
| `app/stores/site.ts` | Pinia 主 store。聚合站点静态配置，管理联系 hover、GameLife 抽屉、当前游戏、游戏卡片位置等运行时状态。 |
| `app/utils/site-data/index.ts` | 统一导出站点静态配置。 |
| `app/utils/site-data/brand.ts` | 品牌名称、所有者、别名、眉标。 |
| `app/utils/site-data/navigation.ts` | 主导航、开发环境后台入口、联系方式显示顺序。 |
| `app/utils/site-data/contacts.ts` | GitHub、QQ、微信等联系方式。 |
| `app/utils/site-data/home.ts` | 首页文案、徽章、CTA、海报内容、技术卡片配置。 |
| `app/utils/site-data/about.ts` | 关于页章节、站点说明、灵感数据。 |
| `app/utils/site-data/gameLife.ts` | GameLife 文案、散列位置、游戏列表和游戏详情。 |
| `app/utils/site-data/blog.ts` | 博客列表页和详情页的展示文案、装饰数据和空状态文案。 |
| `app/utils/site-data/footer.ts` | 页脚文案和技术栈列表。 |

`site-data` 只保存静态配置；会随用户交互变化的 UI 状态放在 `app/stores/site.ts`。

## 样式组织

| 文件 | 作用 |
| --- | --- |
| `app/assets/css/main.css` | 引入 Tailwind CSS 和 nuxt-notify 样式。 |
| `app/assets/css/global.css` | 全局视觉变量、复古电影风格基础样式、布局容器、通用按钮、卡片、排版和装饰类。 |
| `app/assets/css/admin.css` | 后台页面通用样式，包括面板、表单、按钮、统计卡片、表格和状态提示。 |
| `app/assets/css/blog.css` | 博客列表页和详情页专用样式，包含文章阅读区、Markdown 排版和装饰元素。 |
| `app/assets/css/home.css` | 首页专用补充样式。 |
| `app/assets/css/font.css` | 远程字体声明。 |
| `app/assets/css/components/*.css` | 组件级样式，分别服务联系图标、GameLife 抽屉和 Tech Reel。 |

## 内容系统

博客文章位于：

```
content/blog/*.md
content/blog/images/*
```

Markdown frontmatter 示例：

```
---
title: Nuxt 4 入门指南
date: 2026-04-15
description: 文章摘要
readTime: 6 min
tags: [Nuxt, Vue, SSR]
---

# 文章标题

正文内容...
```

文章路径由 Nuxt Content 生成，页面侧按 `/blog/:slug` 访问。列表 API 会返回文章摘要字段，详情 API 会返回完整文档对象供 `ContentRenderer` 渲染。

## 服务端 API

### 博客读取

| 接口 | 文件 | 作用 |
| --- | --- | --- |
| `GET /api/blog/posts` | `server/api/blog/posts.get.ts` | 查询 `blog` collection，按日期倒序返回文章列表。 |
| `GET /api/blog/:slug` | `server/api/blog/[slug].get.ts` | 按 `/blog/:slug` 路径查询单篇文章。 |

### 文章管理

| 接口 | 文件 | 作用 |
| --- | --- | --- |
| `POST /api/admin/save-post` | `server/api/admin/save-post.post.ts` | 校验文件名后，将 Markdown 内容写入 `content/blog/{filename}.md`。 |
| `DELETE /api/admin/posts/:slug` | `server/api/admin/posts/[slug].delete.ts` | 校验 slug 后，删除对应 Markdown 文件。 |
| `POST /api/process-markdown` | `server/api/process-markdown.post.ts` | 处理 Markdown 中的本地图片路径，将图片上传图床后替换为远程 URL。 |
| `POST /api/admin/upload-and-process` | `server/api/admin/upload-and-process.post.ts` | 旧版/兼容上传流程：支持 multipart 上传 Markdown 文件或提交 Markdown 字符串并处理图片。 |
| `POST /api/admin/repair-blog-images` | `server/api/admin/repair-blog-images.post.ts` | 批量扫描现有文章，修复本地图片引用并写回 Markdown。 |

### 图床配置

| 接口 | 文件 | 作用 |
| --- | --- | --- |
| `GET /api/admin/imgbed-config` | `server/api/admin/imgbed-config.get.ts` | 获取服务端图床配置。 |
| `POST /api/admin/imgbed-config` | `server/api/admin/imgbed-config.post.ts` | 保存图床配置到 `.data/imgbed-config.json`。 |
| `DELETE /api/admin/imgbed-config` | `server/api/admin/imgbed-config.delete.ts` | 删除本地配置并回退到运行时默认值。 |

### 静态图片路由

| 路由 | 文件 | 作用 |
| --- | --- | --- |
| `/blog/images/:filename` | `server/routes/blog/images/[filename].get.ts` | 从 `content/blog/images` 读取图片，设置 MIME 类型和缓存头后返回。 |

## 服务端工具函数

| 文件 | 作用 |
| --- | --- |
| `server/utils/filename-validator.ts` | 校验文章文件名，只允许字母、数字、短横线和下划线，防止路径穿越。 |
| `server/utils/imgbed-config.server.ts` | 读取、保存、重置服务端图床配置，默认值来自 `runtimeConfig`。 |
| `server/utils/markdown-image-processor.ts` | 提取 Markdown 本地图片，定位本地文件，上传图床，并替换 Markdown 图片路径。 |
| `server/utils/image-upload.ts` | 负责实际上传图片到图床，处理 MIME 类型、鉴权 header、超时、重试和返回 URL 解析。 |
| `server/utils/blog-image-repair.ts` | 批量扫描 `content/blog/*.md`，修复非图床图片引用并写回文章。 |
| `server/utils/auto-image-fix.ts` | 自动修复单篇文章本地图片引用的工具函数，目前更像保留工具。 |
| `server/utils/imgbed-validator.ts` | 统一校验图床配置是否包含 API URL 和 Token。 |

## 共享工具

| 文件 | 作用 |
| --- | --- |
| `shared/utils/imgbed-config.ts` | 前后端共享的图床 URL、鉴权 header、配置 API 调用封装。 |
| `shared/utils/markdown-parser.ts` | 解析 Markdown 图片、判断本地/远程路径、替换图片路径。 |
| `shared/utils/logger.ts` | 简单日志工具，支持 `debug`、`info`、`warn`、`error` 和模块化 logger。 |

## 主要工作流图

### 前台博客阅读流程

```
flowchart TD
  A["用户访问 /blog"] --> B["app/pages/blog/index.vue"]
  B --> C["GET /api/blog/posts"]
  C --> D["@nuxt/content queryCollection('blog')"]
  D --> E["content/blog/*.md"]
  E --> F["返回文章列表"]
  F --> G["渲染博客列表卡片"]
  G --> H["用户点击 /blog/:slug"]
  H --> I["app/pages/blog/[slug].vue"]
  I --> J["GET /api/blog/:slug"]
  J --> K["按 path 查询单篇 Markdown 文档"]
  K --> L["ContentRenderer 渲染正文"]
```

### 后台新建文章流程

```
flowchart TD
  A["进入 /admin/posts/new"] --> B["拖拽或选择 Markdown 文件"]
  B --> C["浏览器读取文件内容"]
  C --> D["extractImages 统计图片引用"]
  D --> E["点击 Save"]
  E --> F["POST /api/process-markdown"]
  F --> G["读取服务端图床配置"]
  G --> H["定位本地图片文件"]
  H --> I["uploadToImgBed 上传图片"]
  I --> J["replaceImagePath 替换 Markdown 图片路径"]
  J --> K["POST /api/admin/save-post"]
  K --> L["写入 content/blog/{filename}.md"]
  L --> M["返回 /blog/{filename}"]
```

### 批量修复图片流程

```
flowchart TD
  A["进入 /admin/posts"] --> B["点击 修复图片"]
  B --> C["POST /api/admin/repair-blog-images"]
  C --> D["读取 .data/imgbed-config.json 或 runtimeConfig"]
  D --> E["扫描 content/blog/*.md"]
  E --> F["extractImages 提取图片"]
  F --> G{"是否已经是当前图床 URL"}
  G -- "是" --> H["跳过"]
  G -- "否" --> I["从 content/blog/images 或原路径读取图片"]
  I --> J["uploadToImgBed 上传"]
  J --> K["replaceImagePath 替换引用"]
  K --> L["写回 Markdown 文件"]
  L --> M["返回扫描数量、修复数量、错误列表"]
```

### 图床配置流程

```
flowchart TD
  A["进入 /admin/imgbed-manager"] --> B["GET /api/admin/imgbed-config"]
  B --> C["server/utils/imgbed-config.server.ts"]
  C --> D{".data/imgbed-config.json 是否存在"}
  D -- "存在" --> E["读取本地配置"]
  D -- "不存在" --> F["使用 runtimeConfig 默认值"]
  E --> G["页面展示 API URL 与 Token 状态"]
  F --> G
  G --> H["测试随机图片或 Token"]
  G --> I["保存配置"]
  I --> J["POST /api/admin/imgbed-config"]
  J --> K["写入 .data/imgbed-config.json"]
  G --> L["重置配置"]
  L --> M["DELETE /api/admin/imgbed-config"]
  M --> N["删除本地配置并回退默认值"]
```

### 前台静态配置流

```
flowchart LR
  A["app/utils/site-data/*"] --> B["app/utils/site-data/index.ts"]
  B --> C["app/stores/site.ts"]
  C --> D["layout / pages / components"]
  D --> E["导航、首页、关于页、GameLife、Tech Reel、页脚"]
```

## 运行时配置

`nuxt.config.ts` 中的 `runtimeConfig` 使用以下环境变量：

| 环境变量 | 作用 | 默认值 |
| --- | --- | --- |
| `LOG_LEVEL` | 控制日志等级。 | `debug` |
| `IMG_BED_API_URL` | 图床服务基础地址。 | `https://ty-imgbed.pages.dev` |
| `IMG_BED_TOKEN` | 图床上传或管理 Token。 | 空字符串 |
| `IMG_BED_CONFIG_SALT` | 公共配置盐值。 | `default-salt-change-me` |
| `SQLITE_DB_PATH` | SQLite 数据库文件路径（相对于项目根目录）。 | `.data/auth.sqlite` |
| `IMGBED_CONFIG_PATH` | 图床配置文件路径（相对于项目根目录）。 | `.data/imgbed-config.json` |
| `AUTH_SEED_ADMIN_USERNAME` | 初始管理员用户名（用户表为空时自动创建）。 | 空字符串 |
| `AUTH_SEED_ADMIN_PASSWORD` | 初始管理员密码（用户表为空时自动创建）。 | 空字符串 |
| `NUXT_SESSION_PASSWORD` | Nuxt Session 加密密钥。 | 无（必须设置） |

后台保存的图床配置会写入 `.data/imgbed-config.json`，认证数据存储在 `.data/auth.sqlite`。该目录已在 `.gitignore` 中忽略，适合保存本地运行配置。

## 开发命令

安装依赖：

```
yarn
```

启动开发环境：

```
yarn dev
```

构建：

```
yarn build
```

预览构建结果：

```
yarn preview
```

## 当前边界与注意点

- 后台入口只在开发环境加入主导航，逻辑位于 `app/utils/site-data/navigation.ts`。
- 分类管理当前并没有独立持久化分类表，分类统计来源于文章 `tags`。
- 用户管理页当前只是站点所有者信息展示，没有完整登录、鉴权和用户系统。
- 新建文章页的主流程是“读取 Markdown -> 处理图片 -> 保存 Markdown”，不是在线富文本编辑器。
- `content/blog/images` 中的图片可通过 `/blog/images/:filename` 访问。
- 服务端写入和删除文章会直接操作 `content/blog` 下的 Markdown 文件。
- 项目中已有部分注释和文案在终端输出时可能显示为乱码，优先检查编辑器中的实际编码显示。

## 推荐维护方式

- 站点文案、导航、首页、关于页、页脚等静态内容优先改 `app/utils/site-data/*`。
- UI 交互状态优先放在 `app/stores/site.ts`，不要混入静态配置文件。
- 博客正文只放在 `content/blog/*.md`。
- 博客图片优先使用远程图床 URL；本地图片可先放入 `content/blog/images`，再通过后台修复流程处理。
- 新增后台功能时，页面放在 `app/pages/admin/`，服务端写入能力放在 `server/api/admin/`，通用逻辑放在 `server/utils/` 或 `shared/utils/`。

---

# 开发手册

## 一、开发环境搭建

### 1.1 环境要求

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 18.x | 推荐使用 LTS 版本 |
| Yarn | >= 1.22.x | 包管理器 |
| VS Code | 推荐 | 安装 Volar、Tailwind CSS IntelliSense 插件 |

### 1.2 本地启动

```
# 安装依赖
yarn install

# 启动开发服务器（默认 http://localhost:3000）
yarn dev

# 构建生产版本
yarn build

# 预览构建结果
yarn preview

# 生成静态站点
yarn generate
```

### 1.3 环境变量配置

在项目根目录创建 `.env` 文件：

```
# 日志等级（debug / info / warn / error）
LOG_LEVEL=debug

# 图床 API 地址
IMG_BED_API_URL=https://your-imgbed.example.com

# 图床上传 Token
IMG_BED_TOKEN=your-upload-token

# 配置加密盐值（用于前端 localStorage 加密）
IMG_BED_CONFIG_SALT=your-secret-salt

# SQLite 数据库路径（相对于项目根目录）
SQLITE_DB_PATH=.data/auth.sqlite

# 图床配置文件路径（相对于项目根目录）
IMGBED_CONFIG_PATH=.data/imgbed-config.json

# 本地登录系统：首次启动若用户表为空，会自动创建管理员账号
AUTH_SEED_ADMIN_USERNAME=admin
AUTH_SEED_ADMIN_PASSWORD=your-secure-password

# Nuxt Session 密码（用于会话加密）
NUXT_SESSION_PASSWORD=generate-a-random-string-here
```

---

## 二、项目架构详解

### 2.1 目录结构总览

```
c:\NewProject\PersonalBlog\
├── app/                      # 前端应用目录
│   ├── app.vue               # 应用根组件
│   ├── error.vue             # 全局错误页面
│   ├── assets/css/           # 样式文件
│   ├── components/           # Vue 组件
│   ├── layouts/              # 布局组件
│   ├── pages/                # 页面路由
│   ├── stores/               # Pinia 状态管理
│   └── utils/site-data/      # 静态配置数据
├── content/                  # Nuxt Content 内容目录
│   └── blog/                 # 博客文章
│       ├── images/           # 文章图片
│       └── *.md              # Markdown 文章
├── server/                   # 服务端代码
│   ├── api/                  # API 路由
│   ├── routes/               # 静态路由
│   └── utils/                # 服务端工具函数
├── shared/                   # 前后端共享代码
│   └── utils/                # 共享工具函数
├── public/                   # 静态资源
├── content.config.ts         # Nuxt Content 集合配置
├── nuxt.config.ts            # Nuxt 主配置
└── package.json              # 项目依赖
```

### 2.2 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (app/)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages     │  │ Components  │  │   Stores (Pinia)    │  │
│  │  (路由页面)  │  │  (UI组件)   │  │   (状态管理)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                          ↓ useFetch / $fetch                 │
├─────────────────────────────────────────────────────────────┤
│                        API 层 (server/api/)                  │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │   博客读取 API       │  │      管理功能 API            │   │
│  │  GET /api/blog/*    │  │  POST /api/admin/*          │   │
│  └─────────────────────┘  └─────────────────────────────┘   │
│                          ↓ queryCollection                   │
├─────────────────────────────────────────────────────────────┤
│                     内容层 (content/)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Nuxt Content (blog collection)          │    │
│  │                 content/blog/*.md                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、核心模块开发指南

### 3.1 新增博客文章

**方式一：通过管理后台**

1. 访问 `/admin/posts/new`
2. 拖拽或选择 `.md` 文件上传
3. 系统自动处理本地图片并保存到 `content/blog/`

**方式二：手动创建**

1. 在 `content/blog/` 创建 `your-article-slug.md`
2. 填写 frontmatter：

```
---
title: 文章标题
date: 2026-04-25
excerpt: 文章摘要
readTime: 5 min
tags: [Tag1, Tag2]
---

# 文章标题

正文内容...
```

### 3.2 新增 API 接口

**步骤：**

1. 在 `server/api/` 下创建文件，命名规则：
   - `xxx.get.ts` → GET 请求
   - `xxx.post.ts` → POST 请求
   - `[param].ts` → 动态路由参数

2. 使用 `defineEventHandler` 定义处理函数：

```
// server/api/example.get.ts
export default defineEventHandler(async (event) => {
  // 获取查询参数
  const query = getQuery(event)
  
  // 获取路由参数
  const param = getRouterParam(event, 'param')
  
  // 读取请求体
  const body = await readBody(event)
  
  // 返回 JSON 响应
  return { success: true, data: [] }
})
```

### 3.3 新增前端页面

**步骤：**

1. 在 `app/pages/` 下创建 `.vue` 文件
2. 使用 `<script setup>` 语法
3. 通过 `useFetch` 调用 API

```
<script setup lang="ts">
/**
 * 页面说明
 *
 * 耦合关系：
 *   - server/api/xxx.ts → API 调用
 *   - stores/site.ts    → 状态消费
 */

// 获取数据
const { data } = await useFetch('/api/example')

// 使用 Store
const siteStore = useSiteStore()
</script>

<template>
  <div>
    <!-- 页面内容 -->
  </div>
</template>
```

### 3.4 新增 Pinia Store

```
// app/stores/example.ts
import { defineStore } from 'pinia'

export const useExampleStore = defineStore('example', {
  state: () => ({
    items: [] as string[],
  }),

  getters: {
    itemCount: (state) => state.items.length,
  },

  actions: {
    addItem(item: string) {
      this.items.push(item)
    },
  },
})
```

---

## 四、API 开发规范

### 4.1 文件命名规范

| 文件名 | HTTP 方法 | 路由 |
|--------|----------|------|
| `posts.get.ts` | GET | `/api/posts` |
| `posts.post.ts` | POST | `/api/posts` |
| `[id].get.ts` | GET | `/api/posts/:id` |
| `[id].delete.ts` | DELETE | `/api/posts/:id` |

### 4.2 注释规范

每个 API 文件必须包含：

```
/**
 * API 说明 (server/api/xxx.ts)
 *
 * 耦合关系：
 *   - 调用方文件路径 → 调用方式
 *   - 依赖模块路径   → 依赖内容
 *
 * 请求方式：GET/POST/DELETE /api/xxx
 * 请求体：{ field: type }
 * 返回：{ field: type }
 */
```

### 4.3 错误处理

```
export default defineEventHandler(async (event) => {
  try {
    // 业务逻辑
    if (!condition) {
      throw createError({
        statusCode: 400,
        message: '错误信息'
      })
    }
    
    return { success: true }
  } catch (error: any) {
    // 已处理的错误直接抛出
    if (error.statusCode) throw error
    
    // 未处理的错误
    throw createError({
      statusCode: 500,
      message: error.message || '服务器错误'
    })
  }
})
```

---

## 五、前端开发规范

### 5.1 组件命名

- 页面组件：`app/pages/xxx/index.vue` 或 `app/pages/xxx/[param].vue`
- UI 组件：`app/components/xxxYyy.vue`（PascalCase）
- 布局组件：`app/layouts/xxx.vue`

### 5.2 数据获取

**在页面/组件中使用 `useFetch`：**

```
// 推荐：使用 useFetch（SSR 友好）
const { data, pending, error } = await useFetch('/api/posts')

// 带类型
const { data } = await useFetch<Post[]>('/api/posts')

// 带默认值
const { data } = await useFetch<Post[]>('/api/posts', {
  default: () => []
})
```

**在事件处理中使用 `$fetch`：**

```
// 点击事件等场景
async function handleSubmit() {
  const result = await $fetch('/api/posts', {
    method: 'POST',
    body: { title: 'xxx' }
  })
}
```

### 5.3 样式规范

- 全局样式：`app/assets/css/global.css`
- 页面样式：`<style scoped>` 内联
- 工具类：优先使用 Tailwind CSS

---

## 六、图床集成指南

### 6.1 图床配置

1. 访问 `/admin/imgbed-manager`
2. 填写图床 API URL 和 Token
3. 点击「测试」验证配置
4. 点击「保存」持久化配置

### 6.2 图片处理流程

```
Markdown 文件
     ↓
extractImages() 提取图片路径
     ↓
getLocalImages() 筛选本地图片
     ↓
uploadToImgBed() 上传到图床
     ↓
replaceImagePath() 替换为图床 URL
     ↓
保存处理后的 Markdown
```

### 6.3 相关工具函数

| 函数 | 文件 | 作用 |
|------|------|------|
| `extractImages` | `shared/utils/markdown-parser.ts` | 提取 Markdown 中所有图片 |
| `getLocalImages` | `shared/utils/markdown-parser.ts` | 筛选本地图片 |
| `replaceImagePath` | `shared/utils/markdown-parser.ts` | 替换图片路径 |
| `uploadToImgBed` | `server/utils/image-upload.ts` | 上传图片到图床 |
| `getImgBedConfig` | `shared/utils/imgbed-config.ts` | 获取图床配置 |

---

## 七、常见问题排查

### 7.1 文章不显示

**检查清单：**

1. 文件是否在 `content/blog/` 目录下
2. frontmatter 是否完整（title、date 必填）
3. 文件名是否符合规范（仅字母、数字、短横线、下划线）
4. 重启开发服务器：`yarn dev`

### 7.2 图片上传失败

**排查步骤：**

1. 检查图床配置是否正确（`/admin/imgbed-manager`）
2. 检查 Token 是否有上传权限
3. 查看浏览器控制台错误信息
4. 查看服务端日志输出

### 7.3 TypeScript 类型错误

**解决方案：**

```
# 重新生成类型定义
npx nuxi prepare

# 重启 VS Code
```

### 7.4 样式不生效

**检查清单：**

1. 是否在 `nuxt.config.ts` 的 `css` 数组中引入
2. 是否使用了 `scoped` 但样式选择器不匹配
3. Tailwind 类名是否拼写正确

---

## 八、贡献指南

### 8.1 代码规范

1. **注释**：每个文件顶部必须包含耦合关系说明
2. **命名**：变量/函数使用 camelCase，组件使用 PascalCase
3. **类型**：优先使用 TypeScript 类型定义
4. **样式**：优先使用 Tailwind CSS 工具类

### 8.2 提交规范

```
feat: 新增功能
fix: 修复 Bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

### 8.3 分支管理

- `main`：生产分支
- `develop`：开发分支
- `feature/xxx`：功能分支
- `fix/xxx`：修复分支

---

## 九、附录

### 9.1 路径别名速查

| 别名 | 路径 | 用途 |
|------|------|------|
| `@components` | `app/components/` | UI 组件 |
| `@stores` | `app/stores/` | 状态管理 |
| `@utils` | `app/utils/` | 工具函数 |
| `@layouts` | `app/layouts/` | 布局组件 |
| `@serverUtils` | `server/utils/` | 服务端工具 |
| `~` | `app/` | 应用根目录 |
| `#imports` | Nuxt 自动导入 | Nuxt API |

### 9.2 常用命令速查

```
# 开发
yarn dev

# 构建
yarn build

# 预览
yarn preview

# 类型检查
npx nuxi prepare

# 清除缓存
rm -rf .nuxt .output node_modules/.cache
```

### 9.3 相关文档链接

- [Nuxt 4 文档](https://nuxt.com/docs)
- [Nuxt Content 文档](https://content.nuxt.com)
- [Pinia 文档](https://pinia.vuejs.org)
- [Tailwind CSS 文档](https://tailwindcss.com)
