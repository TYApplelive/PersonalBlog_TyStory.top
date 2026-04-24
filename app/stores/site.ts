/**
 * 站点状态管理 (site.ts)
 *
 * 耦合关系：
 *   - utils/site-data/* → 导入所有静态配置数据
 *   - 所有页面和组件    → 通过 useSiteStore() 消费
 *
 * 导出函数表：
 *   - useSiteStore(): 获取站点状态 Store 实例
 *
 * Store 内部 getters：
 *   - getHoveredContact    → 当前悬停的联系方式 key
 *   - getHoveredContactItem→ 当前悬停的联系方式详情
 *   - isGameDrawerOpen     → 游戏抽屉是否展开
 *   - getActiveGame        → 当前选中的游戏
 *   - getBlogPosts         → 博客文章列表
 *   - getGameOrderedList   → 按 order 排序的游戏列表
 *   - getTechReelCards     → 技术展示卡片列表
 *
 * Store 内部 actions：
 *   - setHoveredContact(contact)     → 设置悬停联系方式
 *   - initializeGameEnvelopeLayout()  → 初始化游戏信封布局
 *   - toggleGameDrawer(force?)        → 切换游戏抽屉
 *   - bringGameToFront(gameId)        → 将游戏卡牌置于顶层
 *   - openGameEnvelope(gameId)        → 打开指定游戏信封
 *   - updateGameCardPosition(id, pos) → 更新卡牌位置
 *   - getBlogPostBySlug(slug)      → 按 slug 查找博客文章
 *   - loadBlogPosts()                 → 预留：从 API 加载文章
 */

import { defineStore } from "pinia";
import {
  brandConfig,
  navigationItems,
  adminNavItem,
  contactOrder,
  contactsData,
  homeConfig,
  aboutConfig,
  gameLifeConfig,
  blogConfig,
  footerConfig,
  techStack,
} from "~/utils/site-data";

// 联系方式类型
export type ContactKey = "github" | "qq" | "wechat";

// 操作按钮接口
export interface SiteAction { label: string; to: string; variant: "primary" | "secondary" }
// 关于页章节接口
export interface SiteAboutChapter { label: string; title: string; body: string }
// 联系方式接口
export interface ContactItem { label: string; value: string; href?: string }
// 技术卡片接口
export interface TechCard { id: string; kicker: string; title: string; summary: string; status: string }
// 灵感项接口
export interface InspirationItem { id: string; type: "movie" | "music" | "book" | "quote"; title: string; subtitle?: string; description: string; year?: string }

// 游戏条目接口
export interface GameEntry {
  id: string;
  title: string;
  genre: string;
  hours: string;
  years: string;
  hook: string;
  intro: string;
  note: string;
  lane: 1 | 2 | 3;
  order: number;
  angle: string;
  x: number;
  y: number;
  zIndex: number;
  sizeVariant?: "wide";
}

// 分散位置槽接口
export interface ScatterSlot { x: number; y: number; angle: string }
// 博客装饰接口
export interface BlogOrnament { id: string; label: string; value: string }
// 博客文章接口
export interface BlogPost { title: string; date: string; excerpt: string; content: string; readTime: string; tags: string[]; path: string }

// 数值钳制：限制百分比在 [0, 100] 范围内
const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export const useSiteStore = defineStore("site", {
  // 状态定义
  state: () => ({
    brand: brandConfig,
    nav: adminNavItem ? [...navigationItems, adminNavItem] : navigationItems,
    contactOrder,
    home: homeConfig,
    about: aboutConfig,
    contacts: contactsData,
    footer: footerConfig,
    stack: techStack,
    gameLife: {
      ...gameLifeConfig,
      drawerOpen: false,
      hasInitializedLayout: false,
      activeGameId: "ready-or-not",
    },
    blog: blogConfig,
    blogPosts: [] as BlogPost[],
    ui: {
      hoveredContact: null as ContactKey | null,
    },
  }),

  // 计算属性
  getters: {
    getHoveredContact: (state) => state.ui.hoveredContact,
    getHoveredContactItem: (state) => {
      if (!state.ui.hoveredContact) return null;
      return state.contacts[state.ui.hoveredContact];
    },
    isGameDrawerOpen: (state) => state.gameLife.drawerOpen,
    getActiveGame: (state) =>
      state.gameLife.games.find((game: GameEntry) => game.id === state.gameLife.activeGameId) ?? null,
    getBlogPosts: (state) => state.blogPosts,
    getGameOrderedList: (state) =>
      [...state.gameLife.games].sort((a: GameEntry, b: GameEntry) => a.order - b.order),
    getTechReelCards: (state) => state.home.techReel.cards,
  },

  // 方法定义
  actions: {
    // 设置悬停的联系方式
    setHoveredContact(contact: ContactKey | null) {
      this.ui.hoveredContact = contact;
    },

    // 初始化游戏信封布局：随机打乱位置槽并分配给游戏
    initializeGameEnvelopeLayout() {
      const slots = [...this.gameLife.scatterSlots];
      // Fisher-Yates 洗牌算法
      for (let index = slots.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        const temp = slots[index]!;
        slots[index] = slots[randomIndex]!;
        slots[randomIndex] = temp;
      }

      // 将打乱后的位置分配给每个游戏
      this.gameLife.games = this.gameLife.games.map((game: GameEntry, index: number) => {
        const slot = slots[index % slots.length];
        if (!slot) return game;
        return { ...game, x: slot.x, y: slot.y, angle: slot.angle, zIndex: index + 1 };
      });

      this.gameLife.hasInitializedLayout = true;
    },

    // 切换游戏抽屉开关
    toggleGameDrawer(force?: boolean) {
      const nextState = typeof force === "boolean" ? force : !this.gameLife.drawerOpen;
      // 首次打开时初始化布局
      if (nextState && !this.gameLife.hasInitializedLayout) {
        this.initializeGameEnvelopeLayout();
      }
      this.gameLife.drawerOpen = nextState;
    },

    // 将指定游戏卡牌置于最顶层
    bringGameToFront(gameId: string) {
      const nextZIndex = Math.max(...this.gameLife.games.map((game: GameEntry) => game.zIndex)) + 1;
      const targetGame = this.gameLife.games.find((game: GameEntry) => game.id === gameId);
      if (targetGame) targetGame.zIndex = nextZIndex;
    },

    // 打开指定游戏信封：设置活动游戏并展开抽屉
    openGameEnvelope(gameId: string) {
      if (!this.gameLife.hasInitializedLayout) this.initializeGameEnvelopeLayout();
      this.gameLife.activeGameId = gameId;
      this.gameLife.drawerOpen = true;
      this.bringGameToFront(gameId);
    },

    // 更新游戏卡牌位置：钳制百分比范围
    updateGameCardPosition(gameId: string, position: { x: number; y: number }) {
      const targetGame = this.gameLife.games.find((game: GameEntry) => game.id === gameId);
      if (!targetGame) return;
      targetGame.x = clampPercent(position.x);
      targetGame.y = clampPercent(position.y);
    },

    // 按 slug 查找博客文章
    getBlogPostBySlug(slug: string) {
      return this.blogPosts.find((post) => post.path === `/blog/${slug}`) ?? null;
    },

    // 预留：从 API 加载博客文章
    loadBlogPosts() {
      return;
    },
  },
});
