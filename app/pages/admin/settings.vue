<script setup lang="ts">
/**
 * 系统设置页 (admin/settings.vue)
 *
 * 可编辑的系统配置面板，通过 API 读写 content/config/*.json 文件。
 *
 * 耦合关系：
 *   - server/api/admin/config/[type].get.ts  → 读取配置
 *   - server/api/admin/config/[type].post.ts → 保存配置
 *   - content/config/*.json                  → 持久化存储
 *
 * 函数表：
 *   - tabs          → 标签页列表
 *   - activeTab     → 当前激活标签
 *   - loadConfig()  → 从 API 加载指定类型配置
 *   - saveConfig()  → 保存配置到 API
 */
useHead({ title: '系统设置 - TY\'s Blog' });

const toast = useToast();

const tabs = ['站点信息', '导航配置', '页脚 & 联系方式', '博客配置', '图床配置', '系统参数'];
const activeTab = ref(0);

// ===== 各配置数据 =====
const siteConfig = ref<any>(null);
const navConfig = ref<any>(null);
const footerConfig = ref<any>(null);
const blogConfig = ref<any>(null);
const imgbedConfig = ref<any>(null);
const systemConfig = ref<any>(null);

const loading = ref(false);
const saving = ref(false);

/** 根据 tab 索引获取配置类型 */
function getConfigType(idx: number): string {
  const map = ['site', 'navigation', 'footer', 'blog', 'imgbed', 'system'];
  return map[idx];
}

/** 获取当前 tab 的配置数据 ref */
function getCurrentConfigRef(idx: number) {
  const refs: Record<string, any> = {
    site: siteConfig,
    navigation: navConfig,
    footer: footerConfig,
    blog: blogConfig,
    imgbed: imgbedConfig,
    system: systemConfig,
  };
  return refs[getConfigType(idx)];
}

/** 加载指定类型的配置 */
async function loadConfig(idx: number) {
  const type = getConfigType(idx);
  const configRef = getCurrentConfigRef(idx);

  // 已加载过则跳过
  if (configRef.value !== null) return;

  loading.value = true;
  console.log(`[Settings] 加载配置: ${type}`);
  try {
    configRef.value = await $fetch(`/api/admin/config/${type}`);
    console.log(`[Settings] 配置 ${type} 加载成功`);
  } catch (error: any) {
    console.error(`[Settings] 配置 ${type} 加载失败:`, error);
    // 404 表示文件不存在，给出友好提示
    if (error?.statusCode === 404) {
      toast.info('提示', `配置文件 ${type}.json 不存在，请先创建默认配置`);
    } else {
      toast.error('加载失败', error?.message || '未知错误');
    }
  } finally {
    loading.value = false;
  }
}

/** 保存当前 tab 的配置 */
async function saveCurrentConfig() {
  const type = getConfigType(activeTab.value);
  const configRef = getCurrentConfigRef(activeTab.value);

  if (!configRef.value) {
    toast.error('保存失败', '没有可保存的配置数据');
    return;
  }

  saving.value = true;
  console.log(`[Settings] 保存配置: ${type}`, configRef.value);
  try {
    await $fetch(`/api/admin/config/${type}`, {
      method: 'POST',
      body: configRef.value,
    });
    console.log(`[Settings] 配置 ${type} 保存成功`);
    toast.success('保存成功', `${type}.json 已更新`);
  } catch (error: any) {
    console.error(`[Settings] 配置 ${type} 保存失败:`, error);
    toast.error('保存失败', error?.data?.message || error?.message || '未知错误');
  } finally {
    saving.value = false;
  }
}

// 切换 tab 时自动加载配置
watch(activeTab, (newIdx) => {
  loadConfig(newIdx);
});

// 首次加载
onMounted(() => {
  loadConfig(activeTab.value);
});

// ===== 导航项操作方法 =====
function addNavItem() {
  if (!navConfig.value?.items) return;
  navConfig.value.items.push({ label: '', to: '/' });
}
function removeNavItem(index: number) {
  if (!navConfig.value?.items) return;
  navConfig.value.items.splice(index, 1);
}

// ===== 联系方式操作方法 =====
function addContact() {
  if (!footerConfig.value) return;
  const key = prompt('请输入联系方式键名（如 github、email）：');
  if (!key) return;
  if (!footerConfig.value.contacts) footerConfig.value.contacts = {};
  footerConfig.value.contacts[key] = { label: '', value: '', href: '' };
  if (!footerConfig.value.contactOrder) footerConfig.value.contactOrder = [];
  footerConfig.value.contactOrder.push(key);
}
function removeContact(key: string) {
  if (!footerConfig.value?.contacts) return;
  delete footerConfig.value.contacts[key];
  if (footerConfig.value.contactOrder) {
    footerConfig.value.contactOrder = footerConfig.value.contactOrder.filter((k: string) => k !== key);
  }
}

// ===== 首页 badges 操作方法 =====
function addBadge() {
  if (!siteConfig.value?.home?.badges) return;
  siteConfig.value.home.badges.push('');
}
function removeBadge(index: number) {
  if (!siteConfig.value?.home?.badges) return;
  siteConfig.value.home.badges.splice(index, 1);
}

// ===== 首页 CTAs 操作方法 =====
function addCta() {
  if (!siteConfig.value?.home?.ctas) return;
  siteConfig.value.home.ctas.push({ label: '', to: '/', variant: 'primary' });
}
function removeCta(index: number) {
  if (!siteConfig.value?.home?.ctas) return;
  siteConfig.value.home.ctas.splice(index, 1);
}
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <p class="eyebrow">SETTINGS</p>
      <h1>系统设置</h1>
      <p class="admin-subtitle">
        在线编辑站点配置，修改后即时保存到 <code>content/config/*.json</code>。重启服务器后部分配置需要重新加载。
      </p>
    </header>

    <main class="admin-main">
      <!-- 标签导航 -->
      <div class="tabs-row">
        <button v-for="(tab, idx) in tabs" :key="idx"
          :class="['tab-btn', { active: activeTab === idx }]"
          @click="activeTab = idx">
          {{ tab }}
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="admin-panel">
        <p class="hint-text">加载中...</p>
      </div>

      <!-- ===== Tab 0: 站点信息 ===== -->
      <template v-if="!loading && activeTab === 0 && siteConfig">
        <div class="admin-panel">
          <h2>品牌信息</h2>
          <div class="form-grid">
            <label class="form-group">
              <span>站点标题</span>
              <input v-model="siteConfig.brand.title" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>所有者</span>
              <input v-model="siteConfig.brand.owner" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>别名</span>
              <input v-model="siteConfig.brand.alias" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>眉文 (Eyebrow)</span>
              <input v-model="siteConfig.brand.eyebrow" type="text" class="form-input">
            </label>
          </div>
        </div>

        <div class="admin-panel">
          <h2>首页配置</h2>
          <div class="form-grid">
            <label class="form-group">
              <span>SEO 标题</span>
              <input v-model="siteConfig.home.seoTitle" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>Kicker</span>
              <input v-model="siteConfig.home.kicker" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>主标题</span>
              <input v-model="siteConfig.home.title" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>副标题</span>
              <input v-model="siteConfig.home.subtitle" type="text" class="form-input">
            </label>
            <label class="form-group full-width">
              <span>介绍文字</span>
              <textarea v-model="siteConfig.home.intro" rows="3" class="form-input"></textarea>
            </label>
          </div>

          <!-- Badges -->
          <h3 style="margin-top:1.5rem;">首页标签 (Badges)</h3>
          <div class="editable-list">
            <div v-for="(badge, i) in siteConfig.home.badges" :key="i" class="editable-row">
              <input v-model="siteConfig.home.badges[i]" type="text" class="form-input">
              <button class="btn btn-danger btn-sm" @click="removeBadge(i)">删除</button>
            </div>
            <button class="btn btn-secondary btn-sm" @click="addBadge">+ 添加标签</button>
          </div>

          <!-- CTAs -->
          <h3 style="margin-top:1.5rem;">CTA 按钮</h3>
          <div class="editable-list">
            <div v-for="(cta, i) in siteConfig.home.ctas" :key="i" class="editable-row">
              <input v-model="siteConfig.home.ctas[i].label" type="text" placeholder="按钮文字" class="form-input">
              <input v-model="siteConfig.home.ctas[i].to" type="text" placeholder="链接路径" class="form-input">
              <select v-model="siteConfig.home.ctas[i].variant" class="form-input" style="width:auto;">
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
              <button class="btn btn-danger btn-sm" @click="removeCta(i)">删除</button>
            </div>
            <button class="btn btn-secondary btn-sm" @click="addCta">+ 添加 CTA</button>
          </div>

          <!-- Poster -->
          <h3 style="margin-top:1.5rem;">海报 (Poster)</h3>
          <div class="form-grid">
            <label class="form-group">
              <span>标签</span>
              <input v-model="siteConfig.home.poster.label" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>标题标签</span>
              <input v-model="siteConfig.home.poster.titleLabel" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>标题</span>
              <input v-model="siteConfig.home.poster.title" type="text" class="form-input">
            </label>
            <label class="form-group full-width">
              <span>内容</span>
              <textarea v-model="siteConfig.home.poster.body" rows="3" class="form-input"></textarea>
            </label>
          </div>

          <!-- Notes -->
          <h3 style="margin-top:1.5rem;">首页备注 (Notes)</h3>
          <div class="editable-list">
            <div v-for="(note, i) in (siteConfig.home.notes || [])" :key="i" class="editable-row">
              <textarea v-model="siteConfig.home.notes[i]" rows="2" class="form-input"></textarea>
              <button class="btn btn-danger btn-sm" @click="siteConfig.home.notes.splice(i, 1)">删除</button>
            </div>
            <button class="btn btn-secondary btn-sm" @click="siteConfig.home.notes.push('')">+ 添加备注</button>
          </div>
        </div>

        <div class="admin-panel">
          <h2>关于页配置</h2>
          <div class="form-grid">
            <label class="form-group">
              <span>SEO 标题</span>
              <input v-model="siteConfig.about.seoTitle" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>区域标签</span>
              <input v-model="siteConfig.about.sectionLabel" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>标题</span>
              <input v-model="siteConfig.about.title" type="text" class="form-input">
            </label>
            <label class="form-group full-width">
              <span>导语</span>
              <textarea v-model="siteConfig.about.lead" rows="3" class="form-input"></textarea>
            </label>
          </div>

          <h3 style="margin-top:1.5rem;">章节 (Chapters)</h3>
          <div class="editable-list">
            <div v-for="(ch, i) in (siteConfig.about.chapters || [])" :key="i" class="editable-card">
              <div class="form-grid">
                <label class="form-group">
                  <span>标签</span>
                  <input v-model="siteConfig.about.chapters[i].label" type="text" class="form-input">
                </label>
                <label class="form-group">
                  <span>标题</span>
                  <input v-model="siteConfig.about.chapters[i].title" type="text" class="form-input">
                </label>
                <label class="form-group full-width">
                  <span>内容</span>
                  <textarea v-model="siteConfig.about.chapters[i].body" rows="3" class="form-input"></textarea>
                </label>
              </div>
              <button class="btn btn-danger btn-sm" @click="siteConfig.about.chapters.splice(i, 1)">删除章节</button>
            </div>
            <button class="btn btn-secondary btn-sm" @click="siteConfig.about.chapters.push({ label: '', title: '', body: '' })">
              + 添加章节
            </button>
          </div>
        </div>

        <button class="btn btn-primary btn-save" :disabled="saving" @click="saveCurrentConfig">
          {{ saving ? '保存中...' : '保存站点配置' }}
        </button>
      </template>

      <!-- ===== Tab 1: 导航配置 ===== -->
      <template v-if="!loading && activeTab === 1 && navConfig">
        <div class="admin-panel">
          <h2>导航菜单</h2>
          <p class="hint-text">管理主导航链接，修改后刷新页面生效。</p>
          <div class="editable-list">
            <div v-for="(item, i) in navConfig.items" :key="i" class="editable-row">
              <input v-model="navConfig.items[i].label" type="text" placeholder="显示名称" class="form-input">
              <input v-model="navConfig.items[i].to" type="text" placeholder="路径 (如 /blog)" class="form-input">
              <button class="btn btn-danger btn-sm" @click="removeNavItem(i)">删除</button>
            </div>
            <button class="btn btn-secondary btn-sm" @click="addNavItem">+ 添加导航项</button>
          </div>
        </div>
        <button class="btn btn-primary btn-save" :disabled="saving" @click="saveCurrentConfig">
          {{ saving ? '保存中...' : '保存导航配置' }}
        </button>
      </template>

      <!-- ===== Tab 2: 页脚 & 联系方式 ===== -->
      <template v-if="!loading && activeTab === 2 && footerConfig">
        <div class="admin-panel">
          <h2>页脚信息</h2>
          <div class="form-grid">
            <label class="form-group">
              <span>页脚标签</span>
              <input v-model="footerConfig.label" type="text" class="form-input">
            </label>
            <label class="form-group full-width">
              <span>描述文字</span>
              <textarea v-model="footerConfig.description" rows="2" class="form-input"></textarea>
            </label>
            <label class="form-group">
              <span>联系方式标签</span>
              <input v-model="footerConfig.contactLabel" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>结尾署名</span>
              <input v-model="footerConfig.ending" type="text" class="form-input">
            </label>
          </div>
        </div>

        <div class="admin-panel">
          <h2>联系方式</h2>
          <div class="editable-list">
            <div v-for="key in (footerConfig.contactOrder || [])" :key="key" class="editable-card">
              <h4>{{ key }}</h4>
              <div class="form-grid">
                <label class="form-group">
                  <span>显示名称</span>
                  <input v-model="footerConfig.contacts[key].label" type="text" class="form-input">
                </label>
                <label class="form-group">
                  <span>值</span>
                  <input v-model="footerConfig.contacts[key].value" type="text" class="form-input">
                </label>
                <label class="form-group">
                  <span>链接（可选）</span>
                  <input v-model="footerConfig.contacts[key].href" type="text" class="form-input">
                </label>
              </div>
              <button class="btn btn-danger btn-sm" @click="removeContact(key)">删除此联系方式</button>
            </div>
            <button class="btn btn-secondary btn-sm" @click="addContact">+ 添加联系方式</button>
          </div>
        </div>
        <button class="btn btn-primary btn-save" :disabled="saving" @click="saveCurrentConfig">
          {{ saving ? '保存中...' : '保存页脚配置' }}
        </button>
      </template>

      <!-- ===== Tab 3: 博客配置 ===== -->
      <template v-if="!loading && activeTab === 3 && blogConfig">
        <div class="admin-panel">
          <h2>博客展示配置</h2>
          <div class="form-grid">
            <label class="form-group">
              <span>SEO 标题</span>
              <input v-model="blogConfig.seoTitle" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>列表标签</span>
              <input v-model="blogConfig.listLabel" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>列表标题</span>
              <input v-model="blogConfig.listTitle" type="text" class="form-input">
            </label>
            <label class="form-group full-width">
              <span>列表导语</span>
              <textarea v-model="blogConfig.listLead" rows="2" class="form-input"></textarea>
            </label>
            <label class="form-group">
              <span>文章标签</span>
              <input v-model="blogConfig.articleLabel" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>文章眉文</span>
              <input v-model="blogConfig.articleEyebrow" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>文章角标</span>
              <input v-model="blogConfig.articleStamp" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>阅读标签</span>
              <input v-model="blogConfig.readLabel" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>返回标签</span>
              <input v-model="blogConfig.backLabel" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>空文章标题</span>
              <input v-model="blogConfig.emptyTitle" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>不可用日期</span>
              <input v-model="blogConfig.unavailableDate" type="text" class="form-input">
            </label>
          </div>
        </div>
        <button class="btn btn-primary btn-save" :disabled="saving" @click="saveCurrentConfig">
          {{ saving ? '保存中...' : '保存博客配置' }}
        </button>
      </template>

      <!-- ===== Tab 4: 图床配置 ===== -->
      <template v-if="!loading && activeTab === 4 && imgbedConfig">
        <div class="admin-panel">
          <h2>图床 API 配置</h2>
          <p class="hint-text">配置 CloudFlare ImgBed API 地址和访问令牌。</p>
          <div class="form-grid">
            <label class="form-group">
              <span>API URL</span>
              <input v-model="imgbedConfig.apiUrl" type="text" class="form-input" placeholder="https://ty-imgbed.pages.dev">
            </label>
            <label class="form-group">
              <span>API Token</span>
              <input v-model="imgbedConfig.token" type="password" class="form-input" placeholder="输入 API Token">
            </label>
          </div>
        </div>
        <button class="btn btn-primary btn-save" :disabled="saving" @click="saveCurrentConfig">
          {{ saving ? '保存中...' : '保存图床配置' }}
        </button>
      </template>

      <!-- ===== Tab 5: 系统参数 ===== -->
      <template v-if="!loading && activeTab === 5 && systemConfig">
        <div class="admin-panel">
          <h2>系统参数</h2>
          <p class="hint-text">修改系统级参数，部分参数重启后生效。</p>
          <div class="form-grid">
            <label class="form-group">
              <span>日志级别</span>
              <select v-model="systemConfig.logLevel" class="form-input">
                <option value="silent">Silent</option>
                <option value="error">Error</option>
                <option value="warn">Warn</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </label>
            <label class="form-group">
              <span>缓存策略</span>
              <select v-model="systemConfig.cacheStrategy" class="form-input">
                <option value="swr">SWR (Stale While Revalidate)</option>
                <option value="no-store">No Store</option>
              </select>
            </label>
            <label class="form-group">
              <span>博客列表缓存 (秒)</span>
              <input v-model.number="systemConfig.blogListCacheSeconds" type="number" class="form-input" min="0">
            </label>
            <label class="form-group">
              <span>博客详情缓存 (秒)</span>
              <input v-model.number="systemConfig.blogDetailCacheSeconds" type="number" class="form-input" min="0">
            </label>
            <label class="form-group">
              <span>图床 API URL</span>
              <input v-model="systemConfig.imgBedApiUrl" type="text" class="form-input">
            </label>
            <label class="form-group">
              <span>图床 Token</span>
              <input v-model="systemConfig.imgBedToken" type="password" class="form-input">
            </label>
          </div>
        </div>
        <button class="btn btn-primary btn-save" :disabled="saving" @click="saveCurrentConfig">
          {{ saving ? '保存中...' : '保存系统参数' }}
        </button>
      </template>

      <!-- 未加载/无数据 -->
      <div v-if="!loading && !getCurrentConfigRef(activeTab)" class="admin-panel">
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <div class="empty-text">暂无配置数据</div>
          <p class="empty-hint">配置文件可能不存在，请检查 content/config/ 目录。</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.tabs-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
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

.hint-text {
  color: var(--film-paper-soft);
  margin-bottom: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: grid;
  gap: 0.35rem;
}

.form-group span {
  color: var(--film-muted-light);
  font-size: 0.85rem;
  font-weight: 600;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.editable-list {
  display: grid;
  gap: 0.75rem;
}

.editable-row {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
}

.editable-card {
  padding: 1rem;
  border: 1px solid rgba(183, 140, 77, 0.18);
  border-radius: 12px;
  background: rgba(242, 221, 175, 0.03);
  display: grid;
  gap: 0.75rem;
}

.editable-card h4 {
  margin: 0;
  color: var(--film-gold-soft);
  font-size: 0.95rem;
  text-transform: capitalize;
}

.btn-save {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
}

.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.82rem;
}

/* 复用空状态样式 */
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

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .editable-row {
    flex-direction: column;
  }
}
</style>
