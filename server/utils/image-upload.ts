/**
 * 图床上传工具 (server/utils/image-upload.ts)
 *
 * 耦合关系：
 *   - shared/utils/imgbed-config.ts → 构建请求 URL 和鉴权头
 *
 * 导出函数表：
 *   - uploadToImgBed(buffer, filename, config) → 上传图片到 CloudFlare ImgBed
 *   - UploadResult (类型)                      → 上传结果数据结构
 */

const UPLOAD_CONFIG = {
    timeout: 15000,
    maxRetries: 3,
    retryDelay: 1000,
};

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

function getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
        gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    };
    return mimeTypes[ext] || 'image/jpeg';
}

function extractUploadedUrl(data: unknown, apiUrl: string): string | undefined {
    if (typeof data === 'string') {
        return data.startsWith('http') ? data : resolveImgBedSrc(apiUrl, data);
    }

    if (Array.isArray(data)) {
        const first = data[0] as { src?: string; url?: string } | undefined;
        const src = first?.src ?? first?.url;
        return src ? resolveImgBedSrc(apiUrl, src) : undefined;
    }

    if (data && typeof data === 'object') {
        const payload = data as {
            url?: string; src?: string;
            data?: { url?: string; src?: string } | string;
            error?: string; message?: string;
        };
        const src = payload.url ?? payload.src;
        if (src) return resolveImgBedSrc(apiUrl, src);
        if (typeof payload.data === 'string') return resolveImgBedSrc(apiUrl, payload.data);
        if (payload.data?.url || payload.data?.src) {
            return resolveImgBedSrc(apiUrl, payload.data.url ?? payload.data.src!);
        }
    }

    return undefined;
}

export async function uploadToImgBed(
    fileBuffer: Buffer,
    filename: string,
    config: ImgBedConfig,
): Promise<UploadResult> {
    let lastError: Error | null = null;
    const uploadUrl = buildImgBedUrl(config.apiUrl, '/upload', { returnFormat: 'full' });

    console.log(`[Server: uploadToImgBed] 开始上传: ${filename}`);
    console.log(`[Server: uploadToImgBed] 上传 URL: ${uploadUrl}`);
    console.log(`[Server: uploadToImgBed] 文件大小: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

    for (let attempt = 1; attempt <= UPLOAD_CONFIG.maxRetries; attempt++) {
        console.log(`[Server: uploadToImgBed] 第 ${attempt}/${UPLOAD_CONFIG.maxRetries} 次尝试`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), UPLOAD_CONFIG.timeout);

        try {
            const formData = new FormData();
            const blob = new Blob([new Uint8Array(fileBuffer)], { type: getMimeType(filename) });
            formData.append('file', blob, filename);

            console.log(`[Server: uploadToImgBed] 正在发送请求...`);
            
            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: buildImgBedAuthHeaders(config.token),
                body: formData,
                signal: controller.signal,
            });

            const contentType = response.headers.get('content-type') ?? '';
            const data = contentType.includes('application/json')
                ? await response.json()
                : await response.text();

            console.log(`[Server: uploadToImgBed] 响应状态: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const message = typeof data === 'object' && data
                    ? (data as { error?: string; message?: string }).error ?? (data as { message?: string }).message
                    : String(data);
                console.error(`[Server: uploadToImgBed] 上传失败: ${message}`);
                throw new Error(message || `HTTP ${response.status}`);
            }

            const url = extractUploadedUrl(data, config.apiUrl);
            if (url) {
                console.log(`[Server: uploadToImgBed] 上传成功: ${url}`);
                return { success: true, url };
            }

            console.error(`[Server: uploadToImgBed] 响应中未找到图片 URL`);
            lastError = new Error('上传成功但未解析到图片地址');
        } catch (error) {
            console.error(`[Server: uploadToImgBed] 请求异常: ${(error as Error).message}`);
            lastError = error as Error;
        } finally {
            clearTimeout(timeoutId);
        }

        if (attempt < UPLOAD_CONFIG.maxRetries) {
            const delay = UPLOAD_CONFIG.retryDelay * attempt;
            console.log(`[Server: uploadToImgBed] 等待 ${delay}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    console.error(`[Server: uploadToImgBed] 所有重试均失败`);
    return { success: false, error: lastError?.message || '未知上传错误' };
}
