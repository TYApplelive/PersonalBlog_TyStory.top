import { defineStore } from "pinia";

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
  sizeVariant?: "wide" | "tall";
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

/// 站点总状态 store
export const useSiteStore = defineStore("site", {
  state: () => ({
    brand: {
      title: "TY's Blog",
      owner: "TY",
      alias: "Applelive",
      eyebrow: "Applelive",
    },
    nav: [
      { label: "首页", to: "/" },
      { label: "关于", to: "/about" },
      { label: "博客", to: "/blog" },
    ] as SiteNavItem[],
    contactOrder: ["github", "qq", "wechat"] as ContactKey[],
    home: {
      seoTitle: "首页",
      kicker: "ACT II / SECOND CUT",
      title: "TY's Blog",
      subtitle: "不是文件夹式的博客入口，而是一张还在继续补完的个人片头。",
      intro:
        "这里会记录技术、站点迭代和重新开始的过程。第一版已经留在过去，现在这个站点是第二次开场，也更接近我想亲手慢慢搭起来的样子。",
      badges: ["学生", "写程序的人", "白羊座"],
      ctas: <SiteAction[]>[
        { label: "建站记事", to: "/about", variant: "primary" },
        { label: "进入博客", to: "/blog", variant: "secondary" },
      ],
      poster: {
        label: "Now Showing",
        titleLabel: "Feature Title",
        title: "第二版，继续放映",
        body:
          "这不是一个把文章摊成目录的网站，而是一张正在慢慢补齐的片单海报。主页先讲气质，故事留在里面继续写。",
      },
      notes: [
        "首页不直接铺开文章列表，而是先交代站点气质和个人表达。",
        "博客入口会一直保留，但文章目录不再是唯一主角。",
        "视觉继续维持旧纸张、片头字幕和复古胶片的方向。",
      ],
      techReel: {
        label: "Tech Reel",
        title: "现在关注的技术方向",
        body:
          "这一块不再只放简介，而是放成几张正在进行中的技术卡片。它们和首页的 GameLife 一样，承担的是个人兴趣剖面，而不是简历摘要。",
        actionLabel: "Read The Story",
        cards: <TechCard[]>[
          {
            id: "cpp-embedded",
            kicker: "Core Lane",
            title: "C / C++ 与嵌入式",
            summary: "持续保留底层视角。偏向写得稳、调得清楚，而不是只停留在会用。",
            status: "持续关注驱动、串口、设备联调这类硬核细节。",
          },
          {
            id: "python-tools",
            kicker: "Tool Pass",
            title: "Python 小工具",
            summary: "把重复操作做成小工具，优先追求省时间和可复用，而不是形式完整。",
            status: "最近更关心脚本整理、数据清洗和本地自动化。",
          },
          {
            id: "vue-nuxt",
            kicker: "Frontend Cut",
            title: "Vue / Nuxt",
            summary: "把个人站继续打磨成更完整的作品，重点在结构、状态和视觉表达一起成立。",
            status: "这一轮主要在收状态、修布局和统一博客阅读体验。",
          },
          {
            id: "site-direction",
            kicker: "Next Frame",
            title: "站点重构",
            summary: "站点不做文件夹式入口，继续往复古电影感、信息分区和个性表达的方向推进。",
            status: "目前在补首页模块密度、响应式节奏和阅读页挂件。",
          },
        ],
      },
    },
    about: {
      seoTitle: "关于",
      sectionLabel: "About This Site",
      title: "这个网站为什么会存在",
      lead:
        "相比把这里写成一份标准的个人介绍，我更想把这个网站的来路讲清楚。它的存在，本身就是这一页最重要的内容。",
      chapters: <SiteAboutChapter[]>[
        {
          label: "Scene 01",
          title: "我是谁",
          body:
            "我是 TY，ID 是 Applelive，目前还是学生。平时喜欢写程序，也会持续关注自己真正想做的网站应该是什么样子。技术方向主要围绕 C、C++、嵌入式开发、Python、Vue 和 Dart 展开。",
        },
        {
          label: "Scene 02",
          title: "这个网站的开端",
          body:
            "最开始是在大一的时候，我基于别人的框架做过一个网站。后来慢慢觉得，与其一直借别人的骨架，不如认真写一个真正属于自己的版本，所以才有了后来自己动手重做站点的想法。",
        },
        {
          label: "Scene 03",
          title: "为什么现在是第二版",
          body:
            "第一版因为服务器到期，再加上当时学业和比赛都比较忙，没有继续续费，后面的数据和文案也没有保存下来。所以现在这个网站其实是第二版，相当于从头重新开始，但这次会更明确地把它做成自己的样子。",
        },
      ],
      note: {
        label: "Director's Note",
        quote: "第一版已经消失了，所以第二版不再假装一切都还在，而是承认它从头开始，然后认真地重新写。",
        body:
          "这也是这一页想表达的重点。这里不需要把自己写成一张履历表，只需要把这个站点存在的原因讲清楚。它既是技术练习，也是一次重新搭建个人表达空间的过程。",
      },
      stackLabel: "Stack",
      contactLabel: "Contact",
    },
    contacts: {
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
    } as Record<ContactKey, ContactItem>,
    footer: {
      label: "End Credits",
      description:
        "这是 TY 的第二版个人站点。它不是文件夹式的文章目录，而是一段还在继续写的个人片头。",
      contactLabel: "Contacts",
      ending: "Act II / Built by",
    },
    stack: ["C", "C++", "嵌入式开发", "Python", "Vue", "Dart"],
    gameLife: {
      label: "GameLife",
      title: "GameLife",
      subtitle:
        "从这份游戏库里能看出，你的重心很明确地落在 FPS、动作冒险、模拟经营和带长期投入感的单机内容上。这里先选出几封更能代表你游玩轨迹的游戏信封。",
      openLabel: "Open Drawer",
      closeLabel: "Close Drawer",
      drawerHint: "点击任意信封，展开后会同时显示游戏简介和你的心得占位。",
      drawerOpen: false,
      activeGameId: "cs2",
      games: <GameEntry[]>[
        {
          id: "cs2",
          title: "CS2",
          genre: "FPS / Competitive",
          hours: "2559.3h",
          years: "绝对主力位",
          hook: "这几乎就是你游戏库的中心轴，说明你对枪感、对抗、熟练度积累和长期重复打磨有非常高的耐受度。",
          intro:
            "《CS2》是 Valve 推出的经典竞技射击游戏续作，核心体验围绕经济系统、爆弹攻防、道具协作和纯粹枪法展开。它对个人反应、地图理解和团队配合都有很高要求，也因此特别容易形成长期投入。",
          note:
            "这里先放你的心得占位。后面你可以改成自己最擅长的位置、最熟的地图、最喜欢的枪械手感，或者你为什么能在这类高重复对抗里持续投入这么长时间。",
          lane: 1,
          order: 1,
          sizeVariant: "wide",
          angle: "-7deg",
        },
        {
          id: "hunt-showdown-1896",
          title: "猎杀：对决 1896",
          genre: "FPS / Extraction",
          hours: "155.3h",
          years: "高压狩猎位",
          hook: "这类高风险撤离射击能打到这个时长，说明你不只喜欢纯竞技，也吃“紧张感 + 决策成本 + 环境压力”这一套。",
          intro:
            "《猎杀：对决 1896》是一款把 PvPvE、撤离玩法和恐怖氛围结合在一起的射击游戏。它比传统竞技 FPS 更强调听觉、潜行、机会判断和一次行动的代价感。",
          note:
            "这里先放你的心得占位。后面你可以补上自己最熟悉的武器体系、最喜欢的博弈时刻，或者你为什么会被这种慢节奏但压力极高的对抗吸住。",
          lane: 2,
          order: 1,
          sizeVariant: "tall",
          angle: "5deg",
        },
        {
          id: "yijian-fengyunjue",
          title: "逸剑风云决",
          genre: "Martial Arts RPG",
          hours: "121.2h",
          years: "武侠沉浸位",
          hook: "它说明你的偏好不是单一的射击路线，你也愿意为了世界观、成长线和探索节奏去沉下心打长线单机。",
          intro:
            "《逸剑风云决》是一款偏传统武侠表达的角色扮演游戏，玩法上结合了探索、养成、剧情推进和回合策略。它的吸引力更多来自江湖氛围、门派路线和角色成长。",
          note:
            "这里先放你的心得占位。你后面可以写自己最喜欢的门派、路线或者角色 build，也可以写为什么这类武侠 RPG 会让你愿意投入到一百小时以上。",
          lane: 1,
          order: 2,
          sizeVariant: "wide",
          angle: "-3deg",
        },
        {
          id: "ready-or-not",
          title: "严阵以待",
          genre: "Tactical FPS",
          hours: "93.8h",
          years: "战术执行位",
          hook: "这说明你偏爱的 FPS 不只是拼反应，也包括有节奏控制、清点推进和团队执行感的战术玩法。",
          intro:
            "《严阵以待》是一款强调 CQB 清点、目标优先级和队伍协作的战术射击游戏。相比快节奏竞技，它更重视观察、指令、推进路线和每一步的稳定执行。",
          note:
            "这里先放你的心得占位。后面可以补你最喜欢的任务类型、最常用的武器或编组习惯，以及你觉得它和传统多人 FPS 最大的差别是什么。",
          lane: 3,
          order: 1,
          angle: "6deg",
        },
        {
          id: "prison-architect",
          title: "监狱建筑师",
          genre: "Management Sim",
          hours: "78.7h",
          years: "经营规划位",
          hook: "你并不只追求即时反馈，也愿意把时间投入到系统运转、资源规划和宏观调度上。",
          intro:
            "《监狱建筑师》是一款以建造与管理为核心的模拟经营游戏。玩家需要规划监狱结构、维持收支平衡、处理犯人需求与安全秩序，乐趣来自系统联动和持续优化。",
          note:
            "这里先放你的心得占位。后面可以改成你最满意的一版布局、最容易翻车的问题，或者你为什么会喜欢这种慢热但很有掌控感的经营过程。",
          lane: 2,
          order: 2,
          angle: "-5deg",
        },
        {
          id: "red-dead-redemption-2",
          title: "荒野大镖客：救赎2",
          genre: "Open World Action",
          hours: "76.1h",
          years: "叙事沉浸位",
          hook: "这说明你也会为强叙事、角色塑造和世界沉浸感留出很长的时间，不是只追求系统强反馈。",
          intro:
            "《荒野大镖客：救赎2》是一款以开放世界、电影化叙事和高沉浸度著称的动作冒险游戏。它的魅力不止在主线剧情，还在于环境细节、角色关系和完整的西部氛围。",
          note:
            "这里先放你的心得占位。后面可以补自己印象最深的一段剧情、最喜欢的区域，或者为什么这类节奏偏慢但质感很厚的作品会让你一直玩下去。",
          lane: 3,
          order: 2,
          sizeVariant: "wide",
          angle: "-4deg",
        },
        {
          id: "terraria",
          title: "泰拉瑞亚",
          genre: "Sandbox / Progression",
          hours: "32.8h",
          years: "沙盒成长位",
          hook: "这类游戏说明你对探索推进、建造整理和反复开档成长并不排斥，甚至会把它当作很稳定的消耗方式。",
          intro:
            "《泰拉瑞亚》是一款把探索、建造、战斗和装备成长混在一起的高自由度沙盒游戏。它表面上是像素生存，实质上有非常长的成长链和内容密度。",
          note:
            "这里先放你的心得占位。后面可以写你最常开的职业路线、第一次真正沉进去的阶段，或者你为什么觉得它越玩越厚。",
          lane: 1,
          order: 3,
          angle: "7deg",
        },
        {
          id: "left-4-dead-2",
          title: "求生之路2",
          genre: "Co-op FPS",
          hours: "13.7h",
          years: "老牌合作位",
          hook: "虽然时长不是最高，但它很能说明你对合作射击和多人节目效果一直是有兴趣的。",
          intro:
            "《求生之路2》是经典的四人合作打僵尸射击游戏，核心乐趣来自队友配合、尸潮压力和每一局都可能出现的意外节奏。它是很多合作射击玩家的共同记忆点。",
          note:
            "这里先放你的心得占位。后面可以写你最喜欢的战役、最常和朋友玩的模式，或者为什么这种老合作游戏到现在依然有味道。",
          lane: 3,
          order: 3,
          angle: "4deg",
        },
      ],
    },
    blog: {
      seoTitle: "博客",
      listLabel: "Blog Archive",
      listTitle: "博客文章",
      listLead:
        "这里保留文章入口，但整体气质已经从“文件夹式目录”转向更完整的个人站。博客会继续写，只是它不再是首页唯一的主角。",
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
    },
    blogPosts: <BlogPost[]>[
      {
        id: 1,
        title: "Nuxt 4 入门指南",
        date: "2026-04-15",
        excerpt:
          "Nuxt 4 是一个基于 Vue 3 的现代框架，这篇文章会从项目初始化、目录结构到常见能力快速梳理它的基本使用方式。",
        readTime: "6 min",
        tags: ["Nuxt", "Vue", "SSR"],
        content: `
          <p>Nuxt 4 建立在 Vue 3 之上，提供了路由、服务端渲染和自动导入等能力，让我们能更轻松地搭建现代网站。</p>
          <p>如果你刚开始接触 Nuxt，可以先关注这几个核心点：</p>
          <ul>
            <li>如何初始化一个 Nuxt 4 项目</li>
            <li>页面、布局和组件的组织方式</li>
            <li>自动导入、路由和数据获取的基本思路</li>
            <li>什么时候适合使用服务端渲染或静态生成</li>
          </ul>
          <blockquote>先把目录结构和渲染模式想清楚，后面的状态和样式系统才不会越写越乱。</blockquote>
          <p>掌握这些基础以后，再继续扩展状态管理、样式系统和部署流程，会更顺手。</p>
        `,
      },
      {
        id: 2,
        title: "Vue 3 Composition API 的组织方式",
        date: "2026-04-10",
        excerpt:
          "Composition API 带来的不只是语法变化，更重要的是它让复杂逻辑的拆分和复用变得更自然。",
        readTime: "5 min",
        tags: ["Vue", "Composition API", "Composables"],
        content: `
          <p>Vue 3 的 Composition API 最大的价值，不是把代码写得更短，而是能把同一类逻辑更自然地组织在一起。</p>
          <p>几个比较实用的思路包括：</p>
          <ul>
            <li>按功能组织状态和副作用，而不是只按选项分类</li>
            <li>把可复用逻辑提取到 composable 里</li>
            <li>用 computed 和 watch 处理派生状态与响应式监听</li>
            <li>让页面组件保留展示职责，减少过多业务细节</li>
          </ul>
          <blockquote>页面组件越像“镜头”，业务逻辑越像“幕后”，维护成本通常就越低。</blockquote>
          <p>当项目逐渐变大时，这种组织方式会比传统写法更利于维护。</p>
        `,
      },
      {
        id: 3,
        title: "前端性能优化的一些基本做法",
        date: "2026-04-05",
        excerpt:
          "性能优化不只是跑分，更关系到真实用户打开页面时的速度、稳定性和整体体验。",
        readTime: "4 min",
        tags: ["Frontend", "Performance", "Web"],
        content: `
          <p>前端性能优化通常不需要一次做得非常复杂，先把几个基础点做好，效果就会比较明显。</p>
          <ul>
            <li>减少不必要的请求和体积过大的资源</li>
            <li>合理利用缓存与静态资源分发</li>
            <li>延迟加载非首屏内容</li>
            <li>压缩图片、字体和脚本资源</li>
            <li>避免页面出现长时间阻塞</li>
          </ul>
          <blockquote>真正有效的优化，往往来自持续观察和一次次小改进，而不是只依赖某一种技巧。</blockquote>
          <p>先解决真正影响体验的瓶颈，比一开始追求极限分数更有意义。</p>
        `,
      },
    ],
    ui: {
      hoveredContact: null as ContactKey | null,
    },
  }),
  getters: {
    /// 当前悬浮的联系方式键值
    getHoveredContact: (state) => state.ui.hoveredContact,
    /// 当前悬浮联系方式详情
    getHoveredContactItem: (state) => {
      if (!state.ui.hoveredContact) {
        return null;
      }

      return state.contacts[state.ui.hoveredContact];
    },
    /// 游戏抽屉是否开启
    isGameDrawerOpen: (state) => state.gameLife.drawerOpen,
    /// 当前展开的游戏信封
    getActiveGame: (state) => {
      return state.gameLife.games.find((game) => game.id === state.gameLife.activeGameId) ?? null;
    },
    /// 博客文章列表
    getBlogPosts: (state) => state.blogPosts,
  },
  actions: {
    /// 设置当前悬浮的联系方式
    setHoveredContact(contact: ContactKey | null) {
      this.ui.hoveredContact = contact;
    },

    /// 切换游戏抽屉
    toggleGameDrawer(force?: boolean) {
      this.gameLife.drawerOpen = typeof force === "boolean" ? force : !this.gameLife.drawerOpen;
    },

    /// 打开某个游戏信封
    openGameEnvelope(gameId: string) {
      this.gameLife.activeGameId = gameId;
      this.gameLife.drawerOpen = true;
    },

    /// 按 ID 获取博客文章
    getBlogPostById(postId: number) {
      return this.blogPosts.find((post) => post.id === postId) ?? null;
    },
  },
});
