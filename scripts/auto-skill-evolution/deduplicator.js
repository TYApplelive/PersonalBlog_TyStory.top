/**
 * 技能去重器
 * 检查新提取的知识是否与现有技能重复
 */

import { AutoSkillEvolutionConfig } from "./config.js";

export class SkillDeduplicator {
  constructor() {
    this.config = AutoSkillEvolutionConfig;
  }

  /**
   * 执行去重检查
   * @param {Array} extractedKnowledge - 提取的知识列表
   * @param {Array} existingSkills - 现有技能列表
   */
  async check(extractedKnowledge, existingSkills) {
    const results = [];

    for (const knowledge of extractedKnowledge) {
      const matchResult = await this.findMatchingSkill(knowledge, existingSkills);

      if (matchResult.isMatch) {
        results.push({
          isDuplicate: true,
          matchingSkill: matchResult.skill,
          similarity: matchResult.similarity,
          extractedKnowledge: knowledge,
        });
      } else {
        results.push({
          isDuplicate: false,
          matchingSkill: null,
          similarity: 0,
          extractedKnowledge: knowledge,
        });
      }
    }

    return results;
  }

  /**
   * 查找匹配的技能
   */
  async findMatchingSkill(knowledge, existingSkills) {
    let bestMatch = null;
    let highestSimilarity = 0;

    for (const skill of existingSkills) {
      const similarity = this.calculateSimilarity(knowledge, skill);

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = skill;
      }
    }

    return {
      isMatch: highestSimilarity >= this.config.deduplication.similarityThreshold,
      skill: bestMatch,
      similarity: highestSimilarity,
    };
  }

  /**
   * 计算相似度
   */
  calculateSimilarity(knowledge, skill) {
    let totalScore = 0;
    let fieldCount = 0;

    // 1. 标题相似度
    if (knowledge.name && skill.name) {
      totalScore += this.textSimilarity(knowledge.name, skill.name);
      fieldCount++;
    }

    // 2. 描述相似度
    if (knowledge.problem && skill.content) {
      totalScore += this.textSimilarity(knowledge.problem, skill.content);
      fieldCount++;
    }

    // 3. 关键词匹配度
    if (knowledge.keywords && knowledge.keywords.length > 0) {
      const keywordScore = this.keywordMatchScore(
        knowledge.keywords,
        skill.content
      );
      totalScore += keywordScore;
      fieldCount++;
    }

    // 4. 分类匹配度
    if (knowledge.category) {
      const categoryScore = this.categoryMatchScore(
        knowledge.category,
        skill.content
      );
      totalScore += categoryScore;
      fieldCount++;
    }

    return fieldCount > 0 ? totalScore / fieldCount : 0;
  }

  /**
   * 文本相似度计算（简化版 Jaccard 相似度）
   */
  textSimilarity(text1, text2) {
    const set1 = new Set(this.tokenize(text1));
    const set2 = new Set(this.tokenize(text2));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 分词
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 1);
  }

  /**
   * 关键词匹配分数
   */
  keywordMatchScore(keywords, content) {
    if (!content) return 0;

    const lowerContent = content.toLowerCase();
    let matchCount = 0;

    for (const keyword of keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    return keywords.length > 0 ? matchCount / keywords.length : 0;
  }

  /**
   * 分类匹配分数
   */
  categoryMatchScore(category, content) {
    if (!content) return 0;

    const lowerContent = content.toLowerCase();
    const categoryKeywords = {
      routing: ["路由", "route", "navigation", "link", "跳转"],
      stateManagement: ["状态", "pinia", "store", "state"],
      dataFetching: ["数据", "fetch", "api", "请求", "async"],
      components: ["组件", "component", "props", "vue"],
      styling: ["样式", "css", "tailwind", "class"],
      performance: ["性能", "优化", "optimize", "cache"],
      debugging: ["bug", "错误", "error", "调试"],
    };

    const keywords = categoryKeywords[category] || [];
    let matchCount = 0;

    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        matchCount++;
      }
    }

    return keywords.length > 0 ? matchCount / keywords.length : 0;
  }
}

export default SkillDeduplicator;
