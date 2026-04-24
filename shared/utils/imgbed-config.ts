/**
 * Shared img bed helpers.
 * Pure URL/header helpers stay shared; config read/write goes through server APIs.
 */
export interface ImgBedConfig {
  apiUrl: string;
  token: string;
}

export function normalizeImgBedBaseUrl(apiUrl: string): string {
  return apiUrl.trim().replace(/\/+$/, "");
}

export function buildImgBedUrl(
  apiUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const baseUrl = normalizeImgBedBaseUrl(apiUrl);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}${cleanPath}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
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
  return `${baseUrl}${src.startsWith("/") ? src : `/${src}`}`;
}

export async function getImgBedConfig(): Promise<ImgBedConfig> {
  return await $fetch<ImgBedConfig>("/api/admin/imgbed-config");
}

export async function saveImgBedConfig(config: Partial<ImgBedConfig>): Promise<ImgBedConfig> {
  return await $fetch<ImgBedConfig>("/api/admin/imgbed-config", {
    method: "POST",
    body: config,
  });
}

export async function resetImgBedConfig(): Promise<ImgBedConfig> {
  return await $fetch<ImgBedConfig>("/api/admin/imgbed-config", {
    method: "DELETE",
  });
}
