/**
 * 导航菜单配置数据
 */

export interface SiteNavItem {
  label: string;
  to: string;
}

export const navigationItems: SiteNavItem[] = [
  { label: "首页", to: "/" },
  { label: "关于", to: "/about" },
  { label: "博客", to: "/blog" },
];

// 管理工具入口 (仅开发环境显示)
export const adminNavItem: SiteNavItem | null = import.meta.dev
  ? { label: "管理", to: "/admin" }
  : null;

export type ContactKey = "github" | "qq" | "wechat";

export const contactOrder: ContactKey[] = ["github", "qq", "wechat"];