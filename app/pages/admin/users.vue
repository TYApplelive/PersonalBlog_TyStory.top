<script setup lang="ts">
/**
 * 用户管理页 (admin/users.vue)
 *
 * 提供用户的增删改查功能。管理员可以创建、编辑、删除用户。
 *
 * 耦合关系：
 *   - server/api/admin/users/index.get.ts → 获取用户列表
 *   - server/api/admin/users/create.post.ts → 创建用户
 *   - server/api/admin/users/[id].patch.ts → 更新用户
 *   - server/api/admin/users/[id].delete.ts → 删除用户
 */
interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

useHead({ title: "用户管理 - TY's Blog" });

const toast = useToast();

// 当前登录用户信息（用于防止删除自己）
const { user: currentUser } = useUserSession();

const { data: users, pending, error, refresh } = await useFetch<AdminUser[]>("/api/admin/users", {
  default: () => [],
});

console.log('[Users] 当前登录用户:', currentUser.value?.username);

/** 格式化时间（SQLite UTC → 北京时间） */
function formatTime(value: string) {
  if (!value) return "-";
  // SQLite CURRENT_TIMESTAMP 返回 UTC，形如 "2026-05-01 15:16:03"，追加 Z 使其按 UTC 解析
  const date = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
}

// ===== 弹窗状态 =====
const showModal = ref(false);
const modalMode = ref<"create" | "edit">("create");
const editingUserId = ref("");

// 表单
const formUsername = ref("");
const formDisplayName = ref("");
const formPassword = ref("");
const formRole = ref<"admin" | "user">("user");

// 提交状态
const submitting = ref(false);
const deletingId = ref("");

/** 打开新建用户弹窗 */
function openCreate() {
  modalMode.value = "create";
  editingUserId.value = "";
  formUsername.value = "";
  formDisplayName.value = "";
  formPassword.value = "";
  formRole.value = "user";
  showModal.value = true;
  console.log('[Users] 打开新建用户弹窗');
}

/** 打开编辑用户弹窗 */
function openEdit(user: AdminUser) {
  modalMode.value = "edit";
  editingUserId.value = user.id;
  formUsername.value = user.username;
  formDisplayName.value = user.displayName;
  formPassword.value = "";
  formRole.value = user.role;
  showModal.value = true;
  console.log('[Users] 打开编辑用户弹窗:', user.username);
}

/** 关闭弹窗 */
function closeModal() {
  showModal.value = false;
}

/** 提交表单（创建或更新） */
async function submitForm() {
  if (modalMode.value === "create" && !formPassword.value) {
    toast.error("验证错误", "密码为必填项");
    return;
  }

  submitting.value = true;
  console.log(`[Users] ${modalMode.value === 'create' ? '创建' : '更新'}用户:`, formUsername.value);

  try {
    if (modalMode.value === "create") {
      await $fetch("/api/admin/users/create", {
        method: "POST",
        body: {
          username: formUsername.value,
          displayName: formDisplayName.value,
          password: formPassword.value,
          role: formRole.value,
        },
      });
      toast.success("创建成功", `用户「${formDisplayName.value || formUsername.value}」已创建`);
      console.log('[Users] 用户创建成功');
    } else {
      const body: Record<string, string> = {};
      if (formDisplayName.value) body.displayName = formDisplayName.value;
      if (formRole.value) body.role = formRole.value;
      if (formPassword.value) body.password = formPassword.value;

      await $fetch(`/api/admin/users/${editingUserId.value}`, {
        method: "PATCH",
        body,
      });
      toast.success("更新成功", `用户信息已更新`);
      console.log('[Users] 用户更新成功, ID:', editingUserId.value);
    }

    closeModal();
    await refresh();
  } catch (error: any) {
    console.error('[Users] 提交失败:', error);
    toast.error("操作失败", error?.data?.message || error?.message || "未知错误");
  } finally {
    submitting.value = false;
  }
}

/** 删除用户 */
async function confirmDelete(user: AdminUser) {
  if (!window.confirm(`确定要删除用户「${user.displayName}」(@${user.username}) 吗？此操作不可恢复！`)) return;

  deletingId.value = user.id;
  console.log('[Users] 删除用户:', user.username);

  try {
    await $fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    toast.success("删除成功", `用户「${user.displayName}」已删除`);
    console.log('[Users] 用户删除成功');
    await refresh();
  } catch (error: any) {
    console.error('[Users] 删除失败:', error);
    toast.error("删除失败", error?.data?.message || error?.message || "未知错误");
  } finally {
    deletingId.value = "";
  }
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">ACCOUNT</p>
      <h1>用户管理</h1>
      <p class="admin-subtitle">管理系统用户，包括创建、编辑、删除用户以及权限分配。</p>
    </header>

    <main class="admin-main">
      <!-- 顶部操作栏 -->
      <div class="users-toolbar">
        <span class="users-count">{{ users.length }} 个用户</span>
        <button class="btn btn-primary" @click="openCreate">+ 新建用户</button>
      </div>

      <!-- 加载/错误状态 -->
      <p v-if="pending" class="hint-text">加载中...</p>
      <p v-else-if="error" class="hint-text error">加载失败：{{ error.message }}</p>

      <!-- 用户列表 -->
      <div v-else-if="users.length > 0" class="admin-panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>用户</th>
                <th>角色</th>
                <th>账号</th>
                <th>最近登录</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in users" :key="item.id">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">{{ item.displayName.slice(0, 1).toUpperCase() }}</div>
                    <div>
                      <strong>{{ item.displayName }}</strong>
                      <small>#{{ item.id }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="tag-badge" :class="{ 'tag-admin': item.role === 'admin' }">
                    {{ item.role === 'admin' ? '管理员' : '用户' }}
                  </span>
                </td>
                <td>@{{ item.username }}</td>
                <td class="time-cell">{{ formatTime(item.lastLoginAt as string) }}</td>
                <td>
                  <div class="actions-cell">
                    <button class="btn btn-secondary btn-sm" @click="openEdit(item)">编辑</button>
                    <button class="btn btn-danger btn-sm"
                      :disabled="deletingId === item.id || currentUser?.id === item.id" @click="confirmDelete(item)"
                      :title="currentUser?.id === item.id ? '不能删除自己' : '删除用户'">
                      {{ deletingId === item.id ? '...' : '删除' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="admin-panel">
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <div class="empty-text">暂无用户记录</div>
          <p class="empty-hint">点击上方「新建用户」按钮添加用户。</p>
        </div>
      </div>

      <!-- 权限说明 -->
      <div class="admin-panel">
        <h2>权限说明</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>模块</th>
              <th>管理员</th>
              <th>普通用户</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>文章管理</td>
              <td><span class="tag-badge tag-admin">完全访问</span></td>
              <td><span class="tag-badge">只读</span></td>
              <td style="color:var(--film-paper-soft);font-size:0.9rem;">管理员可创建/编辑/删除文章</td>
            </tr>
            <tr>
              <td>分类与标签</td>
              <td><span class="tag-badge tag-admin">完全访问</span></td>
              <td><span class="tag-badge">只读</span></td>
              <td style="color:var(--film-paper-soft);font-size:0.9rem;">管理员可删除标签</td>
            </tr>
            <tr>
              <td>系统设置</td>
              <td><span class="tag-badge tag-admin">完全访问</span></td>
              <td><span class="tag-badge">禁止</span></td>
              <td style="color:var(--film-paper-soft);font-size:0.9rem;">仅管理员可修改系统配置</td>
            </tr>
            <tr>
              <td>用户管理</td>
              <td><span class="tag-badge tag-admin">完全访问</span></td>
              <td><span class="tag-badge">禁止</span></td>
              <td style="color:var(--film-paper-soft);font-size:0.9rem;">仅管理员可管理用户</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- 新建/编辑用户弹窗 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay">
          <div class="modal-panel">
            <div class="modal-header">
              <h3>{{ modalMode === 'create' ? '新建用户' : '编辑用户' }}</h3>
              <button class="modal-close" @click="closeModal">x</button>
            </div>

            <div class="modal-body">
              <label class="form-group">
                <span>用户名</span>
                <input v-model="formUsername" type="text" class="form-input" :disabled="modalMode === 'edit'"
                  placeholder="登录用户名">
              </label>
              <label class="form-group">
                <span>显示名称</span>
                <input v-model="formDisplayName" type="text" class="form-input" placeholder="显示在界面上的名称">
              </label>
              <label class="form-group">
                <span>密码{{ modalMode === 'edit' ? '（留空不修改）' : '' }}</span>
                <input v-model="formPassword" type="password" class="form-input"
                  :placeholder="modalMode === 'edit' ? '留空则不修改密码' : '输入密码'">
              </label>
              <label class="form-group">
                <span>角色</span>
                <select v-model="formRole" class="form-input">
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </label>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeModal">取消</button>
              <button class="btn btn-primary" :disabled="submitting" @click="submitForm">
                {{ submitting ? '提交中...' : (modalMode === 'create' ? '创建' : '保存') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.hint-text {
  color: var(--film-paper-soft);
}

.hint-text.error {
  color: #e07a7a;
}

.users-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.users-count {
  color: var(--film-muted);
  font-size: 0.9rem;
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

.actions-cell {
  display: flex;
  gap: 0.5rem;
  white-space: nowrap;
}

.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.82rem;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background: rgba(20, 12, 9, 0.65);
  backdrop-filter: blur(4px);
}

.modal-panel {
  width: min(480px, 92vw);
  border: 1px solid rgba(183, 140, 77, 0.35);
  border-radius: 20px;
  background: var(--film-dark, #140c09);
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid rgba(183, 140, 77, 0.15);
}

.modal-header h3 {
  margin: 0;
  color: var(--film-gold-soft);
  font-size: 1.1rem;
}

.modal-close {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(183, 140, 77, 0.25);
  border-radius: 50%;
  background: transparent;
  color: var(--film-paper-soft);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(180, 60, 60, 0.3);
  border-color: rgba(180, 60, 60, 0.5);
  color: #e07a7a;
}

.modal-body {
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
}

.modal-body .form-group {
  display: grid;
  gap: 0.35rem;
}

.modal-body .form-group span {
  color: var(--film-muted-light);
  font-size: 0.85rem;
  font-weight: 600;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(183, 140, 77, 0.15);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* 过渡动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-panel {
  animation: modalIn 0.25s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(10px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 复用空状态 */
.empty-state {
  text-align: center;
  padding: 1.5rem;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.empty-text {
  font-size: 1.05rem;
  color: var(--film-paper-soft);
  margin-bottom: 0.3rem;
}

.empty-hint {
  color: var(--film-muted);
  font-size: 0.85rem;
  margin: 0;
}

@media (max-width: 600px) {
  .user-cell {
    min-width: 10rem;
  }

  .actions-cell {
    flex-direction: column;
  }
}
</style>
