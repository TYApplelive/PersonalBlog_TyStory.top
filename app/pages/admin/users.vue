<script setup lang="ts">
useHead({ title: '用户管理 - TY\'s Blog' });
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">ACCOUNT</p>
      <h1>用户管理</h1>
      <p class="admin-subtitle">当前博客为静态站点，暂无完整的用户系统。此处展示站点所有者信息。</p>
    </header>

    <main class="admin-main">
      <div class="admin-panel">
        <div class="profile-card">
          <div class="profile-avatar">TY</div>
          <div class="profile-info">
            <h2 class="profile-name">TY <span style="color:var(--film-muted-light);font-weight:400;font-size:0.9rem;">/ Applelive</span></h2>
            <p class="profile-desc">学生 · 写程序的人 · 白羊座</p>
            <div class="profile-contacts">
              <div class="contact-row">
                <span class="contact-label">GitHub</span>
                <a href="https://github.com/TYApplelive" target="_blank" class="admin-link">TYApplelive</a>
              </div>
              <div class="contact-row">
                <span class="contact-label">QQ</span>
                <span style="color:var(--film-paper-soft);">2623999208</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-panel">
        <h2>权限说明</h2>
        <table class="data-table">
          <thead>
            <tr><th>模块</th><th>访问权限</th><th>说明</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>文章管理</td>
              <td><span class="tag-badge">管理员</span></td>
              <td style="color:var(--film-paper-soft);font-size:0.9rem;">Markdown 文件直接管理</td>
            </tr>
            <tr>
              <td>图床管理</td>
              <td><span class="tag-badge">管理员</span></td>
              <td style="color:var(--film-paper-soft);font-size:0.9rem;">需配置 API Token</td>
            </tr>
            <tr>
              <td>系统设置</td>
              <td><span class="tag-badge">管理员</span></td>
              <td style="color:var(--film-paper-soft);font-size:0.9rem;">静态配置，需修改源码</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<style scoped>
.profile-card {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.profile-avatar {
  width: 5rem;
  height: 5rem;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--film-accent), var(--film-gold));
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--film-paper);
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
}

.profile-name {
  margin: 0 0 0.25rem;
  color: var(--film-gold);
  font-size: 1.5rem;
}

.profile-desc {
  color: var(--film-muted-light);
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.profile-contacts {
  display: grid;
  gap: 0.5rem;
}

.contact-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.contact-label {
  color: var(--film-muted-light);
  font-weight: 600;
  min-width: 4rem;
}

@media (max-width: 600px) {
  .profile-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .contact-row {
    justify-content: center;
  }
}
</style>
