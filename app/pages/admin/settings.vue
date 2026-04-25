<script setup lang="ts">
/**
 * 系统设置页 (admin/settings.vue)
 *
 * 耦合关系：
 *   - server/api/blog/posts.get.ts → 通过 $fetch 获取文章列表（统计用）
 *   - /package.json                → 通过 $fetch 获取项目依赖信息
 *   - app/utils/site-data/         → 静态配置数据目录（页面展示配置路径）
 *
 * 函数表：
 *   - tabs     → 设置页标签页列表（基本信息 / 导航配置 / 页脚配置 / 站点缓存）
 *   - activeTab → 当前激活的标签页索引
 */
useHead({ title: '系统设置 - TY\'s Blog' });

const tabs = ['基本信息', '导航配置', '页脚配置', '站点缓存'];
const activeTab = ref(0);

const { data: posts } = await useAsyncData('admin-settings-posts', () => $fetch('/api/blog/posts'), { default: () => [] });

const { data: pkg } = await useAsyncData('admin-pkg', () => $fetch('/package.json'), { default: () => null });
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">SETTINGS</p>
      <h1>系统设置</h1>
      <p class="admin-subtitle">查看博客系统配置，静态配置在 <code>app/utils/site-data/</code> 中管理。</p>
    </header>

    <main class="admin-main">
      <div class="tabs-row">
        <button v-for="(tab, idx) in tabs" :key="idx"
          :class="['tab-btn', { active: activeTab === idx }]"
          @click="activeTab = idx">
          {{ tab }}
        </button>
      </div>

      <!-- 基本信息 -->
      <div v-if="activeTab === 0" class="admin-panel">
        <h2>站点信息</h2>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">文章总数</span>
            <span class="info-value">{{ posts.length }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">博客框架</span>
            <span class="info-value">Nuxt {{ pkg?.dependencies?.nuxt?.replace('^', '') || '4.x' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">内容管理</span>
            <span class="info-value">Nuxt Content v3 + Markdown</span>
          </div>
          <div class="info-item">
            <span class="info-label">文章目录</span>
            <span class="info-value"><code>content/blog/</code></span>
          </div>
          <div class="info-item">
            <span class="info-label">静态配置目录</span>
            <span class="info-value"><code>app/utils/site-data/</code></span>
          </div>
        </div>
      </div>

      <!-- 导航配置 -->
      <div v-if="activeTab === 1" class="admin-panel">
        <h2>导航菜单</h2>
        <p style="color:var(--film-paper-soft);margin-bottom:1rem;line-height:1.7;">
          导航配置在 <code>app/utils/site-data/navigation.ts</code> 中维护。
          修改后需重启开发服务器生效。
        </p>
        <table class="data-table">
          <thead>
            <tr><th>标签</th><th>路径</th></tr>
          </thead>
          <tbody>
            <tr><td>首页</td><td><code>/</code></td></tr>
            <tr><td>关于</td><td><code>/about</code></td></tr>
            <tr><td>博客</td><td><code>/blog</code></td></tr>
            <tr><td>管理（开发模式）</td><td><code>/admin</code></td></tr>
          </tbody>
        </table>
      </div>

      <!-- 页脚配置 -->
      <div v-if="activeTab === 2" class="admin-panel">
        <h2>页脚信息</h2>
        <p style="color:var(--film-paper-soft);margin-bottom:1rem;line-height:1.7;">
          页脚配置在 <code>app/utils/site-data/footer.ts</code> 中维护。
        </p>
        <table class="data-table">
          <thead>
            <tr><th>字段</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr><td>End Credits</td><td>页脚标题</td></tr>
            <tr><td>Contacts</td><td>联系方式区域标签</td></tr>
            <tr><td>Act II / Built by</td><td>页脚署名</td></tr>
          </tbody>
        </table>
      </div>

      <!-- 站点缓存 -->
      <div v-if="activeTab === 3" class="admin-panel">
        <h2>缓存与数据刷新</h2>
        <p style="color:var(--film-paper-soft);margin-bottom:1rem;line-height:1.7;">
          当前使用 asyncData 缓存策略，刷新页面时会重新获取数据。
        </p>
        <NuxtLink to="/admin" class="btn btn-secondary">返回首页</NuxtLink>
      </div>
    </main>
  </div>
</template>

<style scoped>
.tabs-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 0.6rem 1.2rem;
  border: 1px solid rgba(183, 140, 77, 0.25);
  border-radius: 999px;
  background: transparent;
  color: var(--film-paper-soft);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: rgba(183, 140, 77, 0.45);
  color: var(--film-paper);
}

.tab-btn.active {
  background: rgba(183, 140, 77, 0.16);
  border-color: rgba(183, 140, 77, 0.5);
  color: var(--film-gold-soft);
}

.info-list {
  display: grid;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid rgba(183, 140, 77, 0.1);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: var(--film-muted-light);
  font-weight: 600;
}

.info-value {
  color: var(--film-paper);
  font-weight: 500;
}

.info-value code {
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: rgba(183, 140, 77, 0.15);
  color: var(--film-gold-soft);
}
</style>
