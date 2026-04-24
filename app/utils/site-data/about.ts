/**
 * 关于页面配置数据
 */

import type { SiteAboutChapter, InspirationItem } from "@stores/site";

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