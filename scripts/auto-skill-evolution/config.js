/**
 * Auto-Skill Evolution 配置
 * 用于管理 .lingma/skills 和 .trae/skills 目录的自动化技能进化机制
 */

export const AutoSkillEvolutionConfig = {
  // 技能目录路径
  skillDirectories: {
    lingma: ".lingma/skills",
    trae: ".trae/skills",
  },

  // 技能文件命名规范
  skillFileStructure: {
    // .lingma/skills/{skill-name}/SKILL.md
    // .trae/skills/{skill-name}/SKILL.md
    mainFile: "SKILL.md",
    metaFile: "_meta.json",
  },

  // 技能分类标签
  skillCategories: {
    routing: "路由规范",
    stateManagement: "状态管理",
    dataFetching: "数据获取",
    components: "组件开发",
    styling: "样式规范",
    deployment: "部署配置",
    debugging: "调试技巧",
    performance: "性能优化",
    security: "安全实践",
    workflow: "工作流",
  },

  // 触发条件关键词（当用户对话包含这些词时触发技能进化）
  triggerKeywords: [
    "任务完成",
    "问题解决",
    "方案可行",
    "确认通过",
    "可以使用",
    "没问题了",
    "搞定",
    "完成",
    "approved",
    "confirmed",
    "works",
    "done",
  ],

  // 去重检查配置
  deduplication: {
    // 相似度阈值（0-1），超过此值认为是重复技能
    similarityThreshold: 0.75,
    // 检查的字段
    checkFields: ["title", "description", "keywords", "content"],
  },

  // 验证配置
  validation: {
    // 必须包含的字段
    requiredFields: ["name", "description", "content"],
    // 文件编码
    encoding: "utf-8",
    // Markdown 格式检查
    checkMarkdownFormat: true,
  },

  // 日志配置
  logging: {
    enabled: true,
    logFile: "scripts/auto-skill-evolution/evolution.log",
    maxLogSize: "10MB",
  },
};

export default AutoSkillEvolutionConfig;
