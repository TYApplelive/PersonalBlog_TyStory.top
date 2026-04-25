# 新建文章 Frontmatter 编辑功能工作文档

## 功能说明

本次功能用于增强后台新建文章页面 `http://localhost:3000/admin/posts/new`。

用户上传 Markdown 文件后，页面会自动解析文件顶部的 frontmatter，只提取当前博客内容模型中定义的字段，并显示在独立输入框中。用户可以在保存前直接修改这些元信息，页面不会把正文内容展示在 frontmatter 输入框里。

保存时，系统会用输入框中的值重新生成 frontmatter，再拼接原 Markdown 正文，然后进入原有图片处理与文章保存流程。

## 字段规则

字段定义来源于 `content.config.ts` 中的 `blog` collection。

| 字段 | 是否必填 | 输入方式 | 说明 |
| --- | --- | --- | --- |
| `title` | 必填 | 单行输入框 | 文章标题。 |
| `date` | 必填 | 单行输入框 | 文章日期，按字符串处理，建议格式为 `YYYY-MM-DD`。 |
| `description` | 必填 | 多行输入框 | 文章摘要，会用于列表页和 SEO 描述。 |
| `readTime` | 必填 | 单行输入框 | 阅读时长，例如 `6 min`。 |
| `tags` | 非必填 | 逗号分隔输入框 | 多个标签用英文逗号分隔，例如 `Nuxt, Vue, SSR`。 |

如果上传文件缺少某个 frontmatter 字段，对应输入框会显示为空。用户点击保存时，系统会校验 `title`、`date`、`description`、`readTime`，只要其中任意一项为空，就会弹出提示并停止保存。

`tags` 是可选字段。为空时，保存后的 Markdown frontmatter 中不会写入 `tags`。

## 保存流程

1. 用户拖拽或选择 `.md` / `.markdown` 文件。
2. 浏览器读取 Markdown 文件内容。
3. 页面解析 frontmatter 和正文。
4. 页面把 `title`、`date`、`description`、`readTime`、`tags` 显示到输入框。
5. 用户可以修改这些字段。
6. 用户点击 `Save`。
7. 页面校验必填字段。
8. 校验通过后，页面按固定顺序重新生成 frontmatter：
   - `title`
   - `date`
   - `description`
   - `readTime`
   - `tags`
9. 页面将新 frontmatter 与原正文重新组合。
10. 如果正文中存在本地图片，页面调用 `/api/process-markdown` 处理 Markdown 图片引用。
11. 如果没有本地图片，页面会跳过图片处理，直接保存 Markdown。
12. 页面调用 `/api/admin/save-post` 保存文章。
13. 服务端把最终 Markdown 写入 `content/blog/{filename}.md`。

## 文件名空格规则

本次修改允许上传和保存带空格的 Markdown 文件名。

示例：

```text
My First Post.md
```

保存后文件路径为：

```text
content/blog/My First Post.md
```

浏览器访问时，空格会按 URL 规则编码，例如：

```text
/blog/My%20First%20Post
```

服务端仍然会阻止不安全文件名。当前允许的文件名字符包括：

- 英文字母
- 数字
- 空格
- 短横线 `-`
- 下划线 `_`

服务端会自动裁剪文件名前后的空格，防止生成首尾带空格的文件名。

## 测试步骤

### 完整 frontmatter

上传包含完整 frontmatter 的 Markdown：

```md
---
title: Demo
date: 2026-04-25
description: Demo desc
readTime: 5 min
tags: [Nuxt, Vue]
---

# Demo
```

预期结果：

- 输入框正确显示所有字段。
- `tags` 显示为 `Nuxt, Vue`。
- 修改输入框后，右侧预览显示新的 frontmatter。
- 点击保存后，写入的文章使用修改后的 frontmatter。

### 缺少必填字段

上传缺少 `title`、`date`、`description` 或 `readTime` 的 Markdown。

预期结果：

- 缺失字段对应输入框为空。
- 点击保存后出现必填提示。
- 不会调用保存接口写入文章。

### 缺少 tags

上传不包含 `tags` 的 Markdown。

预期结果：

- `tags` 输入框为空。
- 保存成功。
- 保存后的 frontmatter 不包含 `tags` 字段。

### 带空格文件名

上传文件：

```text
My First Post.md
```

预期结果：

- Target filename 自动填入 `My First Post`。
- 点击保存成功。
- 服务端写入 `content/blog/My First Post.md`。
- 返回路径为 `/blog/My First Post`，浏览器实际访问时会自动编码空格。

## 注意事项

- 页面只管理 `content.config.ts` 中定义的字段。
- 上传文件中的其他未知 frontmatter 字段不会被保留。
- `date` 目前按字符串保存，不做严格日期合法性校验。
- 正文内容不会显示在 frontmatter 输入框中，但会在输出预览中展示最终 Markdown。
- 图片处理流程仍沿用原有 `/api/process-markdown` 和图床配置。
- 没有本地图片时不需要图床 Token，文章可以直接保存。
