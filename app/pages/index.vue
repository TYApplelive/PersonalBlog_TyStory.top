<template>
  <div class="home">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-50 bg-white shadow-md">
      <div class="container mx-auto px-4">
        <nav class="flex justify-between items-center py-4">
          <div class="text-2xl font-bold text-blue-600">
            <Logo />
            <NuxtLink to="/">个人博客</NuxtLink>
          </div>
          <div class="hidden md:flex space-x-8">
            <NuxtLink to="/" class="font-medium hover:text-blue-600 transition">首页</NuxtLink>
            <NuxtLink to="/about" class="font-medium hover:text-blue-600 transition">关于</NuxtLink>
            <NuxtLink to="/blog" class="font-medium hover:text-blue-600 transition">博客</NuxtLink>
          </div>
        </nav>
      </div>
    </header>

    <section class="hero bg-blue-50 py-16">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-4xl font-bold mb-4">欢迎来到我的个人博客</h1>
        <p class="text-xl text-gray-600 mb-8">分享技术、生活和思考</p>
        <NuxtLink to="/blog" class="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition">
          浏览博客
        </NuxtLink>
      </div>
    </section>

    <section class="features py-12">
      <div class="container mx-auto px-4">
        <h2 class="text-2xl font-bold mb-8 text-center">博客特色</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-semibold mb-3">技术分享</h3>
            <p>分享前端开发、后端技术和其他编程相关的知识</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-semibold mb-3">生活记录</h3>
            <p>记录生活中的点滴，分享个人成长和感悟</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-semibold mb-3">思考总结</h3>
            <p>对技术和生活的思考，总结经验和教训</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 导航栏样式 */
header {
  transition: all 0.3s ease;
}

header.scrolled {
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>