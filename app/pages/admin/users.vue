<script setup lang="ts">
/**
 * 用户管理页 (admin/users.vue)
 *
 * 耦合关系：
 *   - server/api/admin/users.get.ts → 通过 useFetch 获取用户列表
 *   - 环境变量 AUTH_SEED_ADMIN_USERNAME → 首次初始化管理员账号
 *
 * 函数表：
 *   - AdminUser  → 管理后台用户类型定义
 *   - formatTime() → 格式化 ISO 时间为本地可读字符串
 */
interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

useHead({ title: "用户管理 - TY's Blog" });

const { data: users, pending, error } = await useFetch<AdminUser[]>("/api/admin/users", {
  default: () => [],
});

function formatTime(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">ACCOUNT</p>
      <h1>用户管理</h1>
      <p class="admin-subtitle">展示系统用户与权限信息。默认管理员可通过 AUTH_SEED_ADMIN_USERNAME 初始化。</p>
    </header>

    <main class="admin-main">
      <div class="admin-panel">
        <h2>用户列表</h2>
        <p v-if="pending" class="hint-text">加载中...</p>
        <p v-else-if="error" class="hint-text">加载失败：{{ error.message }}</p>
        <div v-else-if="users.length === 0" class="hint-text">
          暂无用户记录，请先登录或配置初始化管理员账号。
        </div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>用户</th>
                <th>角色</th>
                <th>账号</th>
                <th>最近登录</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in users" :key="item.id">
                <td class="user-cell">
                  <div class="user-avatar">{{ item.displayName.slice(0, 1).toUpperCase() }}</div>
                  <div>
                    <strong>{{ item.displayName }}</strong>
                    <small>#{{ item.id }}</small>
                  </div>
                </td>
                <td>
                  <span class="tag-badge" :class="{ 'tag-admin': item.role === 'admin' }">
                    {{ item.role }}
                  </span>
                </td>
                <td>@{{ item.username }}</td>
                <td>{{ formatTime(item.lastLoginAt) }}</td>
              </tr>
            </tbody>
          </table>
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
.hint-text {
  color: var(--film-paper-soft);
}

.table-wrap {
  overflow-x: auto;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-cell small {
  display: block;
  color: var(--film-paper-soft);
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(183, 140, 77, 0.3);
  color: var(--film-paper);
  font-size: 0.78rem;
  font-weight: 700;
}

.tag-admin {
  background: rgba(183, 140, 77, 0.35);
}

@media (max-width: 600px) {
  .user-cell {
    min-width: 10rem;
  }
}
</style>
