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

export type ContactKey = "github" | "qq" | "wechat";

export const contactOrder: ContactKey[] = ["github", "qq", "wechat"];