<!--
默认布局文件
用途：定义整个应用的基本布局结构，包含头部导航、主内容区域和页脚
结构：
- 头部导航栏：显示网站标题和导航链接
- 主内容区域：通过 slot 插槽显示页面内容
- 页脚：显示版权信息
-->
<template>
    <!-- 根容器：使用 flex 布局实现垂直方向的布局结构 -->
    <div class="min-h-screen flex flex-col">
        <!-- 头部导航栏：固定高度，灰色背景，白色文字 -->
        <header class="bg-gray-800 text-white py-4">
            <div class="container mx-auto px-4">
                <!-- 导航容器：使用 flex 布局实现左右对齐 -->
                <nav class="flex justify-between items-center">
                    <!-- 网站标题：使用 NuxtLink 链接到首页 -->
                    <div class="text-xl font-bold">
                        <NuxtLink to="/">个人博客</NuxtLink>
                    </div>
                    <!-- 导航链接：水平排列，包含首页、关于和博客页面的链接 -->
                    <div class="space-x-6">
                        <NuxtLink to="/" class="hover:text-gray-300">首页</NuxtLink>
                        <NuxtLink to="/about" class="hover:text-gray-300">关于</NuxtLink>
                        <NuxtLink to="/blog" class="hover:text-gray-300">博客</NuxtLink>
                    </div>
                </nav>
            </div>
        </header>

        <!-- 主内容区域：使用 flex-1 占据剩余空间，包含页面内容 -->
        <main class="flex-1 container mx-auto px-4 py-8">
            <!-- 插槽：用于插入页面特定内容 -->
            <slot />
        </main>

        <!-- 页脚：固定高度，灰色背景，白色文字 -->
        <footer class="bg-gray-800 text-white py-6">
            <div class="container mx-auto px-4 text-center">
                <!-- 版权信息：显示当前年份和网站名称 -->
                <p>&copy; {{ new Date().getFullYear() }} 个人博客. 保留所有权利.</p>
            </div>
        </footer>
    </div>
</template>

<style>
/* 全局样式：设置整个应用的基本样式 */
body {
    font-family: Arial, sans-serif;
    /* 设置字体 */
    line-height: 1.6;
    /* 设置行高 */
    color: #333;
    /* 设置文字颜色 */
    background-color: #f4f4f4;
    /* 设置背景颜色 */
}

/* 链接样式：设置所有链接的默认样式 */
a {
    color: #3b82f6;
    /* 设置链接颜色 */
    text-decoration: none;
    /* 移除默认下划线 */
}

/* 链接悬停样式：设置链接悬停时的效果 */
a:hover {
    text-decoration: underline;
    /* 添加下划线 */
}
</style>