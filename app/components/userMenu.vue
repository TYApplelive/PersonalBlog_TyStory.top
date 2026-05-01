<script setup lang="ts">
/**
 * 顶部用户菜单：聚合用户信息入口、切换账号与退出。
 */
const { user } = useUserSession();
const { logout, switchAccount } = useAuthActions();

const isOpen = ref(false);
const isAdmin = computed(() => user.value?.role === "admin");
const displayName = computed(() => user.value?.displayName || user.value?.username || "已登录");

function closeMenu() {
  isOpen.value = false;
}

async function onLogout() {
  closeMenu();
  await logout("/");
}

async function onSwitchAccount() {
  closeMenu();
  await switchAccount();
}
</script>

<template>
  <div class="user-menu" :class="{ 'is-open': isOpen }" @mouseleave="closeMenu">
    <button type="button" class="user-trigger" @click="isOpen = !isOpen">
      <span class="user-avatar user-avatar-fallback">{{ displayName.slice(0, 1).toUpperCase() }}</span>
      <span class="user-name">{{ displayName }}</span>
    </button>

    <div class="user-dropdown">
        <div class="dropdown-head">
          <strong>{{ displayName }}</strong>
          <small>@{{ user?.username || "-" }}</small>
        </div>

      <NuxtLink class="dropdown-item" to="/account" @click="closeMenu">用户中心</NuxtLink>
      <NuxtLink class="dropdown-item" to="/account/profile" @click="closeMenu">用户信息</NuxtLink>
      <NuxtLink class="dropdown-item" to="/account/security" @click="closeMenu">安全与会话</NuxtLink>
      <NuxtLink v-if="isAdmin" class="dropdown-item" to="/admin" @click="closeMenu">管理中心</NuxtLink>
      <button type="button" class="dropdown-item" @click="onSwitchAccount">切换账号</button>
      <button type="button" class="dropdown-item danger" @click="onLogout">退出登录</button>
    </div>
  </div>
</template>

<style scoped>
.user-menu {
  position: relative;
}

.user-menu::before {
  content: "";
  position: absolute;
  inset: 0;
  top: 100%;
  height: 0.55rem;
  z-index: 1;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  border-radius: 999px;
  border: 1px solid rgba(214, 188, 132, 0.24);
  background: rgba(255, 244, 222, 0.08);
  padding: 0.45rem 0.8rem;
  color: var(--film-paper);
  cursor: pointer;
}

.user-avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
}

.user-avatar-fallback {
  display: inline-grid;
  place-items: center;
  background: rgba(214, 188, 132, 0.25);
  color: var(--film-paper);
  font-size: 0.78rem;
  font-weight: 700;
}

.user-name {
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
}

.user-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 0.55rem);
  min-width: 13rem;
  border: 1px solid rgba(214, 188, 132, 0.26);
  border-radius: 8px;
  background: rgba(34, 22, 18, 0.98);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35);
  padding: 0.5rem;
  z-index: 200;
  opacity: 0;
  transform: translateY(5px);
  pointer-events: none;
  transition: all 0.16s ease;
}

.user-menu:hover .user-dropdown,
.user-menu:focus-within .user-dropdown,
.user-menu.is-open .user-dropdown {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.dropdown-head {
  display: grid;
  gap: 0.1rem;
  border-bottom: 1px solid rgba(214, 188, 132, 0.2);
  padding: 0.5rem 0.6rem 0.6rem;
  margin-bottom: 0.35rem;
}

.dropdown-head strong {
  color: var(--film-paper);
  font-size: 0.95rem;
}

.dropdown-head small {
  color: var(--film-paper-soft);
}

.dropdown-item {
  width: 100%;
  display: block;
  border: none;
  border-radius: 9px;
  padding: 0.5rem 0.65rem;
  background: transparent;
  color: var(--film-paper-soft);
  text-align: left;
  cursor: pointer;
  font-size: 0.9rem;
}

.dropdown-item:hover {
  color: var(--film-paper);
  background: rgba(214, 188, 132, 0.12);
}

.dropdown-item.danger {
  color: #e8a4a4;
}

</style>
