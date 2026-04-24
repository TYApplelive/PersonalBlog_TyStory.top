<script setup lang="ts">
useHead({
    title: '新建文章 - 博客',
});
</script>

<template>
    <div class="admin-page">
        <header class="page-header">
            <h1>➕ 新建文章</h1>
            <p class="page-subtitle">创建新的博客文章</p>
        </header>

        <main class="page-content">
            <div class="paper-panel">
                <div class="content-placeholder">
                    <p class="placeholder-text">文章编辑器开发中...</p>
                    <p class="placeholder-hint">
                        请在 <code>content/blog/</code> 目录创建 Markdown 文件<br>
                        文件需包含 Frontmatter 元数据（id, title, date 等）
                    </p>
                    <div class="action-buttons">
                        <NuxtLink to="/admin/md-images" class="nav-button">图片处理工具</NuxtLink>
                        <NuxtLink to="/blog" class="nav-button secondary">查看现有文章</NuxtLink>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
.admin-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    color: var(--film-paper);
}

.page-header {
    text-align: center;
    margin-bottom: 2.5rem;
}

.page-header h1 {
    font-size: 2rem;
    color: var(--film-gold);
    margin-bottom: 0.5rem;
    font-weight: 800;
    text-shadow: 0 2px 8px rgba(183, 140, 77, 0.3);
}

.page-subtitle {
    color: var(--film-muted-light);
    font-size: 1rem;
}

.paper-panel {
    background: rgba(242, 221, 175, 0.06);
    border: 1px solid rgba(183, 140, 77, 0.18);
    border-radius: 12px;
    padding: 3rem 2rem;
    text-align: center;
}

.content-placeholder {
    max-width: 600px;
    margin: 0 auto;
}

.placeholder-text {
    font-size: 1.25rem;
    color: var(--film-gold-soft);
    margin-bottom: 1rem;
    font-weight: 600;
}

.placeholder-hint {
    color: var(--film-muted-light);
    margin-bottom: 2rem;
    line-height: 1.8;
}

.placeholder-hint code {
    background: rgba(183, 140, 77, 0.15);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    color: var(--film-gold-soft);
    font-family: monospace;
}

.action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.nav-button {
    display: inline-block;
    padding: 0.85rem 1.75rem;
    background: rgba(183, 140, 77, 0.15);
    border: 1px solid rgba(183, 140, 77, 0.3);
    border-radius: 8px;
    color: var(--film-paper);
    text-decoration: none;
    font-weight: 600;
    transition: all 0.24s ease;
}

.nav-button:hover {
    background: rgba(183, 140, 77, 0.25);
    border-color: rgba(183, 140, 77, 0.45);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.nav-button.secondary {
    background: transparent;
    border-color: rgba(129, 100, 73, 0.4);
    color: var(--film-paper-soft);
}

.nav-button.secondary:hover {
    border-color: var(--film-paper);
    color: var(--film-paper);
}
</style>
