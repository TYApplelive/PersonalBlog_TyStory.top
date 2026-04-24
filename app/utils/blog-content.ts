/**
 * 博客内容工具函数
 * 使用 @nuxt/content 模块查询和管理博客文章
 */

export interface BlogContentPost {
  id: number;
  title: string;
  date: string;
  excerpt: string;
  readTime: string;
  tags: string[];
  body?: any; // Nuxt Content 解析后的正文 AST 结构
  _path?: string; // Nuxt Content 添加的路径字段
}

/**
 * 获取所有博客文章，按日期降序排列
 */
export const getAllBlogPosts = async () => {
  const posts = await queryContent("blog")
    .where({ _extension: "md" })
    .sort({ date: -1 })
    .find();

  return posts as unknown as BlogContentPost[];
};

/**
 * 根据 ID 获取单篇博客文章
 */
export const getBlogPostById = async (id: number) => {
  const post = await queryContent("blog")
    .where({ id })
    .findOne();

  return (post as unknown as BlogContentPost) || null;
};
