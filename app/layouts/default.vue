<script setup lang="ts">

</script>

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
    <div class="min-h-screen">
        <!-- 主内容区域：使用 flex-1 占据剩余空间，包含页面内容 -->
        <main class="flex-1 container mx-auto px-4 py-8">
            <!-- 插槽：用于插入页面特定内容 -->
            <slot />
        </main>

        <!-- 页脚：包含多列布局、链接和版权信息 -->
        <footer class="bg-gray-900 text-gray-300">
            <!-- 顶部区域：包含多个列 -->
            <customFooter />
        </footer>
    </div>
</template>