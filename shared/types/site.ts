/**
 * 站点类型定义 (site.ts)
 *
 * 耦合关系：
 *   - app/stores/site.ts          → 导入所有类型定义
 *   - app/utils/site-data/*.ts    → 导入类型定义（不再反向依赖 store）
 *   - app/site.config.ts          → 导入类型定义
 *   - app/pages/*.vue             → 导入类型定义
 *   - app/components/*.vue        → 导入类型定义
 *   - server/utils/*.ts           → 导入类型定义
 *
 * 导出类型表：
 *   - ContactKey           → 联系方式键名联合类型
 *   - SiteNavItem          → 导航菜单项
 *   - SiteAction           → 操作按钮
 *   - SiteAboutChapter     → 关于页章节
 *   - ContactItem          → 联系方式
 *   - TechCard             → 技术卡片
 *   - InspirationItem      → 灵感项
 *   - GameEntry            → 游戏条目
 *   - ScatterSlot          → 分散位置槽
 *   - BlogOrnament         → 博客装饰
 *   - BlogPost             → 博客文章（统一类型）
 *   - BrandConfig          → 品牌配置
 */

export type ContactKey = "github" | "qq" | "wechat";

export interface SiteNavItem {
  label: string;
  to: string;
}

export interface SiteAction {
  label: string;
  to: string;
  variant: "primary" | "secondary";
}

export interface SiteAboutChapter {
  label: string;
  title: string;
  body: string;
}

export interface ContactItem {
  label: string;
  value: string;
  href?: string;
}

export interface TechCard {
  id: string;
  kicker: string;
  title: string;
  summary: string;
  status: string;
}

export interface InspirationItem {
  id: string;
  type: "movie" | "music" | "book" | "quote";
  title: string;
  subtitle?: string;
  description: string;
  year?: string;
}

export interface GameEntry {
  id: string;
  title: string;
  genre: string;
  hours: string;
  years: string;
  hook: string;
  intro: string;
  note: string;
  lane: 1 | 2 | 3;
  order: number;
  angle: string;
  x: number;
  y: number;
  zIndex: number;
  sizeVariant?: "wide";
}

export interface ScatterSlot {
  x: number;
  y: number;
  angle: string;
}

export interface BlogOrnament {
  id: string;
  label: string;
  value: string;
}

export interface BlogPost {
  title: string;
  date: string;
  excerpt?: string;
  description?: string;
  content?: string;
  readTime: string;
  tags: string[];
  path: string;
  stem?: string;
}

export interface BrandConfig {
  title: string;
  owner: string;
  alias: string;
  eyebrow: string;
}
