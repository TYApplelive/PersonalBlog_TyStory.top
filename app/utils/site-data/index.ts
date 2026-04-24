/**
 * 站点静态配置数据统一导出 (site-data/index.ts)
 *
 * 耦合关系：
 *   - stores/site.ts → 导入所有配置模块
 */

export { brandConfig } from "./brand";
export { navigationItems, adminNavItem, contactOrder } from "./navigation";
export { contactsData } from "./contacts";
export { homeConfig } from "./home";
export { aboutConfig } from "./about";
export { gameLifeConfig } from "./gameLife";
export { blogConfig } from "./blog";
export { footerConfig, techStack } from "./footer";
