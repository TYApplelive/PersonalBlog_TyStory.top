/**
 * 图片扫描工具 (server/utils/image-scanner.ts)
 *
 * 阶段①：快速扫描所有文章中的非云端图片地址
 * 仅读取文件 + 正则匹配，不做任何上传/替换，预期耗时 <1s
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { extractImages, getLocalImages } from '#shared/utils/markdown-parser';
import { createModuleLogger } from '#shared/utils/logger';

const log = createModuleLogger('imgScan');

export interface ScanItem {
  postPath: string;
  stem: string;
  localImages: Array<{ path: string; pathType: string }>;
}

export interface ScanResult {
  totalPosts: number;
  postsWithLocalImages: number;
  totalLocalImages: number;
  items: ScanItem[];
}

/**
 * 并发扫描所有文章，提取非云端图片地址
 * @param stems - 文件 stem 列表（如 ['blog/1.nuxt-guide', 'blog/2.vue-composition']）
 */
export async function scanLocalImagesInPosts(stems: string[]): Promise<ScanResult> {
  const contentDir = resolve(process.cwd(), 'content');
  const items: ScanItem[] = [];
  let totalLocalImages = 0;

  // 并发读取所有文章
  const tasks = stems.map(async (stem) => {
    const filePath = resolve(contentDir, `${stem}.md`);
    try {
      const content = await readFile(filePath, 'utf-8');
      const allImages = extractImages(content);
      const localImages = getLocalImages(allImages);

      if (localImages.length > 0) {
        log.debug(`[${stem}] 发现 ${localImages.length} 张本地图片`);
        return {
          postPath: `/blog/${stem.split('/').pop()}`,
          stem,
          localImages: localImages.map(img => ({ path: img.path, pathType: img.pathType })),
        };
      }
      return null;
    } catch (err) {
      log.warn(`[${stem}] 读取失败: ${(err as Error).message}`);
      return null;
    }
  });

  const results = await Promise.all(tasks);

  for (const item of results) {
    if (item) {
      items.push(item);
      totalLocalImages += item.localImages.length;
    }
  }

  log.info(`扫描完成: ${stems.length} 篇文章, ${items.length} 篇含本地图片, 共 ${totalLocalImages} 张`);

  return {
    totalPosts: stems.length,
    postsWithLocalImages: items.length,
    totalLocalImages,
    items,
  };
}
