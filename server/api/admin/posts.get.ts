import { queryCollection } from "@nuxt/content/server";
import { requireAdminSession } from "@serverUtils/auth";

/**
 * 管理端文章列表（无 SWR 缓存），用于后台实时管理场景。
 */
export default defineEventHandler(async (event) => {
  await requireAdminSession(event);

  const docs = await queryCollection(event, "blog")
    .order("date", "DESC")
    .all();

  return docs.map((doc: any) => ({
    title: doc.title ?? "",
    date: doc.date ?? "",
    description: doc.description ?? "",
    readTime: doc.readTime ?? "",
    tags: doc.tags ?? [],
    path: doc.path ?? "",
    stem: doc.stem ?? "",
  }));
});
