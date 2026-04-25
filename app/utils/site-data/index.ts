/**
 * 站点静态配置数据统一导出 (site-data/index.ts)
 *
 * 耦合关系：
 *   - app/site.config.ts → 从此文件导入所有数据定义
 *   - app/stores/site.ts → 从此模块导入数据初始化 state
 *
 * 说明：
 *   所有数据定义已迁移至 app/site.config.ts，
 *   此模块仅负责 re-export，保持向后兼容。
 */

export {
  brandConfig,
  navigationItems,
  contactOrder,
  contactsData,
  homeConfig,
  aboutConfig,
  gameLifeConfig,
  blogConfig,
  footerConfig,
  techStack,
} from "../../site.config";
