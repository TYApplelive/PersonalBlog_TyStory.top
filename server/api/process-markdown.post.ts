/**
 * Process markdown image references and replace local paths with img bed URLs.
 */
import type { ImgBedConfig } from "#shared/utils/imgbed-config";

export interface ProcessRequest {
    content: string;
    imgBedConfig?: ImgBedConfig;
}

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<ProcessRequest>(event);

        if (!body?.content) {
            throw createError({ statusCode: 400, message: "Markdown content is required" });
        }

        const imgBedConfig = body.imgBedConfig ?? await getServerImgBedConfig();
        if (!imgBedConfig.apiUrl || !imgBedConfig.token) {
            throw createError({ statusCode: 400, message: "Img bed API URL and token are required" });
        }

        return await processMarkdownImages(body.content, imgBedConfig);
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, message: error.message || "Process failed" });
    }
});
