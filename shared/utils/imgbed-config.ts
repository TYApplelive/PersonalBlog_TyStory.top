/**
 * CloudFlare 图床配置与工具 (shared/utils/imgbed-config.ts)
 *
 * 两端共用（app + server），shared/utils 下文件自动导入，无需显式 import。
 *
 * 导出函数表：
 *   - normalizeImgBedBaseUrl(url)         → 去除末尾斜杠，规范化 URL
 *   - buildImgBedUrl(url, path, query?)   → 拼接完整图床请求 URL
 *   - buildImgBedAuthHeaders(token)       → 构建 Bearer 鉴权头
 *   - resolveImgBedSrc(url, src)          → 解析图片资源完整路径
 *   - getImgBedConfig()                   → 从 localStorage 读取配置
 *   - saveImgBedConfig(config)            → 保存配置到 localStorage
 *   - resetImgBedConfig()                 → 清除 localStorage 配置
 *   - ImgBedConfig (类型)                 → 图床配置数据结构
 */

// 图床配置数据结构
export interface ImgBedConfig {
  apiUrl: string;
  token: string;
}

const CONFIG_KEY = 'imgbed_config';

const DEFAULT_CONFIG: ImgBedConfig = {
  apiUrl: 'https://ty-imgbed.pages.dev',
  token: '',
};

export function normalizeImgBedBaseUrl(apiUrl: string): string {
  return apiUrl.trim().replace(/\/+$/, '');
}

export function buildImgBedUrl(
  apiUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const baseUrl = normalizeImgBedBaseUrl(apiUrl);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl}${cleanPath}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export function buildImgBedAuthHeaders(token: string): HeadersInit {
  const normalizedToken = token.trim();
  return normalizedToken ? { Authorization: `Bearer ${normalizedToken}` } : {};
}

export function resolveImgBedSrc(apiUrl: string, src: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  const baseUrl = normalizeImgBedBaseUrl(apiUrl);
  return `${baseUrl}${src.startsWith('/') ? src : `/${src}`}`;
}

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
