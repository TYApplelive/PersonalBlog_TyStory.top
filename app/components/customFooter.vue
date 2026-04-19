<script setup lang="ts">
</script>

<template>
    <div class="container mx-auto px-4 py-12">
        <div class="custom_footer">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <!-- 第一列：品牌信息 -->
                <div class="col-span-1 md:col-span-1">
                    <h3 class="text-xl font-bold text-white mb-4">个人博客</h3>
                    <p class="text-sm text-gray-400 leading-relaxed">
                        分享技术、生活和思考，记录成长的点点滴滴。
                    </p>
                </div>

                <!-- 第二列：快速链接 -->
                <div class="col-span-1">
                    <h4 class="text-lg font-semibold text-white mb-4">快速链接</h4>
                    <ul class="space-y-2 text-sm">
                        <li>
                            <NuxtLink to="/" class="hover:text-white transition-colors duration-200">
                                首页
                            </NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/about" class="hover:text-white transition-colors duration-200">
                                关于
                            </NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/blog" class="hover:text-white transition-colors duration-200">
                                博客
                            </NuxtLink>
                        </li>
                    </ul>
                </div>

                <!-- 第三列：联系方式 -->
                <div class="col-span-1">
                    <h4 class="text-lg font-semibold text-white mb-4">联系方式</h4>
                    <ul class="space-y-2 text-sm">
                        <li class="flex items-center gap-2">
                            <span>📧</span>
                            <span>email@example.com</span>
                        </li>
                        <li class="flex items-center gap-2">
                            <span>📍</span>
                            <span>中国</span>
                        </li>
                    </ul>
                </div>

                <!-- 第四列：关注我 -->
                <div class="col-span-1">
                    <h4 class="text-lg font-semibold text-white mb-4">关注我</h4>
                    <div class="flex space-x-4">
                        <a href="#" class="hover:text-white transition-colors duration-200" aria-label="GitHub">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                        </a>
                        <a href="#" class="hover:text-white transition-colors duration-200" aria-label="Twitter">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                        </a>
                        <a href="#" class="hover:text-white transition-colors duration-200" aria-label="Email">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
            <div class="container mx-auto px-4 py-6">
                <div class="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>&copy; {{ new Date().getFullYear() }} 个人博客. 保留所有权利.</p>
                    <div class="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" class="hover:text-white transition-colors duration-200">隐私政策</a>
                        <a href="#" class="hover:text-white transition-colors duration-200">使用条款</a>
                    </div>
                </div>
            </div>
        </div>
    </div>

</template>

<style lang="less" scoped></style>
