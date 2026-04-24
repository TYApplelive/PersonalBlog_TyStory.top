/**
 * Shared markdown image processing for upload/replace flows.
 */
import { readFile } from "node:fs/promises";
import { basename, isAbsolute, resolve } from "node:path";
import type { ImgBedConfig } from "#shared/utils/imgbed-config";
import { uploadToImgBed } from "./image-upload";
import { replaceImagePath, extractImages, getLocalImages } from "#shared/utils/markdown-parser";

export interface ProcessErrorItem {
  path: string;
  error: string;
}

export interface ProcessResult {
  success: boolean;
  processedContent: string;
  totalImages: number;
  localImages: number;
  processedCount: number;
  uploadedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: ProcessErrorItem[];
}

interface ProcessOptions {
  baseDir?: string;
  onProgress?: (processedCount: number, totalLocalImages: number) => void;
}

async function tryReadFile(filePath: string): Promise<Buffer | null> {
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

async function resolveLocalImageBuffer(imgPath: string, baseDir?: string): Promise<Buffer | null> {
  const candidates = new Set<string>();

  if (isAbsolute(imgPath)) {
    candidates.add(imgPath);
  } else {
    if (baseDir) candidates.add(resolve(baseDir, imgPath));
    candidates.add(resolve(process.cwd(), imgPath));
    candidates.add(resolve(process.cwd(), "content", "blog", imgPath));
    candidates.add(resolve(process.cwd(), "content", imgPath));
  }

  const imageName = basename(imgPath);
  if (imageName) {
    candidates.add(resolve(process.cwd(), "content", "blog", "images", imageName));
  }

  for (const candidate of candidates) {
    const buffer = await tryReadFile(candidate);
    if (buffer) return buffer;
  }

  return null;
}

export async function processMarkdownImages(
  content: string,
  imgBedConfig: ImgBedConfig,
  options: ProcessOptions = {},
): Promise<ProcessResult> {
  const allImages = extractImages(content);
  const localImages = getLocalImages(allImages);
  const errors: ProcessErrorItem[] = [];

  let processedContent = content;
  let processedCount = 0;
  let uploadedCount = 0;
  let skippedCount = 0;

  for (const image of localImages) {
    try {
      const fileBuffer = await resolveLocalImageBuffer(image.path, options.baseDir);

      if (!fileBuffer) {
        skippedCount += 1;
        errors.push({ path: image.path, error: "Image file not found" });
        continue;
      }

      const imageName = basename(image.path) || "image.jpg";
      const uploadResult = await uploadToImgBed(fileBuffer, imageName, imgBedConfig);

      if (!uploadResult.success || !uploadResult.url) {
        skippedCount += 1;
        errors.push({ path: image.path, error: uploadResult.error || "Upload failed" });
        continue;
      }

      processedContent = replaceImagePath(processedContent, image.path, uploadResult.url);
      uploadedCount += 1;
    } catch (error: any) {
      skippedCount += 1;
      errors.push({ path: image.path, error: error?.message || "Process failed" });
    } finally {
      processedCount += 1;
      options.onProgress?.(processedCount, localImages.length);
    }
  }

  return {
    success: true,
    processedContent,
    totalImages: allImages.length,
    localImages: localImages.length,
    processedCount,
    uploadedCount,
    skippedCount,
    failedCount: errors.length,
    errors,
  };
}
