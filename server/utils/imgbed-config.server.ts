import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const CONFIG_FILE = join(process.cwd(), ".data", "imgbed-config.json");

function getDefaultImgBedConfig(): ImgBedConfig {
  const runtimeConfig = useRuntimeConfig();

  return {
    apiUrl: runtimeConfig.imgBedApiUrl || "https://ty-imgbed.pages.dev",
    token: runtimeConfig.imgBedToken || "",
  };
}

async function ensureConfigDir() {
  await mkdir(dirname(CONFIG_FILE), { recursive: true });
}

export async function getServerImgBedConfig(): Promise<ImgBedConfig> {
  try {
    const content = await readFile(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(content) as Partial<ImgBedConfig>;

    return {
      ...getDefaultImgBedConfig(),
      apiUrl: parsed.apiUrl?.trim() || getDefaultImgBedConfig().apiUrl,
      token: parsed.token?.trim() || "",
    };
  } catch {
    return getDefaultImgBedConfig();
  }
}

export async function saveServerImgBedConfig(config: Partial<ImgBedConfig>): Promise<ImgBedConfig> {
  const merged = {
    ...(await getServerImgBedConfig()),
    ...config,
  };

  await ensureConfigDir();
  await writeFile(CONFIG_FILE, JSON.stringify(merged, null, 2), "utf-8");
  return merged;
}

export async function resetServerImgBedConfig(): Promise<ImgBedConfig> {
  try {
    await rm(CONFIG_FILE, { force: true });
  } catch {
    // Ignore reset errors and return defaults.
  }

  return getDefaultImgBedConfig();
}
