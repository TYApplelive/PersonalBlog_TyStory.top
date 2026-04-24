/**
 * Markdown 图片路径解析工具 (shared/utils/markdown-parser.ts)
 *
 * 两端共用（app + server），放在 shared/ 目录下自动被两端访问。
 *
 * 耦合关系：
 *   - server/utils/markdown-image-processor.ts         → 调用 extractImages / getLocalImages / replaceImagePath
 *   - server/api/admin/upload-and-process.post.ts       → 直接调用 extractImages / getLocalImages / replaceImagePath
 *   - app/pages/admin/md-images.vue                     → 前端调用 extractImages / getLocalImages
 *
 * 导出函数表：
 *   - extractImages(content)              → 从 Markdown 内容中提取所有图片信息
 *   - getLocalImages(images)              → 筛选出需要上传的本地图片
 *   - replaceImagePath(content, old, new) → 替换 Markdown 中的图片路径
 *   - ExtractedImage (类型)               → 提取的图片数据结构
 */

// 图片路径正则表达式
const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

// 提取的图片数据结构
export interface ExtractedImage {
  fullMatch: string;
  altText: string;
  path: string;
  pathType: 'absolute' | 'relative' | 'remote';
}

// 分类图片路径类型
function classifyPath(path: string): 'absolute' | 'relative' | 'remote' {
  if (/^https?:\/\//.test(path)) return 'remote';
  // windows 
  if (/^[A-Z]:[\\/]/.test(path)) return 'absolute';
  // Linux/MacOS
  if (path.startsWith('/')) return 'absolute';
  return 'relative';
}

// 从 Markdown 内容中提取所有图片信息
export function extractImages(content: string): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  IMAGE_REGEX.lastIndex = 0;

  let match;
  while ((match = IMAGE_REGEX.exec(content)) !== null) {
    const [, altText, path] = match;
    images.push({
      fullMatch: match[0],
      altText: altText || '',
      path: path || '',
      pathType: classifyPath(path || ''),
    });
  }

  return images;
}

// 筛选出需要上传的本地图片
export function getLocalImages(images: ExtractedImage[]): ExtractedImage[] {
  return images.filter(img => img.pathType !== 'remote');
}

// 替换 Markdown 中的图片路径
export function replaceImagePath(
  content: string,
  oldPath: string,
  newPath: string,
): string {
  const escapedPath = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`!\\[([^\\]]*)\\]\\(${escapedPath}\\)`, 'g');
  return content.replace(regex, (match, alt) => `![${alt}](${newPath})`);
}
