/**
 * CloudFlare 图床客户端配置 (app/utils/imgbed-config.ts)
 *
 * 耦合关系：
 *   - shared/utils/imgbed-config.ts       → 导入类型和纯函数（两端共用）
 *   - app/pages/admin/imgbed-manager.vue  → 使用全部导出项
 *   - app/pages/admin/md-images.vue       → 使用 getImgBedConfig
 *
 * 导出函数表：
 *   以下从 shared/utils/imgbed-config 再导出：
 *   - normalizeImgBedBaseUrl(url)         → 去除末尾斜杠，规范化 URL
 *   - buildImgBedUrl(url, path, query?)   → 拼接完整图床请求 URL
 *   - buildImgBedAuthHeaders(token)       → 构建 Bearer 鉴权头
 *   - resolveImgBedSrc(url, src)          → 解析图片资源完整路径
 *   - ImgBedConfig (类型)                 → 图床配置数据结构
 *
 *   以下为本文件独有（仅客户端可用）：
 *   - getImgBedConfig()                   → 从 localStorage 读取配置
 *   - saveImgBedConfig(config)            → 保存配置到 localStorage
 *   - resetImgBedConfig()                 → 清除 localStorage 配置
 */

// 从 shared 导入类型和纯函数
import {
  normalizeImgBedBaseUrl,
  buildImgBedUrl,
  buildImgBedAuthHeaders,
  resolveImgBedSrc,
  type ImgBedConfig,
} from '../../shared/utils/imgbed-config';

// 再导出，使客户端代码可从 ~/utils/imgbed-config 统一导入
export { normalizeImgBedBaseUrl, buildImgBedUrl, buildImgBedAuthHeaders, resolveImgBedSrc, type ImgBedConfig };

const CONFIG_KEY = 'imgbed_config';

const DEFAULT_CONFIG: ImgBedConfig = {
  apiUrl: 'https://ty-imgbed.pages.dev',
  token: '',
};

export function getImgBedConfig(): ImgBedConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;

  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch {
  }

  return DEFAULT_CONFIG;
}

export function saveImgBedConfig(config: Partial<ImgBedConfig>): void {
  if (typeof window === 'undefined') return;
  const current = getImgBedConfig();
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...current, ...config }));
}

export function resetImgBedConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CONFIG_KEY);
}
