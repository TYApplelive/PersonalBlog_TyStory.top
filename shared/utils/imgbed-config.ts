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
 *   - getImgBedConfig()                   → 从 localStorage 读取并解密配置
 *   - saveImgBedConfig(config)            → 加密并保存配置到 localStorage
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
  token: 'imgbed_l0q2yJ3zhlmUoupFiwroVO1ntflP8C9e',
};

// 从 Nuxt runtime config 获取盐值
function getConfigSalt(): string {
  if (typeof window === 'undefined') return process.env.IMG_BED_CONFIG_SALT || 'default-salt-change-me';
  // 在浏览器端，通过 window.__NUXT__ 获取 runtime config
  const config = (window as any).__NUXT__?.config?.public;
  return config?.imgBedConfigSalt || 'default-salt-change-me';
}

// 从盐值派生加密密钥
async function deriveKey(salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(salt),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('imgbed-config-iv'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// 加密数据
async function encryptData(data: string, salt: string): Promise<string> {
  const key = await deriveKey(salt);
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data),
  );

  // 将 IV 和加密数据拼接为 base64
  const result = new Uint8Array(iv.length + (encrypted as ArrayBuffer).byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...result));
}

// 解密数据
async function decryptData(encryptedBase64: string, salt: string): Promise<string> {
  const key = await deriveKey(salt);
  const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = encrypted.slice(0, 12);
  const data = encrypted.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  );

  return new TextDecoder().decode(decrypted);
}

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

// 从 localStorage 读取并解密配置
export async function getImgBedConfig(): Promise<ImgBedConfig> {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;

  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const salt = getConfigSalt();
      const decrypted = await decryptData(stored, salt);
      return { ...DEFAULT_CONFIG, ...JSON.parse(decrypted) };
    }
  } catch (error) {
    // 解密失败或数据损坏，返回默认配置
    console.error('Error decrypting or parsing imgbed config:', error);
    return DEFAULT_CONFIG;
  }

  return DEFAULT_CONFIG;
}

// 加密并保存配置到 localStorage
export async function saveImgBedConfig(config: Partial<ImgBedConfig>): Promise<void> {
  if (typeof window === 'undefined') return;
  const current = await getImgBedConfig();
  const salt = getConfigSalt();
  const data = JSON.stringify({ ...current, ...config });
  const encrypted = await encryptData(data, salt);
  localStorage.setItem(CONFIG_KEY, encrypted);
}

// 重置配置
export function resetImgBedConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CONFIG_KEY);
}
