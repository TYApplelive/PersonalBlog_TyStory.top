/**
 * 配置持久化工具 (config-persistence.ts)
 *
 * 提供统一的 JSON 配置文件读写能力，所有配置文件存储在 content/config/ 目录下。
 *
 * 支持的类型：
 *   - site        → 品牌、首页、关于页配置
 *   - navigation  → 导航菜单
 *   - footer      → 页脚+联系方式
 *   - blog        → 博客展示配置
 *   - system      → 系统参数
 *   - imgbed      → 图床配置
 *
 * 函数表：
 *   - readConfig(type)        → 读取配置，文件不存在时返回 null
 *   - writeConfig(type, data) → 写入配置，自动创建目录
 *   - getConfigPath(type)     → 获取配置文件绝对路径
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/** 支持的配置类型 */
export type ConfigType = "site" | "navigation" | "footer" | "blog" | "system" | "imgbed";

const CONFIG_DIR = join(process.cwd(), "content", "config");

/** 获取指定类型配置文件的绝对路径 */
function getConfigPath(type: ConfigType): string {
  return join(CONFIG_DIR, `${type}.json`);
}

/** 确保配置目录存在 */
async function ensureConfigDir(): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
}

/**
 * 读取指定类型的配置文件
 * @param type 配置类型
 * @returns 解析后的配置对象，文件不存在或解析失败时返回 null
 */
export async function readConfig<T = Record<string, unknown>>(type: ConfigType): Promise<T | null> {
  try {
    const filePath = getConfigPath(type);
    const content = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(content) as T;
    console.log(`[Config] 已读取配置: ${type}.json`);
    return parsed;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Config] 读取配置 ${type}.json 失败:`, message);
    return null;
  }
}

/**
 * 写入配置到指定类型的 JSON 文件
 * @param type 配置类型
 * @param data 要写入的数据
 */
export async function writeConfig<T = Record<string, unknown>>(type: ConfigType, data: T): Promise<void> {
  await ensureConfigDir();
  const filePath = getConfigPath(type);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`[Config] 已保存配置: ${type}.json`);
}

/**
 * 重置指定类型的配置（删除配置文件）
 * @param type 配置类型
 */
export async function resetConfig(type: ConfigType): Promise<void> {
  try {
    const { rm } = await import("node:fs/promises");
    await rm(getConfigPath(type), { force: true });
    console.log(`[Config] 已重置配置: ${type}.json`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Config] 重置配置 ${type}.json 失败:`, message);
  }
}
