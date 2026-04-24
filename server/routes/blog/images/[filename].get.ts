import { join } from "node:path";
import { readFile, stat } from "node:fs/promises";
import { extname } from "node:path";

const IMAGES_DIR = "content/blog/images";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export default defineEventHandler(async (event) => {
  const filename = event.context.params?.filename;

  if (!filename || filename.includes("..") || filename.includes("/")) {
    throw createError({ statusCode: 400, statusMessage: "Invalid filename" });
  }

  const filePath = join(process.cwd(), IMAGES_DIR, filename);

  try {
    await stat(filePath);
  } catch {
    throw createError({ statusCode: 404, statusMessage: "Image not found" });
  }

  const ext = extname(filename).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  const buffer = await readFile(filePath);

  setResponseHeader(event, "Content-Type", contentType);
  setResponseHeader(event, "Cache-Control", "public, max-age=86400");

  return buffer;
});
