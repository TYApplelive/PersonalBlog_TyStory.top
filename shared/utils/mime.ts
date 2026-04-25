/**
 * MIME 类型映射 (mime.ts)
 *
 * 耦合关系：
 *   - server/utils/image-upload.ts              → 导入 getMimeType
 *   - server/routes/blog/images/[filename].get.ts → 导入 getMimeType
 *
 * 导出函数表：
 *   - getMimeType(filename) → 根据文件扩展名返回 MIME 类型
 *   - MIME_TYPE_MAP         → MIME 类型映射表（只读）
 */

export const MIME_TYPE_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export function getMimeType(filename: string): string {
  const ext = filename.includes(".") ? `.${filename.split(".").pop()!.toLowerCase()}` : "";
  return MIME_TYPE_MAP[ext] ?? "application/octet-stream";
}
