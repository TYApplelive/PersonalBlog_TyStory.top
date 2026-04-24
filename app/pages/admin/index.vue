<script setup lang="ts">
useHead({
    title: '管理中心 - TY\'s Blog',
});

const navItems = [
    { to: '/admin/md-images', icon: 'MD', label: 'Markdown 图片处理', desc: '提取本地图片并上传到图床' },
    { to: '/admin/imgbed-manager', icon: 'IMG', label: '图床管理', desc: '配置 CloudFlare ImgBed API 与 Token' },
];
</script>

<template>
    <div class="admin-dashboard">
        <header class="admin-header">
            <p class="eyebrow">ADMIN ROOM</p>
            <h1>管理中心</h1>
            <p class="admin-subtitle">当前只保留与博客写作流程直接相关的工具入口。</p>
        </header>

        <main class="admin-main">
            <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="tool-card">
                <span class="tool-icon">{{ item.icon }}</span>
                <span class="tool-copy">
                    <strong>{{ item.label }}</strong>
                    <small>{{ item.desc }}</small>
                </span>
            </NuxtLink>
        </main>
    </div>
</template>

<style scoped>
.admin-dashboard {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem;
    color: var(--film-paper);
}

.admin-header {
    margin-bottom: 2rem;
}

.eyebrow {
    color: var(--film-gold-soft);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.22em;
}

.admin-header h1 {
    margin: 0.25rem 0 0.5rem;
    color: var(--film-gold);
    font-size: clamp(2rem, 5vw, 3rem);
}

.admin-subtitle {
    color: var(--film-paper-soft);
}

.admin-main {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
}

.tool-card {
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 1.3rem;
    border: 1px solid rgba(183, 140, 77, 0.24);
    border-radius: 16px;
    background: rgba(242, 221, 175, 0.06);
    color: var(--film-paper);
    text-decoration: none;
    transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.tool-card:hover {
    transform: translateY(-2px);
    border-color: rgba(183, 140, 77, 0.46);
    background: rgba(183, 140, 77, 0.14);
}

.tool-icon {
    display: grid;
    place-items: center;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 999px;
    background: rgba(20, 12, 9, 0.45);
    color: var(--film-gold);
    font-weight: 900;
    letter-spacing: 0.08em;
}

.tool-copy {
    display: grid;
    gap: 0.25rem;
}

.tool-copy strong {
    color: var(--film-gold-soft);
    font-size: 1.1rem;
}

.tool-copy small {
    color: var(--film-paper-soft);
}

@media (max-width: 720px) {
    .admin-dashboard {
        padding: 1rem;
    }

    .admin-main {
        grid-template-columns: 1fr;
    }
}
</style>
