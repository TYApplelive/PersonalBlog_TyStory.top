import type { ImgBedConfig } from "#shared/utils/imgbed-config";
import { buildImgBedAuthHeaders, buildImgBedUrl, resolveImgBedSrc } from "#shared/utils/imgbed-config";

const UPLOAD_CONFIG = {
  timeout: 15000,
  maxRetries: 3,
  retryDelay: 1000,
};

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };

  return mimeTypes[ext] || "image/jpeg";
}

function extractUploadedUrl(data: unknown, apiUrl: string): string | undefined {
  if (typeof data === "string") {
    return data.startsWith("http") ? data : resolveImgBedSrc(apiUrl, data);
  }

  if (Array.isArray(data)) {
    const first = data[0] as { src?: string; url?: string } | undefined;
    const src = first?.src ?? first?.url;
    return src ? resolveImgBedSrc(apiUrl, src) : undefined;
  }

  if (data && typeof data === "object") {
    const payload = data as {
      url?: string;
      src?: string;
      data?: { url?: string; src?: string } | string;
    };

    const src = payload.url ?? payload.src;
    if (src) return resolveImgBedSrc(apiUrl, src);
    if (typeof payload.data === "string") return resolveImgBedSrc(apiUrl, payload.data);
    if (payload.data && typeof payload.data === "object") {
      const nested = payload.data.url ?? payload.data.src;
      if (nested) return resolveImgBedSrc(apiUrl, nested);
    }
  }

  return undefined;
}

export async function uploadToImgBed(
  fileBuffer: Buffer,
  filename: string,
  config: ImgBedConfig,
): Promise<UploadResult> {
  let lastError: Error | null = null;
  const uploadUrl = buildImgBedUrl(config.apiUrl, "/upload", { returnFormat: "full" });

  for (let attempt = 1; attempt <= UPLOAD_CONFIG.maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_CONFIG.timeout);

    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: getMimeType(filename) });
      formData.append("file", blob, filename);

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: buildImgBedAuthHeaders(config.token),
        body: formData,
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const message = typeof data === "object" && data
          ? ((data as { error?: string; message?: string }).error
            ?? (data as { message?: string }).message
            ?? `HTTP ${response.status}`)
          : String(data);
        throw new Error(message);
      }

      const url = extractUploadedUrl(data, config.apiUrl);
      if (!url) {
        throw new Error("Upload succeeded but image URL was not found");
      }

      clearTimeout(timeoutId);
      return { success: true, url };
    } catch (error) {
      lastError = error as Error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (attempt < UPLOAD_CONFIG.maxRetries) {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, UPLOAD_CONFIG.retryDelay * attempt));
    }
  }

  return { success: false, error: lastError?.message || "Unknown upload error" };
}
