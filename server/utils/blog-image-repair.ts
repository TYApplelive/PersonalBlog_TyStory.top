import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, parse } from "node:path";
import type { ImgBedConfig } from "#shared/utils/imgbed-config";
import { uploadToImgBed } from "./image-upload";
import { normalizeImgBedBaseUrl } from "#shared/utils/imgbed-config";
import { extractImages, replaceImagePath } from "#shared/utils/markdown-parser";

interface RepairErrorItem {
  postPath: string;
  imagePath: string;
  error: string;
}

export interface RepairBlogImagesResult {
  scannedPosts: number;
  localImageCount: number;
  fixedCount: number;
  updatedPosts: string[];
  errors: RepairErrorItem[];
}

const BLOG_DIR = join(process.cwd(), "content", "blog");
const BLOG_IMAGE_DIR = join(BLOG_DIR, "images");

function isMarkdownFile(fileName: string) {
  return fileName.endsWith(".md");
}

function isImgBedUrl(url: string, apiUrl: string) {
  return /^https?:\/\//i.test(url) && url.startsWith(normalizeImgBedBaseUrl(apiUrl));
}

async function listBlogMarkdownFiles() {
  const entries = await readdir(BLOG_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && isMarkdownFile(entry.name))
    .map((entry) => join(BLOG_DIR, entry.name));
}

async function tryReadBuffer(filePath: string) {
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

async function resolveRepairBuffer(imagePath: string) {
  const normalizedPath = imagePath.split("?")[0] || imagePath;
  const imageName = basename(normalizedPath);
  const fromImageDir = imageName ? await tryReadBuffer(join(BLOG_IMAGE_DIR, imageName)) : null;
  if (fromImageDir) return { buffer: fromImageDir, filename: imageName };

  if (/^https?:\/\//i.test(imagePath)) {
    return null;
  }

  const fromOriginalPath = await tryReadBuffer(imagePath);
  if (fromOriginalPath) {
    return { buffer: fromOriginalPath, filename: imageName || basename(imagePath) };
  }

  return null;
}

export async function repairBlogMarkdownImages(imgBedConfig: ImgBedConfig): Promise<RepairBlogImagesResult> {
  const markdownFiles = await listBlogMarkdownFiles();
  const errors: RepairErrorItem[] = [];
  const updatedPosts = new Set<string>();
  let localImageCount = 0;
  let fixedCount = 0;

  for (const markdownFile of markdownFiles) {
    const originalContent = await readFile(markdownFile, "utf-8");
    const extractedImages = extractImages(originalContent);
    let nextContent = originalContent;
    let changed = false;

    for (const image of extractedImages) {
      if (isImgBedUrl(image.path, imgBedConfig.apiUrl)) {
        continue;
      }

      localImageCount += 1;
      const resolvedImage = await resolveRepairBuffer(image.path);

      if (!resolvedImage) {
        errors.push({
          postPath: markdownFile,
          imagePath: image.path,
          error: "Image not found in content/blog/images or original path",
        });
        continue;
      }

      const uploadResult = await uploadToImgBed(resolvedImage.buffer, resolvedImage.filename, imgBedConfig);
      if (!uploadResult.success || !uploadResult.url) {
        errors.push({
          postPath: markdownFile,
          imagePath: image.path,
          error: uploadResult.error || "Upload failed",
        });
        continue;
      }

      nextContent = replaceImagePath(nextContent, image.path, uploadResult.url);
      fixedCount += 1;
      changed = true;
    }

    if (changed && nextContent !== originalContent) {
      await writeFile(markdownFile, nextContent, "utf-8");
      updatedPosts.add(`/blog/${parse(markdownFile).name.replace(/^\d+\./, "")}`);
    }
  }

  return {
    scannedPosts: markdownFiles.length,
    localImageCount,
    fixedCount,
    updatedPosts: [...updatedPosts],
    errors,
  };
}
