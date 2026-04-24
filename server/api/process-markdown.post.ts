/**
 * Markdown 图片处理 API (server/api/process-markdown.post.ts)
 *
 * 耦合关系：
 *   - shared/utils/markdown-parser.ts → 提取和替换图片路径
 *   - server/utils/image-upload.ts → 上传图片到图床
 *   - shared/utils/imgbed-config.ts   → ImgBedConfig 类型
 *
 * 请求方式：POST /api/process-markdown
 * 请求体：{ content: string, imgBedConfig: ImgBedConfig }
 * 返回：ProcessResult
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { uploadToImgBed } from '../utils/image-upload';

// 处理请求
export interface ProcessRequest {
    content: string;
    imgBedConfig: ImgBedConfig;
}

// 处理结果
export interface ProcessResult {
    success: boolean;
    processedContent: string;
    totalImages: number;
    localImages: number;
    uploadedCount: number;
    skippedCount: number;
    failedCount: number;
    errors: Array<{ path: string; error: string }>;
}

// 读取本地图片
function readLocalImage(path: string): Buffer | undefined {
    const candidateBases = [
        process.cwd(),
        resolve(process.cwd(), 'content/blog'),
        resolve(process.cwd(), 'content'),
    ];

    for (const base of candidateBases) {
        try {
            return readFileSync(resolve(base, path));
        } catch {
            // 尝试下一个基础路径
        }
    }

    return undefined;
}

// 处理 Markdown 内容
export default defineEventHandler(async (event): Promise<ProcessResult> => {
    try {
        console.log('========== [Server: process-markdown] 开始处理请求 ==========');

        const body = await readBody<ProcessRequest>(event);

        if (!body?.content) {
            console.error('[Server: process-markdown] 未提供 Markdown 内容');
            throw createError({ statusCode: 400, message: '未提供 Markdown 内容' });
        }

        if (!body.imgBedConfig?.apiUrl || !body.imgBedConfig?.token) {
            console.error('[Server: process-markdown] 图床配置不完整');
            throw createError({ statusCode: 400, message: 'Markdown 图片上传需要 API 地址和 Token' });
        }

        console.log(`[Server: process-markdown] 图床 API: ${body.imgBedConfig.apiUrl}`);
        console.log(`[Server: process-markdown] Token 长度: ${body.imgBedConfig.token.length}`);

        const allImages = extractImages(body.content);
        const localImages = getLocalImages(allImages);

        console.log(`[Server: process-markdown] 检测到图片总数: ${allImages.length}`);
        console.log(`[Server: process-markdown] 本地图片: ${localImages.length} 张`);
        console.log(`[Server: process-markdown] 远程图片: ${allImages.length - localImages.length} 张`);

        const errors: Array<{ path: string; error: string }> = [];
        let processedContent = body.content;
        let uploadedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < localImages.length; i++) {
            const img = localImages[i];
            console.log(`\n[Server: process-markdown] 处理第 ${i + 1}/${localImages.length} 张图片: ${img.path}`);

            try {
                const fileBuffer = img.pathType === 'absolute'
                    ? readFileSync(img.path)
                    : readLocalImage(img.path);

                if (!fileBuffer) {
                    console.warn(`[Server: process-markdown] 文件不存在: ${img.path}`);
                    errors.push({ path: img.path, error: '文件不存在或无法访问' });
                    skippedCount++;
                    continue;
                }

                console.log(`[Server: process-markdown] 文件读取成功，大小: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

                const filename = img.path.split(/[\\/]/).pop() || 'image.jpg';
                console.log(`[Server: process-markdown] 正在上传图片: ${filename}`);

                const uploadResult = await uploadToImgBed(fileBuffer, filename, body.imgBedConfig);

                if (uploadResult.success && uploadResult.url) {
                    console.log(`[Server: process-markdown] 上传成功: ${uploadResult.url}`);
                    processedContent = replaceImagePath(processedContent, img.path, uploadResult.url);
                    uploadedCount++;
                } else {
                    console.error(`[Server: process-markdown] 上传失败: ${uploadResult.error}`);
                    errors.push({ path: img.path, error: uploadResult.error || '上传失败' });
                    skippedCount++;
                }
            } catch (error: any) {
                console.error(`[Server: process-markdown] 处理异常: ${error.message}`);
                errors.push({ path: img.path, error: error.message || '处理失败' });
                skippedCount++;
            }
        }

        console.log('\n========== [Server: process-markdown] 处理完成 ==========');
        console.log(`[Server: process-markdown] 上传成功: ${uploadedCount} 张`);
        console.log(`[Server: process-markdown] 跳过/失败: ${skippedCount} 张`);
        console.log(`[Server: process-markdown] 错误数: ${errors.length}`);

        return {
            success: true,
            processedContent,
            totalImages: allImages.length,
            localImages: localImages.length,
            uploadedCount,
            skippedCount,
            failedCount: errors.length,
            errors,
        };
    } catch (error: any) {
        console.error('[Server: process-markdown] 请求处理失败:', error);
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, message: error.message || '处理失败' });
    }
});
