/**
 * 技能验证器
 * 验证生成的技能文件是否符合规范
 */

import { AutoSkillEvolutionConfig } from "./config.js";

export class SkillValidator {
  constructor() {
    this.config = AutoSkillEvolutionConfig;
  }

  /**
   * 验证技能内容
   * @param {string} content - 技能文件内容
   * @returns {Array} 错误列表，空数组表示验证通过
   */
  validate(content) {
    const errors = [];

    // 1. 检查必填字段
    this.checkRequiredFields(content, errors);

    // 2. 检查 Markdown 格式
    if (this.config.validation.checkMarkdownFormat) {
      this.checkMarkdownFormat(content, errors);
    }

    // 3. 检查代码块格式
    this.checkCodeBlocks(content, errors);

    // 4. 检查内容长度
    this.checkContentLength(content, errors);

    // 5. 检查特殊字符
    this.checkSpecialCharacters(content, errors);

    return errors;
  }

  /**
   * 检查必填字段
   */
  checkRequiredFields(content, errors) {
    const requiredFields = this.config.validation.requiredFields;

    // 检查是否有标题 (name)
    if (!content.match(/^#{1,3}\s+.+$/m)) {
      errors.push("缺少必填字段: name (标题)");
    }

    // 检查是否有问题描述 (description)
    if (!content.includes("问题描述") && !content.includes("问题")) {
      errors.push("缺少必填字段: description (问题描述)");
    }

    // 检查是否有解决方案或内容 (content)
    if (!content.includes("解决方案") && !content.includes("解决") && !content.includes("## ")) {
      errors.push("缺少必填字段: content (解决方案或内容)");
    }
  }

  /**
   * 检查 Markdown 格式
   */
  checkMarkdownFormat(content, errors) {
    // 检查是否有标题
    if (!content.match(/^#{1,6}\s+/m)) {
      errors.push("Markdown 格式错误：缺少标题");
    }

    // 检查标题层级是否正确
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    let previousLevel = 0;

    for (const heading of headings) {
      const level = heading.match(/^#+/)[0].length;
      if (level > previousLevel + 1 && previousLevel > 0) {
        errors.push(`Markdown 格式错误：标题层级跳跃 (H${previousLevel} -> H${level})`);
      }
      previousLevel = level;
    }

    // 检查列表格式
    const listItems = content.match(/^\s*[-*+]\s+.+$/gm) || [];
    for (const item of listItems) {
      if (!item.match(/^\s*[-*+]\s+\S/)) {
        errors.push("Markdown 格式错误：列表项格式不正确");
      }
    }
  }

  /**
   * 检查代码块格式
   */
  checkCodeBlocks(content, errors) {
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];

    for (const block of codeBlocks) {
      // 检查代码块是否有语言标识
      if (!block.match(/^```[a-zA-Z]+/)) {
        errors.push("代码块格式错误：缺少语言标识");
      }

      // 检查代码块是否闭合
      const backticks = block.match(/```/g);
      if (!backticks || backticks.length % 2 !== 0) {
        errors.push("代码块格式错误：未正确闭合");
      }
    }
  }

  /**
   * 检查内容长度
   */
  checkContentLength(content, errors) {
    const lines = content.split("\n");

    if (lines.length < 5) {
      errors.push("内容过短：技能内容应该至少有 5 行");
    }

    if (lines.length > 500) {
      errors.push("内容过长：技能内容不应超过 500 行，建议拆分");
    }
  }

  /**
   * 检查特殊字符
   */
  checkSpecialCharacters(content, errors) {
    // 检查是否有未转义的 HTML 标签（除了代码块内）
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    let contentWithoutCode = content;

    for (const block of codeBlocks) {
      contentWithoutCode = contentWithoutCode.replace(block, "");
    }

    // 简单的 HTML 标签检查
    const htmlTags = contentWithoutCode.match(/<[^/][^>]*>/g) || [];
    const closingTags = contentWithoutCode.match(/<\/[^>]+>/g) || [];

    if (htmlTags.length !== closingTags.length) {
      errors.push("可能存在未闭合的 HTML 标签");
    }
  }

  /**
   * 验证技能元数据
   * @param {Object} meta - 元数据对象
   */
  validateMeta(meta) {
    const errors = [];

    if (!meta.name) {
      errors.push("元数据错误：缺少 name 字段");
    }

    if (!meta.description) {
      errors.push("元数据错误：缺少 description 字段");
    }

    if (meta.version && !meta.version.match(/^\d+\.\d+\.\d+$/)) {
      errors.push("元数据错误：version 格式不正确，应为 x.y.z");
    }

    return errors;
  }
}

export default SkillValidator;
