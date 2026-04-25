import { join } from "node:path";
import { readFile, stat } from "node:fs/promises";
import { getMimeType } from "#shared/utils/mime";

const IMAGES_DIR = "content/blog/images";

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

  const contentType = getMimeType(filename);

  const buffer = await readFile(filePath);

  setResponseHeader(event, "Content-Type", contentType);
  setResponseHeader(event, "Cache-Control", "public, max-age=86400");

  return buffer;
});
