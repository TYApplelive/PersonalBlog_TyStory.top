/**
 * 首页配置数据
 */

import type { SiteAction, TechCard } from "~/stores/site";

export const homeConfig = {
  seoTitle: "首页",
  kicker: "ACT II / SECOND CUT",
  title: "TY's Blog",
  subtitle: "不是文章目录页，更像一张正在补完的个人片头。",
  intro:
    "这里记录技术、建站、重做与重新开始。第一版没有留下来，现在这版网站算是从头再搭一次，但这次会更像我自己。",
  badges: ["学生", "写程序的人", "白羊座"],

  ctas: [
    { label: "建站记事", to: "/about", variant: "primary" },
    { label: "进入博客", to: "/blog", variant: "secondary" },
  ] as SiteAction[],

  poster: {
    label: "Now Showing",
    titleLabel: "Feature Title",
    title: "第二版，继续放映",
    body: "这个网站不打算做成文件夹式入口。首页先负责气氛和自我表达，文章留给博客页继续展开。",
  },

  notes: [
    "博客入口会一直保留，但不再占据首页全部叙事重心。",
    "首页先讲风格、路径和正在发生的事情，再把细节留给内页。",
    "整体继续保持旧纸张、复古字幕和胶片气质。",
  ],

  techReel: {
    label: "Tech Reel",
    title: "现在关注的技术方向",
    body: "这一块不再当简历摘要，而是摆成几张正在推进的技术卡片。内容偏向底层理解、个人工具和站点本身的迭代。",
    actionLabel: "Read The Story",
    cards: [
      {
        id: "core-lane",
        kicker: "Core Lane",
        title: "C / C++ 与嵌入式",
        summary: "继续保留底层视角。写驱动、串口、设备联调这类事情时，耐心和稳定性比花哨更重要。",
        status: "近期关注外设通信、状态机拆分和调试可读性。",
      },
      {
        id: "tool-pass",
        kicker: "Tool Pass",
        title: "Python 小工具",
        summary: "把重复步骤做成脚本，比手动来回点更划算。重点不是炫技，是省时间。",
        status: "现在更偏向数据整理、文件处理和本地自动化。",
      },
      {
        id: "frontend-cut",
        kicker: "Frontend Cut",
        title: "Vue / Nuxt",
        summary: "把个人站继续打磨成完整作品。结构、状态、视觉三件事要同时成立。",
        status: "本轮重点在 Pinia 收口、组件解耦和响应式细化。",
      },
      {
        id: "next-frame",
        kicker: "Next Frame",
        title: "站点重构",
        summary: "博客页保留阅读功能，但首页不再退回普通文章目录，继续沿电影感方向推进。",
        status: "当前正在补首页抽屉交互、详情阅读页和小屏布局。",
      },
    ] as TechCard[],
  },
};