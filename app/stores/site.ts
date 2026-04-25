/**
 * 站点状态管理 (site.ts)
 *
 * 耦合关系：
 *   - app/site.config.ts          → 导入所有静态配置数据
 *   - shared/types/site.ts        → 导入所有类型定义
 *   - shared/utils/math.ts        → 导入数学工具函数
 *   - app/pages/*.vue             → 所有页面通过 useSiteStore() 消费
 *   - app/components/*.vue        → 组件通过 useSiteStore() 消费
 *
 * 导出函数表：
 *   - useSiteStore(): 获取站点状态 Store 实例
 *
 * Store 内部 getters：
 *   - getHoveredContact    → 当前悬停的联系方式 key
 *   - getHoveredContactItem→ 当前悬停的联系方式详情
 *   - isGameDrawerOpen     → 游戏抽屉是否展开
 *   - getActiveGame        → 当前选中的游戏
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
 */

import { defineStore } from "pinia";
import type { ContactKey, GameEntry } from "#shared/types/site";
import { clampPercent, generateScatterSlots } from "#shared/utils/math";
import {
  brandConfig,
  navigationItems,
  contactOrder,
  contactsData,
  homeConfig,
  aboutConfig,
  gameLifeConfig,
  blogConfig,
  footerConfig,
  techStack,
} from "@utils/site-data";

export const useSiteStore = defineStore("site", {
  // 状态定义
  state: () => ({
    brand: brandConfig,
    nav: navigationItems,
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

    // 初始化游戏信封布局：随机生成位置槽并分配给游戏
    initializeGameEnvelopeLayout() {
      // 动态生成随机槽位
      const slots = generateScatterSlots(this.gameLife.games.length, 12);

      // 将位置分配给每个游戏
      this.gameLife.games = this.gameLife.games.map((game: GameEntry, index: number) => {
        const slot = slots[index];
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
    updateGameCardPosition(gameId: string, position: { x: number; y: number; angle?: string; zIndex?: number }) {
      const targetGame = this.gameLife.games.find((game: GameEntry) => game.id === gameId);
      if (!targetGame) return;
      targetGame.x = clampPercent(position.x);
      targetGame.y = clampPercent(position.y);
      if (position.angle !== undefined) targetGame.angle = position.angle;
      if (position.zIndex !== undefined) targetGame.zIndex = position.zIndex;
    },
  },
});
