import { registry, repositories } from './env.js'


/**
 * 使用fetch请求并在失败时重试，支持更换URL
 * @param {string[]} urls - 要尝试的URL列表
 * @param {RequestInit} options - fetch的配置选项
 * @param {number} [maxRetries=2] - 最大重试次数（不包括首次尝试）
 * @param {number} [retryDelay=1000] - 重试前的延迟时间（毫秒）
 * @param {boolean} [cycleUrls=true] - 是否循环使用URL列表
 * @returns {Promise<Response>} - 返回成功的响应
 */
async function fetchWithRetry(
    urls: string[],
    options: RequestInit = {},
    maxRetries = 2,
    retryDelay = 1000,
    cycleUrls = true
): Promise<Response> {
    if (!urls || urls.length === 0) {
        throw new Error('URL列表不能为空');
    }

    let lastError: Error | undefined;
    const totalAttempts = maxRetries + 1; // 总尝试次数 = 重试次数 + 首次尝试

    for (let attempt = 0; attempt < totalAttempts; attempt++) {
        // 明确指定 currentUrl 为 string 类型
        const currentUrl = (cycleUrls
            ? urls[attempt % urls.length]  // 循环使用URL
            : urls[Math.min(attempt, urls.length - 1)]) as string  // 不循环，用完即止

        try {
            // console.log(`尝试请求 [${attempt + 1}/${totalAttempts}]: ${currentUrl}`);
            const response = await fetch(currentUrl, options);

            // 检查HTTP响应状态是否成功（200-299）
            if (response.ok) {
                console.log(`请求成功: ${currentUrl}`);
                return response;
            }

            // 记录HTTP错误
            lastError = new Error(`HTTP错误: 状态码 ${response.status} (URL: ${currentUrl})`);
        } catch (error: any) {
            // 捕获网络错误等异常
            lastError = new Error(`请求失败: ${error.message} (URL: ${currentUrl})`);
        }

        // 如果不是最后一次尝试，等待后再重试
        if (attempt < totalAttempts - 1) {
            console.log(`将在 ${retryDelay}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }

    // 所有尝试都失败，抛出最后一次错误
    throw lastError || new Error('未知错误');
}

export async function getHbuilderxRelease() {
    return await fetch(`https://download1.dcloud.net.cn/hbuilderx/release.json`)
}


export async function getPlugin(plugin: string) {
    return await fetch(`${registry}/${plugin}`, { headers: { 'Accept': 'application/vnd.npm.install-v1+json' } })
}

export async function getDependencies(version: string) {
    const urls = [
        `${repositories.github}/${version}/package.json`,
        `${repositories.gitee}/${version}/package.json`
    ]
    return await fetchWithRetry(urls)
}
