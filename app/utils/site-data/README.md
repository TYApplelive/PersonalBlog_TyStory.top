# site-data

这里存放站点静态配置，不存放运行时状态。

## 文件职责

- `brand.ts`：品牌信息
- `navigation.ts`：导航项和联系方式顺序
- `contacts.ts`：联系方式数据
- `home.ts`：首页文案和技术卡片配置
- `about.ts`：关于页文案和灵感数据
- `gameLife.ts`：游戏抽屉静态配置
- `blog.ts`：博客页面展示配置
- `footer.ts`：页脚和技术栈配置
- `index.ts`：统一导出

## 边界

- 静态文案和配置放在这里
- 运行时 UI 状态放在 `app/stores/site.ts`
- 博客文章正文放在根目录 `content/blog`

## 使用方式

```ts
import { brandConfig, blogConfig } from "~/utils/site-data";
```
