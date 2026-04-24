/**
 * 博客内容工具 (blog-content.ts)
 *
 * 耦合关系：
 *   - server/api/blog/posts.get.ts → 调用 getAllBlogPosts 获取文章列表
 *   - server/api/blog/[id].get.ts  → 调用 getBlogPostById 获取单篇文章
 *   - content/blog/*.md            → 读取 Markdown 博客文件
 *   - pages/blog/[id].vue          → 消费 API 返回的 stem 字段，再通过 queryCollection 获取完整文档
 *
 * 注意：此模块仅限服务端使用（依赖 node:fs / node:path）
 *
 * 导出函数表：
 *   - getAllBlogPosts()          → 获取所有博客文章，按日期降序排列
 *   - getBlogPostById(id)        → 按 ID 获取单篇文章
 *   - BlogContentPost (类型)     → 博客文章数据结构（含 stem 字段，与 Nuxt Content 路径对应）
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

export interface BlogContentPost {
  id: number;
  title: string;
  date: string;
  excerpt: string;
  readTime: string;
  tags: string[];
  body?: string;
  stem?: string;      // Nuxt Content 路径标识（如 "blog/1.nuxt-guide"）
  _path?: string;
}

const FRONTMATTER_KEYS = ["id", "title", "date", "excerpt", "readTime", "tags"];

// 修复 frontmatter 中缺失的换行符
function normalizeFrontmatter(frontmatter: string) {
  return frontmatter
    .replace(/\r\n/g, "\n")
    .replace(
      /([^\n])((?:id|title|date|excerpt|readTime|tags):\s*)/g,
      (_match, previous, nextKey) => `${previous}\n${nextKey}`,
    );
}

// 解析单个 Markdown 文件，提取 frontmatter 和正文
function parseMarkdownFile(filePath: string): BlogContentPost | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;

    const normalizedFrontmatter = normalizeFrontmatter(frontmatterMatch[1] ?? "");
    const parsed = parse(normalizedFrontmatter) as Partial<BlogContentPost> | null;
    if (!parsed) return null;

    const body = content.slice(frontmatterMatch[0].length).trim();

    // 计算 Nuxt Content 路径标识：相对于 content/ 目录，无扩展名，正斜杠
    const contentDir = getContentDirectory();
    const relPath = path.relative(contentDir, filePath);
    const stem = relPath.replace(/\\/g, "/").replace(/\.md$/, "");

    return {
      id: Number(parsed.id ?? 0),
      title: String(parsed.title ?? ""),
      date: String(parsed.date ?? ""),
      excerpt: String(parsed.excerpt ?? ""),
      readTime: String(parsed.readTime ?? ""),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(tag => String(tag)) : [],
      body,
      stem,
      _path: filePath,
    };
  } catch {
    return null;
  }
}

function getContentDirectory() {
  return path.join(process.cwd(), "content");
}

function getBlogDirectory() {
  return path.join(process.cwd(), "content", "blog");
}

export const getAllBlogPosts = async (): Promise<BlogContentPost[]> => {
  const blogDir = getBlogDirectory();
  if (!fs.existsSync(blogDir)) return [];

  const posts = fs
    .readdirSync(blogDir)
    .filter(file => file.endsWith(".md"))
    .map(file => parseMarkdownFile(path.join(blogDir, file)))
    .filter((post): post is BlogContentPost => {
      if (!post) return false;
      return FRONTMATTER_KEYS.every(key => {
        const value = post[key as keyof BlogContentPost];
        return Array.isArray(value) ? true : Boolean(value);
      });
    });

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getBlogPostById = async (id: number): Promise<BlogContentPost | null> => {
  const posts = await getAllBlogPosts();
  return posts.find(post => post.id === id) ?? null;
};
