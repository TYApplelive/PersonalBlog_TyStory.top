/**
 * 知识提取器
 * 从工作上下文中提取核心步骤、代码模式和最佳实践
 */

export class SkillExtractor {
  /**
   * 从工作上下文中提取知识
   * @param {Object} context - 工作上下文
   */
  async extract(context) {
    const { taskDescription, modifiedFiles, solution, codeChanges } = context;

    const extractedKnowledge = [];

    // 1. 从任务描述中提取问题类型
    const problemType = this.identifyProblemType(taskDescription);

    // 2. 从修改的文件中提取代码模式
    const codePatterns = this.extractCodePatterns(modifiedFiles, codeChanges);

    // 3. 从解决方案中提取最佳实践
    const bestPractices = this.extractBestPractices(solution);

    // 4. 组合成结构化知识
    if (problemType && codePatterns.length > 0) {
      extractedKnowledge.push({
        name: this.generateSkillName(taskDescription),
        category: problemType.category,
        problem: taskDescription,
        solution: solution,
        codePatterns: codePatterns,
        bestPractices: bestPractices,
        applicableScenarios: problemType.scenarios,
        keywords: this.extractKeywords(taskDescription, solution),
      });
    }

    return extractedKnowledge;
  }

  /**
   * 识别问题类型
   */
  identifyProblemType(description) {
    const lowerDesc = description.toLowerCase();

    const problemTypes = {
      routing: {
        category: "routing",
        keywords: ["路由", "跳转", "navigation", "route", "link"],
        scenarios: "页面导航、路由配置、动态路由",
      },
      stateManagement: {
        category: "stateManagement",
        keywords: ["状态", "pinia", "store", "vuex", "数据流"],
        scenarios: "状态管理、数据共享、响应式更新",
      },
      dataFetching: {
        category: "dataFetching",
        keywords: ["数据获取", "fetch", "async", "api", "请求"],
        scenarios: "数据加载、API 调用、异步处理",
      },
      components: {
        category: "components",
        keywords: ["组件", "component", "props", "emit", "slot"],
        scenarios: "组件开发、组件通信、组件复用",
      },
      styling: {
        category: "styling",
        keywords: ["样式", "css", "tailwind", "class", "theme"],
        scenarios: "样式编写、主题配置、响应式设计",
      },
      performance: {
        category: "performance",
        keywords: ["性能", "优化", "optimize", "lazy", "cache"],
        scenarios: "性能优化、加载速度、缓存策略",
      },
      debugging: {
        category: "debugging",
        keywords: ["bug", "错误", "error", "调试", "fix"],
        scenarios: "问题排查、错误修复、调试技巧",
      },
    };

    for (const [type, config] of Object.entries(problemTypes)) {
      if (config.keywords.some((keyword) => lowerDesc.includes(keyword))) {
        return config;
      }
    }

    // 默认返回通用类型
    return {
      category: "workflow",
      keywords: [],
      scenarios: "通用开发场景",
    };
  }

  /**
   * 从修改的文件中提取代码模式
   */
  extractCodePatterns(modifiedFiles, codeChanges) {
    const patterns = [];

    if (!modifiedFiles || modifiedFiles.length === 0) return patterns;

    for (const file of modifiedFiles) {
      // 提取文件类型相关的模式
      if (file.endsWith(".vue")) {
        patterns.push({
          type: "vue_component",
          file: file,
          pattern: "Vue 3 Composition API + <script setup>",
        });
      } else if (file.endsWith(".ts")) {
        patterns.push({
          type: "typescript",
          file: file,
          pattern: "TypeScript 类型定义 + 接口",
        });
      } else if (file.endsWith(".css")) {
        patterns.push({
          type: "styling",
          file: file,
          pattern: "CSS 变量 + Tailwind 工具类",
        });
      }
    }

    return patterns;
  }

  /**
   * 从解决方案中提取最佳实践
   */
  extractBestPractices(solution) {
    const practices = [];

    if (!solution) return practices;

    // 提取常见的最佳实践关键词
    const practiceKeywords = [
      "使用静态",
      "避免",
      "确保",
      "推荐",
      "最佳实践",
      "注意",
      "不要",
      "应该",
    ];

    const lines = solution.split("\n");
    for (const line of lines) {
      if (practiceKeywords.some((keyword) => line.includes(keyword))) {
        practices.push(line.trim());
      }
    }

    return practices;
  }

  /**
   * 生成技能名称
   */
  generateSkillName(taskDescription) {
    // 从任务描述中提取关键信息生成名称
    const words = taskDescription.split(/[\s,，、]+/);
    const significantWords = words.filter(
      (word) => word.length >= 2 && !/^[的得了是吧没有]{1,2}$/.test(word)
    );

    return significantWords.slice(0, 4).join("-") || "new-skill";
  }

  /**
   * 提取关键词
   */
  extractKeywords(taskDescription, solution) {
    const text = (taskDescription + " " + solution).toLowerCase();
    const keywords = [];

    // Nuxt 相关关键词
    const nuxtKeywords = [
      "nuxt",
      "vue",
      "pinia",
      "tailwind",
      "typescript",
      "路由",
      "组件",
      "状态",
      "数据",
      "样式",
    ];

    for (const keyword of nuxtKeywords) {
      if (text.includes(keyword)) {
        keywords.push(keyword);
      }
    }

    return keywords;
  }
}

export default SkillExtractor;
