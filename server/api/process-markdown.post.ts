/**
 * Process markdown image references and replace local paths with img bed URLs.
 */

import type { ImgBedConfig } from '#shared/utils/imgbed-config';
import { extractImages, getLocalImages } from '#shared/utils/markdown-parser';
import { getServerImgBedConfig } from '@serverUtils/imgbed-config.server';
import { processMarkdownImages } from '@serverUtils/markdown-image-processor';

export interface ProcessRequest {
  content: string;
  imgBedConfig?: ImgBedConfig;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<ProcessRequest>(event);

    if (!body?.content) {
      throw createError({ statusCode: 400, message: 'Markdown content is required' });
    }

    const allImages = extractImages(body.content);
    const localImages = getLocalImages(allImages);
    if (localImages.length === 0) {
      return {
        success: true,
        processedContent: body.content,
        totalImages: allImages.length,
        localImages: 0,
        processedCount: 0,
        uploadedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        errors: [],
      };
    }

    const imgBedConfig = body.imgBedConfig ?? await getServerImgBedConfig();
    if (!imgBedConfig.apiUrl || !imgBedConfig.token) {
      throw createError({ statusCode: 400, message: 'Img bed API URL and token are required' });
    }

    return await processMarkdownImages(body.content, imgBedConfig);
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, message: error.message || 'Process failed' });
  }
});
