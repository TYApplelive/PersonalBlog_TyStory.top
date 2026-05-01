/**
 * POST /api/admin/tags/delete — 从所有文章的 frontmatter 中移除指定标签
 *
 * 请求体：{ tag: string }
 * 响应：{ success: boolean, removedFrom: number }
 *
 * 此操作会直接修改 content/blog/ 下的 .md 文件，
 * 从每篇包含该标签的文章的 frontmatter tags 数组中移除该标签。
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { requireAdminSession } from "@serverUtils/auth";
import { parseMarkdownForEditor, buildMarkdownWithFrontmatter } from "#shared/utils/post-frontmatter";
import { glob } from "node:fs/promises";

/** 读取 content/blog/ 下所有 .md 文件路径 */
async function getBlogFiles(): Promise<string[]> {
  const blogDir = join(process.cwd(), "content", "blog");
  const files: string[] = [];
  try {
    const entries = await glob("**/*.md", { cwd: blogDir });
    for (const entry of entries) {
      files.push(join(blogDir, entry));
    }
  } catch {
    console.warn("[Tag Delete] 无法遍历 content/blog/ 目录");
  }
  return files;
}

export default defineEventHandler(async (event) => {
  await requireAdminSession(event);

  const body = await readBody(event);
  const tagToDelete = body?.tag?.trim();

  if (!tagToDelete) {
    throw createError({
      statusCode: 400,
      message: "请提供要删除的标签名称 (tag)",
    });
  }

  console.log(`[Tag Delete] 开始删除标签: "${tagToDelete}"`);

  const files = await getBlogFiles();
  let removedFrom = 0;
  const errors: string[] = [];

  for (const filePath of files) {
    try {
      const content = await readFile(filePath, "utf-8");
      const parsed = parseMarkdownForEditor(content);
      const currentTags: string[] = parsed.frontmatter.tags || [];

      // 检查该文章是否包含要删除的标签
      if (!currentTags.includes(tagToDelete)) continue;

      // 移除标签
      const updatedTags = currentTags.filter((t) => t !== tagToDelete);
      const newContent = buildMarkdownWithFrontmatter(
        { ...parsed.frontmatter, tags: updatedTags },
        parsed.body,
      );

      await writeFile(filePath, newContent, "utf-8");
      removedFrom++;
      console.log(`[Tag Delete] 从 ${filePath} 中移除了标签 "${tagToDelete}"`);
    } catch (err: any) {
      const msg = `处理文件 ${filePath} 失败: ${err.message}`;
      console.error(`[Tag Delete] ${msg}`);
      errors.push(msg);
    }
  }

  console.log(`[Tag Delete] 标签删除完成，共从 ${removedFrom} 篇文章中移除`);

  return {
    success: true,
    removedFrom,
    tag: tagToDelete,
    totalFiles: files.length,
    errors: errors.length > 0 ? errors : undefined,
  };
});
