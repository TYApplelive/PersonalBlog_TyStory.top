/** 文件名校验工具：校验文章文件名合法性并阻止路径穿越。 */

const SAFE_FILENAME = /^[a-zA-Z0-9 ._-]+$/;

/** 返回去除 `.md` 后的安全文件名。 */
export function validateFilename(filename: string): string {
  const baseName = filename.trim().replace(/\.md$/i, "").trim();

  if (!SAFE_FILENAME.test(baseName)) {
    throw createError({
      statusCode: 400,
      message: "文件名只能包含字母、数字、空格、短横线和下划线",
    });
  }

  return baseName;
}
