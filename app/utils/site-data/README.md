# site-data

站点静态配置数据的 re-export 层，保持向后兼容。

## 数据定义位置

所有数据定义已迁移至 **`app/site.config.ts`**，本目录不再存放任何数据定义。

## 当前文件

- `index.ts`：从 `site.config.ts` 统一 re-export，保持 `~/utils/site-data` 导入路径不变

## 已迁移文件

以下文件已删除，数据定义均在 `site.config.ts` 中：

| 原文件 | 导出项 |
|--------|--------|
| `brand.ts` | `brandConfig` |
| `navigation.ts` | `navigationItems`, `contactOrder` |
| `contacts.ts` | `contactsData` |
| `home.ts` | `homeConfig` |
| `about.ts` | `aboutConfig` |
| `gameLife.ts` | `gameLifeConfig` |
| `blog.ts` | `blogConfig` |
| `footer.ts` | `footerConfig`, `techStack` |

## 边界

- 数据定义：`app/site.config.ts`
- re-export 兼容层：本目录
- 运行时 UI 状态：`app/stores/site.ts`
- 博客文章正文：根目录 `content/blog`

## 使用方式

导入路径不变：

```ts
import { brandConfig, blogConfig } from "~/utils/site-data";
```
