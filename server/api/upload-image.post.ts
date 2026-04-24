/**
 * 图片上传 API (server/api/upload-image.post.ts)
 *
 * 耦合关系：
 *   - server/utils/image-upload.ts → 调用 uploadToImgBed
 *   - shared/utils/imgbed-config.ts   → ImgBedConfig 类型
 *
 * 请求方式：POST /api/upload-image (multipart/form-data)
 * 请求体：{ image: File, imgBedConfig: string(JSON) }
 * 返回：{ success: boolean, url?: string }
 */

import { uploadToImgBed } from '../utils/image-upload';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024;

export default defineEventHandler(async (event) => {
    try {
        console.log('========== [Server: upload-image] 开始处理上传请求 ==========');
        
        const formData = await readFormData(event);
        const file = formData.get('image') as File | null;

        if (!file) {
            console.error('[Server: upload-image] 未提供图片文件');
            throw createError({ statusCode: 400, message: '未提供图片文件' });
        }

        console.log(`[Server: upload-image] 文件名: ${file.name}`);
        console.log(`[Server: upload-image] 文件类型: ${file.type}`);
        console.log(`[Server: upload-image] 文件大小: ${(file.size / 1024).toFixed(2)} KB`);

        if (!ALLOWED_TYPES.includes(file.type)) {
            console.error(`[Server: upload-image] 不支持的文件类型: ${file.type}`);
            throw createError({ statusCode: 400, message: `不支持的文件类型: ${file.type}` });
        }

        if (file.size > MAX_SIZE) {
            console.error(`[Server: upload-image] 文件过大: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            throw createError({ statusCode: 400, message: '文件大小超过 5MB 限制' });
        }

        const configStr = formData.get('imgBedConfig') as string;
        if (!configStr) {
            console.error('[Server: upload-image] 未提供图床配置');
            throw createError({ statusCode: 400, message: '未提供图床配置' });
        }

        let imgBedConfig: ImgBedConfig;
        try {
            imgBedConfig = JSON.parse(configStr);
            console.log(`[Server: upload-image] 图床 API: ${imgBedConfig.apiUrl}`);
        } catch {
            console.error('[Server: upload-image] 图床配置格式错误');
            throw createError({ statusCode: 400, message: '图床配置格式错误' });
        }

        if (!imgBedConfig.apiUrl || !imgBedConfig.token) {
            console.error('[Server: upload-image] 图床配置缺少必要字段');
            throw createError({ statusCode: 400, message: '上传需要 API 地址和 Token' });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        console.log(`[Server: upload-image] 正在调用 uploadToImgBed...`);
        
        const result = await uploadToImgBed(buffer, file.name || 'image.jpg', imgBedConfig);

        if (!result.success) {
            console.error(`[Server: upload-image] 上传失败: ${result.error}`);
            throw createError({ statusCode: 500, message: result.error });
        }

        console.log(`[Server: upload-image] 上传成功: ${result.url}`);
        console.log('========== [Server: upload-image] 处理完成 ==========');
        
        return { success: true, url: result.url };
    } catch (error: any) {
        console.error('[Server: upload-image] 请求处理失败:', error);
        if (error.statusCode) throw error;
        throw createError({ statusCode: 500, message: error.message || '上传失败' });
    }
});
