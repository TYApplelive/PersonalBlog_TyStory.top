/**
 * 站点静态配置数据 (site.config.ts)
 *
 * 耦合关系：
 *   - app/utils/site-data/index.ts → 从此文件导入数据并 re-export
 *   - app/stores/site.ts           → 从此文件导入数据初始化 state
 *   - shared/types/site.ts         → 导入所有类型定义
 *
 * 导出数据表：
 *   - brandConfig       → 品牌配置
 *   - navigationItems   → 导航菜单项
 *   - contactOrder      → 联系方式排列顺序
 *   - contactsData      → 联系方式详情
 *   - homeConfig        → 首页配置
 *   - aboutConfig       → 关于页配置
 *   - gameLifeConfig    → 游戏人生配置
 *   - blogConfig        → 博客配置
 *   - footerConfig      → 页脚配置
 *   - techStack         → 技术栈列表
 */

import type {
  BrandConfig,
  ContactItem,
  ContactKey,
  GameEntry,
  SiteAboutChapter,
  InspirationItem,
  SiteAction,
  TechCard,
  BlogOrnament,
  SiteNavItem,
} from "#shared/types/site";

export const brandConfig: BrandConfig = {
  title: "TY's Blog",
  owner: "TY",
  alias: "Applelive",
  eyebrow: "Applelive",
};

export const navigationItems: SiteNavItem[] = [
  { label: "首页", to: "/" },
  { label: "关于", to: "/about" },
  { label: "博客", to: "/blog" },
];

export const contactOrder: ContactKey[] = ["github", "qq", "wechat"];

export const contactsData: Record<ContactKey, ContactItem> = {
  github: {
    label: "GitHub",
    value: "TYApplelive",
    href: "https://github.com/TYApplelive",
  },
  qq: {
    label: "QQ",
    value: "2623999208",
  },
  wechat: {
    label: "微信",
    value: "applelive2003",
  },
};

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

export const aboutConfig = {
  seoTitle: "关于",
  sectionLabel: "About This Site",
  title: "这个网站为什么会存在",
  lead: "比起把这里写成标准的个人简介，我更想讲清楚这个网站是怎么来的。它的存在过程，本身就是这一页最重要的内容。",

  chapters: [
    {
      label: "Scene 01",
      title: "我是谁",
      body: "我是 TY，ID 是 Applelive，目前还是学生。平时喜欢写程序，也会一直关注自己真正想做的网站应该是什么样子。技术方向主要围绕 C、C++、嵌入式开发、Python、Vue 和 Dart 展开。",
    },
    {
      label: "Scene 02",
      title: "这个网站从哪里开始",
      body: "最早是在大一的时候，基于别人的框架做过一个网站。后来越来越觉得，与其一直借别人的骨架，不如认真写一个属于自己的版本，所以才有了后来自己重做站点的想法。",
    },
    {
      label: "Scene 03",
      title: "为什么现在是第二版",
      body: "第一版因为服务器到期，再加上当时学业和比赛都比较忙，没有继续续费，后面的数据和文案也没有保存下来。所以现在这个网站其实是第二版，相当于从头重新开始，但这次会更明确地把它做成自己的样子。",
    },
  ] as SiteAboutChapter[],

  note: {
    label: "Director's Note",
    quote: "第一版已经消失了，所以第二版不假装一切都还在，而是承认它从头开始，然后认真地重写。",
    body: "这一页不需要把自己写成简历，只需要把这个站点存在的原因讲清楚。它既是技术练习，也是一次重新搭建个人表达空间的过程。",
  },

  inspirationLabel: "Inspiration",
  inspirations: [
    {
      id: "insp-1",
      type: "movie",
      title: "一一",
      subtitle: "杨德昌",
      year: "2000",
      description: "对日常细节的耐心观察，会直接影响我对页面节奏和留白的判断。",
    },
    {
      id: "insp-2",
      type: "music",
      title: "Midnight City",
      subtitle: "M83",
      year: "2011",
      description: "复古、电子、怀旧，但不是停在过去，这种感觉和站点方向很接近。",
    },
    {
      id: "insp-3",
      type: "book",
      title: "禅与摩托车维修艺术",
      year: "1974",
      description: "技术和表达不是对立面，真正麻烦的是只做一半。",
    },
    {
      id: "insp-4",
      type: "quote",
      title: "慢慢来，比快更稳",
      description: "先把重要的部分做对，再考虑做多。这个站点也按这个节奏往前推。",
    },
  ] as InspirationItem[],
};

export const gameLifeConfig = {
  label: "GameLife",
  title: "GameLife",
  subtitle: "从这份游戏库里能看出，你的重心很明确地落在 FPS、动作冒险、模拟经营和能长期投入的单机内容上。这里先挑几封更能代表你游戏轨迹的信封。",
  openLabel: "Open Drawer",
  closeLabel: "Close Drawer",
  drawerHint: "拖动桌面上的卡片可以调整位置，点击任意卡片会切换上方的游戏介绍。",

  games: [
    {
      id: "cs2",
      title: "CS2",
      genre: "FPS / Competitive",
      hours: "2559.3h",
      years: "绝对主力位",
      hook: "这几乎就是你游戏库的中心轴，说明你对枪感、对抗、熟练度积累和长期重复打磨有非常高的耐受度。",
      intro: "《CS2》是 Valve 推出的经典竞技射击续作，核心围绕经济系统、道具协作、地图理解和纯粹枪法展开。它要求玩家在短时间内做出稳定判断，也很容易形成长期投入。",
      note: "这里先放你的心得占位。后面你可以补最熟的地图、最顺手的枪械，或者你为什么能在这种高重复对抗里持续投入这么长时间。",
      lane: 1,
      order: 1,
      angle: "-7deg",
      x: 3,
      y: 6,
      zIndex: 2,
      sizeVariant: "wide",
    },
    {
      id: "hunt-showdown-1896",
      title: "猎杀：对决 1896",
      genre: "FPS / Extraction",
      hours: "155.3h",
      years: "高压狩猎位",
      hook: "这类高风险撤离射击能打到这个时长，说明你不只喜欢纯竞技，也吃\"紧张感 + 决策成本 + 环境压力\"这一套。",
      intro: "《猎杀：对决 1896》把 PvPvE、撤离玩法和恐怖氛围揉在一起。它比传统竞技 FPS 更强调听觉判断、潜行、时机和每一次行动的代价感。",
      note: "这里先放你的心得占位。后面可以补你最熟的武器体系、最喜欢的交火方式，或者为什么这种慢节奏但高压力的对抗会一直吸引你。",
      lane: 2,
      order: 2,
      angle: "6deg",
      x: 35,
      y: 12,
      zIndex: 4,
    },
    {
      id: "ready-or-not",
      title: "严阵以待",
      genre: "Tactical FPS",
      hours: "93.8h",
      years: "战术执行位",
      hook: "这说明你偏爱的 FPS 不只是拼反应，也包括有节奏控制、清点推进和团队执行感的战术玩法。",
      intro: "《严阵以待》是一款强调 CQB 清点、目标优先级和队伍协作的战术射击游戏。相比快节奏竞技，它更重视观察、指令、推进路线和每一步的稳定执行。",
      note: "这里先放你的心得占位。后面可以补最喜欢的任务类型、最常用的装备，或者你觉得它和传统多人 FPS 最大的差别是什么。",
      lane: 3,
      order: 3,
      angle: "5deg",
      x: 69,
      y: 10,
      zIndex: 5,
    },
    {
      id: "yijian-fengyunjue",
      title: "逸剑风云决",
      genre: "Martial Arts RPG",
      hours: "121.2h",
      years: "武侠沉浸位",
      hook: "它说明你的偏好并不只有枪和对抗，你也愿意为世界观、成长线和探索节奏去沉下心打长线单机。",
      intro: "《逸剑风云决》是一款带传统武侠气质的角色扮演游戏，玩法结合探索、养成、剧情推进和战斗策略。吸引力更多来自江湖氛围、门派路线和角色成长。",
      note: "这里先放你的心得占位。后面你可以写最喜欢的门派路线、角色 build，或者为什么这类武侠 RPG 能让你投入到百小时上下。",
      lane: 1,
      order: 4,
      angle: "-4deg",
      x: 8,
      y: 39,
      zIndex: 3,
      sizeVariant: "wide",
    },
    {
      id: "prison-architect",
      title: "监狱建筑师",
      genre: "Management Sim",
      hours: "78.7h",
      years: "经营规划位",
      hook: "你并不只追求即时反馈，也愿意把时间放进系统运转、资源规划和宏观调度里。",
      intro: "《监狱建筑师》是一款以建造与管理为核心的模拟经营游戏。玩家需要规划监狱结构、控制预算、处理囚犯需求与秩序，乐趣来自系统联动和持续优化。",
      note: "这里先放你的心得占位。后面可以改成你最满意的一版布局、最容易翻车的问题，或者你为什么会喜欢这种慢热但很有掌控感的经营过程。",
      lane: 2,
      order: 5,
      angle: "-3deg",
      x: 42,
      y: 43,
      zIndex: 2,
    },
    {
      id: "red-dead-redemption-2",
      title: "荒野大镖客：救赎2",
      genre: "Open World Action",
      hours: "76.1h",
      years: "叙事沉浸位",
      hook: "这说明你也会为强叙事、角色塑造和世界沉浸感留出很长时间，不只是追求系统层面的反馈。",
      intro: "《荒野大镖客：救赎2》以开放世界、电影化叙事和高沉浸质感著称。它的魅力不只在主线剧情，也在环境细节、角色关系和完整的西部氛围。",
      note: "这里先放你的心得占位。后面可以补最喜欢的剧情段落、最喜欢的区域，或者为什么这种节奏偏慢但质感很厚的作品会让你一直玩下去。",
      lane: 3,
      order: 6,
      angle: "4deg",
      x: 70,
      y: 44,
      zIndex: 4,
      sizeVariant: "wide",
    },
    {
      id: "terraria",
      title: "泰拉瑞亚",
      genre: "Sandbox / Progression",
      hours: "32.8h",
      years: "沙盒成长位",
      hook: "这类游戏说明你对探索推进、建造整理和反复开档成长并不排斥，甚至会把它当成稳定消耗时间的方式。",
      intro: "《泰拉瑞亚》把探索、建造、战斗和装备成长混在一起。它表面上是像素生存，实质上有非常长的成长链和很高的内容密度。",
      note: "这里先放你的心得占位。后面可以写常开的路线、最喜欢的阶段，或者你为什么会觉得它越玩越厚。",
      lane: 1,
      order: 7,
      angle: "7deg",
      x: 12,
      y: 76,
      zIndex: 5,
    },
    {
      id: "left-4-dead-2",
      title: "求生之路2",
      genre: "Co-op FPS",
      hours: "13.7h",
      years: "合作射击位",
      hook: "虽然时长不算最高，但它能说明你对合作射击和多人节奏一直有兴趣。",
      intro: "《求生之路2》是经典四人合作打僵尸射击游戏，核心乐趣来自队友配合、尸潮压力和每一局可能出现的节奏变化。",
      note: "这里先放你的心得占位。后面可以写最喜欢的战役、常和谁一起玩，或者为什么老合作游戏到现在依旧有味道。",
      lane: 2,
      order: 8,
      angle: "3deg",
      x: 49,
      y: 78,
      zIndex: 3,
    },
  ] as GameEntry[],
};

export const blogConfig = {
  seoTitle: "博客",
  listLabel: "Blog Archive",
  listTitle: "博客文章",
  listLead: "这里保留文章入口,但整体气质已经从'文件夹式目录'转向更完整的个人站。博客会继续写,只是不再是首页唯一的主角。",
  articleLabel: "Article",
  articleEyebrow: "Projector Notes",
  articleStamp: "35MM CUT",
  articleFrameLabel: "Feature Reading",
  backLabel: "Back To Blog",
  emptyTitle: "文章不存在",
  emptyContent: "<p>抱歉，你访问的文章不存在。</p>",
  unavailableDate: "Unavailable",
  articleFallbackDescription: "博客文章详情页",
  readLabel: "Read Article",

  listDecorations: [
    { id: "catalog", label: "Catalog", value: "Archive Strip" },
    { id: "lighting", label: "Lighting", value: "Warm Grain" },
  ] as BlogOrnament[],

  articleDecorations: [
    { id: "reel", label: "Reel", value: "Side Channel A" },
    { id: "stamp", label: "Stamp", value: "Print Verified" },
    { id: "subtitle", label: "Subtitle", value: "Mono Theatre" },
  ] as BlogOrnament[],
};

export const footerConfig = {
  label: "End Credits",
  description: "这是 TY 的第二版个人站。它不是文件夹式的文章目录，而是一段还在继续写的个人片头。",
  contactLabel: "Contacts",
  ending: "Act II / Built by",
};

export const techStack = ["C", "C++", "嵌入式开发", "Python", "Vue", "Dart"];
