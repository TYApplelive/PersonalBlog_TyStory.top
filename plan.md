## 新建文章：上传 Markdown 文件后自动处理图片并保存到 `content/blog/` 计划

***

### 背景分析

已存在的能力：

| 现有模块                       | 功能                                              |
| -------------------------- | ----------------------------------------------- |
| `md-images.vue`            | 上传 .md 文件 → 提取本地图片 → 上传到图床 → 替换路径 → 下载处理后的文件    |
| `process-markdown.post.ts` | 服务端处理：接收 `content` + `imgBedConfig`，提取图片上传并替换路径 |
| `image-upload.ts`          | 上传单个文件到 CloudFlare ImgBed                       |
| `markdown-parser.ts`       | 提取/替换图片路径的纯函数（两端共用）                             |
| `posts/new.vue`            | 填写表单 → 生成 .md → 手动下载，未接入自动上传                    |

**缺失的关键环节**：没有服务端 API 将处理后的 .md 文件保存到 `content/blog/` 目录。

***

### Step 1 — 新增服务端 API：`server/api/admin/save-post.post.ts`

**目的**：接收处理后的 .md 内容，写入 `content/blog/` 目录，供 `queryCollection` 索引。

**职责**：

1. 接收 `POST /api/admin/save-post` 请求
2. 请求体：`{ filename: string, content: string }`
3. 校验 `filename` 合法性（防止路径穿越），自动补 `.md` 扩展名
4. 将 `content` 写入 `content/blog/{filename}.md`
5. 返回 `{ success: true, path: "/blog/{filename}" }`

**文件路径**：`server/api/admin/save-post.post.ts`

**注意**：

- 文件名中不要包含数字 `id`（因为已移除 id 路由），使用 `kebab-case` 命名
- 路径校验：禁止 `../` 、`..\\` 、空字符，只允许字母、数字、短横线、下划线

***

### Step 2 — 根据现有的服务端 API：`C:\NewProject\PersonalBlog\server\api\process-markdown.post.ts和C:\NewProject\PersonalBlog\server\api\upload-image.post.ts来组装成一次性请求完成任务`

**目的**：一次请求完成「接收 .md 文件 → 处理图片 → 保存到 `content/blog/`」的整体链路。

这是最核心的新 API，避免前端需要分两步操作。

| 字段             | 类型     | 说明                                     |
| -------------- | ------ | -------------------------------------- |
| `file`         | File   | 上传的 .md 文件                             |
| `imgBedApiUrl` | string | 图床 API 地址（前端从 localStorage 读取后传入）      |
| `imgBedToken`  | string | 图床 Token                               |
| `filename`     | string | 可选，指定保存的文件名（不含扩展名）；若不传则用上传的文件名去掉 `.md` |

**处理流程**：

1. 读取文件内容 → 调用 `extractImages(content)` 提取图片
2. 对每张本地图片，调用 `uploadToImgBed()` 上传到图床
3. 调用 `replaceImagePath()` 替换 Markdown 中所有本地路径为图床 URL
4. 校验 `filename` 合法性
5. 写入 `content/blog/{filename}.md`
6. 返回 `{ success: true, path: "/blog/{filename}", uploadedCount, errors }`

**文件路径**：`server/api/admin/upload-and-process.post.ts`

***

### Step 3 — 重构 `app/pages/admin/posts/new.vue`

**当前状态**：表单输入 → 预览/下载 → 手动复制到 `content/blog/` → 重启 dev server 才显示。

**目标状态**：保留现有表单 + 新增「上传 .md 文件」模式。

**新增 UI 区域**（放在表单上方）：

```
┌──────────────────────────────────────┐
│  写文章                              │
│  ┌──────────────────────────────────┐│
│  │ 📁 上传 Markdown 文件（.md）      ││
│  │ 点击选择 或 拖拽文件到此处        ││
│  │ [已选择: xxx.md]                 ││
│  └──────────────────────────────────┘│
│  ┌──────────────────────────────────┐│
│  │ 文件名（可选）：[________]       ││
│  │ 不填则使用原文件名              ││
│  └──────────────────────────────────┘│
│  [上传并处理]                        │
│                                      │
│  ─── 或手动填写 ───                │
│  （保留现有的表单区域）              │
│  [生成 Markdown] [下载文件]         │
└──────────────────────────────────────┘
```

**交互流程**：

1. 用户拖拽/选择 `.md` 文件
2. 显示文件名、文件大小
3. 用户可修改保存时的文件名（不含扩展名）
4. 点击「上传并处理」按钮
5. 前端从 `localStorage` 获取图床配置（复用 `getImgBedConfig()`）
6. 调用 `POST /api/admin/upload-and-process` 上传
7. 显示处理进度、上传图片数量
8. 成功后提示「文章已保存」，并提供链接跳转到文章详情页
9. 自动跳转到文章管理列表页（或提供按钮跳转）

**注意**：

- 保留现有的「表单输入 → 下载」功能，新增的上传模式作为补充
- 上传完成后刷新 Nuxt Content 缓存（重新请求 `posts.get.ts` 即可）

***

### Step 4 — 更新 `server/api/blog/posts.get.ts`（可选优化）

**当前状态**：所有通过 `queryCollection` 查询，上传 .md 到 `content/blog/` 后 Nuxt Content 会自动索引。

**是否需要改动**：不需要额外改动。`queryCollection` 在每次请求时读取 `content/blog/` 目录，新文件写入后自动出现在列表 API 返回中。

但需要注意：**Nuxt Content 在开发模式（dev）下**会监听文件变化，写入后列表 API 会立即返回新文章。如果生产环境使用了缓存，可能需要清除缓存，但当前配置下不需要额外处理。

***

### Step 5 — 前端「上传并处理」按钮的详细逻辑

伪代码：

```typescript
async function handleUpload() {
  // 1. 校验文件
  if (!selectedFile.value) return
  
  // 2. 获取图床配置
  const config = await getImgBedConfig()
  if (!config.token) {
    statusText.value = '请先配置图床 Token'
    return
  }
  
  // 3. 确认文件名
  const filename = customFilename.value || selectedFile.value.name.replace(/\.md$/i, '')
  
  // 4. 构建 FormData
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  formData.append('imgBedApiUrl', config.apiUrl)
  formData.append('imgBedToken', config.token)
  formData.append('filename', filename)
  
  // 5. 发送请求
  isProcessing.value = true
  const result = await $fetch('/api/admin/upload-and-process', {
    method: 'POST',
    body: formData,
  })
  
  // 6. 处理结果
  if (result.success) {
    statusText.value = `上传完成！已处理 ${result.uploadedCount} 张图片`
    // 跳转到文章列表
    navigateTo('/admin/posts')
  }
}
```

***

### Step 6 — 添加前端页面导航入口

在 `app/pages/admin/index.vue` 的 `navItems` 中，`新建文章` 卡片已经指向 `/admin/posts/new`，不需要修改。但需在新建文章页面内增加显眼的「上传 .md 文件」功能入口。

***

### 文件变更清单

| 文件                                            | 操作        | 说明                           |
| --------------------------------------------- | --------- | ---------------------------- |
| `server/api/admin/save-post.post.ts`          | **新增**    | 将处理后的 .md 写入 `content/blog/` |
| `server/api/admin/upload-and-process.post.ts` | **新增**    | 上传 .md → 处理图片 → 保存一站式 API    |
| `app/pages/admin/posts/new.vue`               | **重写/重构** | 新增上传区域 +「上传并保存」交互逻辑          |
| `app/pages/admin/posts.vue`                   | **微调**    | 搜索和列表使用 `path` 替代 `id` 作为链接  |
| `server/api/blog/posts.get.ts`                | **不需要改**  | 已有的 queryCollection 自动包含新文件  |

***

### 时序图

```
用户             浏览器(vue)              Server API              ImgBed
 │                  │                       │                      │
 │ 拖拽/选择.md文件  │                       │                      │
 │─────────────────>│                       │                      │
 │                  │ 读取 localStorage      │                      │
 │                  │ 获取图床配置           │                      │
 │                  │                       │                      │
 │  点击上传按钮     │                       │                      │
 │─────────────────>│                       │                      │
 │                  │  POST /api/admin/      │                      │
 │                  │  upload-and-process    │                      │
 │                  │  (multipart/form-data) │                      │
 │                  │──────────────────────>│                      │
 │                  │                       │  读取文件内容         │
 │                  │                       │  提取图片路径         │
 │                  │                       │                      │
 │                  │                       │  POST /upload        │
 │                  │                       │  (图片1,重试3次)      │
 │                  │                       │─────────────────────>│
 │                  │                       │  返回图床URL         │
 │                  │                       │<─────────────────────│
 │                  │                       │  ...（每张图片重复）  │
 │                  │                       │                      │
 │                  │                       │  替换所有本地路径     │
 │                  │                       │  写入 content/blog/  │
 │                  │                       │                      │
 │                  │  { success, path,     │                      │
 │                  │    uploadedCount }     │                      │
 │                  │<──────────────────────│                      │
 │                  │                       │                      │
 │  跳转文章列表页   │                       │                      │
 │<─────────────────│                       │                      │
 │                  │                       │                      │
 │  列表页查询       │  GET /api/blog/posts  │                      │
 │─────────────────>│──────────────────────>│                      │
 │                  │                       │  queryCollection     │
 │                  │                       │  返回含新文章        │
 │                  │<──────────────────────│                      │
 │                  │  渲染列表             │                      │
```

***

### 需要确认的事项

1. **安全性**：`.md` 文件中可能包含不可控内容，服务端写入 `content/blog/` 时是否需要额外的内容校验？
2. **文件名冲突**：如果 `content/blog/` 已存在同名 `.md` 文件，应覆盖还是报错？（建议：默认覆盖，返回提示）
3. **frontmatter 完整性**：上传的 .md 文件如果没有 frontmatter（如无 `title`、`date`），`queryCollection` 会返回 `null`/报错 → 前端是否需要校验后再保存？
4. **图床 Token**：目前前端从 localStorage 读取后传给服务端，还是希望在服务端 DB/环境变量中存一份？

