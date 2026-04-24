/**
 * 站点状态管理 (site.ts)
 * 
 * 职责：仅管理运行时 UI 状态和用户交互产生的动态数据
 * 静态配置数据已提取到 app/data/ 目录
 */

import { defineStore } from "pinia";
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
} from "~/utils/site-data";

export type ContactKey = "github" | "qq" | "wechat";

export interface SiteNavItem {
  label: string;
  to: string;
}

export interface SiteAction {
  label: string;
  to: string;
  variant: "primary" | "secondary";
}

export interface SiteAboutChapter {
  label: string;
  title: string;
  body: string;
}

export interface ContactItem {
  label: string;
  value: string;
  href?: string;
}

export interface TechCard {
  id: string;
  kicker: string;
  title: string;
  summary: string;
  status: string;
}

export interface InspirationItem {
  id: string;
  type: "movie" | "music" | "book" | "quote";
  title: string;
  subtitle?: string;
  description: string;
  year?: string;
}

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

export interface ScatterSlot {
  x: number;
  y: number;
  angle: string;
}

export interface BlogOrnament {
  id: string;
  label: string;
  value: string;
}

export interface BlogPost {
  id: number;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  readTime: string;
  tags: string[];
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export const useSiteStore = defineStore("site", {
  state: () => ({
    // ===== 静态配置数据（从 data 模块导入）=====
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
      // 以下为运行时状态
      drawerOpen: false,
      hasInitializedLayout: false,
      activeGameId: "ready-or-not",
    },
    blog: blogConfig,
    blogPosts: [] as BlogPost[],

    // ===== 纯 UI 状态（用户交互产生）=====
    ui: {
      hoveredContact: null as ContactKey | null,
    },
  }),

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

  actions: {
    setHoveredContact(contact: ContactKey | null) {
      this.ui.hoveredContact = contact;
    },

    initializeGameEnvelopeLayout() {
      const slots = [...this.gameLife.scatterSlots];

      for (let index = slots.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        const temp = slots[index]!;
        slots[index] = slots[randomIndex]!;
        slots[randomIndex] = temp;
      }

      this.gameLife.games = this.gameLife.games.map((game: GameEntry, index: number) => {
        const slot = slots[index % slots.length];
        if (!slot) return game;

        return {
          ...game,
          x: slot.x,
          y: slot.y,
          angle: slot.angle,
          zIndex: index + 1,
        };
      });

      this.gameLife.hasInitializedLayout = true;
    },

    toggleGameDrawer(force?: boolean) {
      const nextState = typeof force === "boolean" ? force : !this.gameLife.drawerOpen;

      if (nextState && !this.gameLife.hasInitializedLayout) {
        this.initializeGameEnvelopeLayout();
      }

      this.gameLife.drawerOpen = nextState;
    },

    bringGameToFront(gameId: string) {
      const nextZIndex = Math.max(...this.gameLife.games.map((game: GameEntry) => game.zIndex)) + 1;
      const targetGame = this.gameLife.games.find((game: GameEntry) => game.id === gameId);

      if (targetGame) {
        targetGame.zIndex = nextZIndex;
      }
    },

    openGameEnvelope(gameId: string) {
      if (!this.gameLife.hasInitializedLayout) {
        this.initializeGameEnvelopeLayout();
      }

      this.gameLife.activeGameId = gameId;
      this.gameLife.drawerOpen = true;
      this.bringGameToFront(gameId);
    },

    updateGameCardPosition(gameId: string, position: { x: number; y: number }) {
      const targetGame = this.gameLife.games.find((game: GameEntry) => game.id === gameId);
      if (!targetGame) return;

      targetGame.x = clampPercent(position.x);
      targetGame.y = clampPercent(position.y);
    },

    getBlogPostById(postId: number) {
      return this.blogPosts.find((post) => post.id === postId) ?? null;
    },

    loadBlogPosts() {
      // 预留：未来可从 API 加载
      return;
    },
  },
});
