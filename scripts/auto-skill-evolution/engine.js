/**
 * Auto-Skill Evolution 核心引擎
 * 负责技能的提取、去重、更新和验证
 */

import { AutoSkillEvolutionConfig } from "./config.js";
import { SkillExtractor } from "./extractor.js";
import { SkillDeduplicator } from "./deduplicator.js";
import { SkillValidator } from "./validator.js";
import { SkillGenerator } from "./generator.js";
import fs from "fs";
import path from "path";

export class AutoSkillEvolutionEngine {
  constructor() {
    this.config = AutoSkillEvolutionConfig;
    this.extractor = new SkillExtractor();
    this.deduplicator = new SkillDeduplicator();
    this.validator = new SkillValidator();
    this.generator = new SkillGenerator();
  }

  /**
   * 主执行流程：当用户确认任务完成时调用
   * @param {Object} context - 工作上下文
   * @param {string} context.taskDescription - 任务描述
   * @param {Array} context.modifiedFiles - 修改的文件列表
   * @param {string} context.solution - 解决方案描述
   * @param {Object} context.codeChanges - 代码变更详情
   */
  async evolve(context) {
    console.log("[Auto-Skill-Evolution] 开始技能进化流程...");

    try {
      // 1. 提取知识
      console.log("[Step 1] 提取工作上下文中的知识...");
      const extractedKnowledge = await this.extractor.extract(context);

      if (!extractedKnowledge || extractedKnowledge.length === 0) {
        console.log("[Auto-Skill-Evolution] 未提取到有效知识，跳过进化");
        return { evolved: false, reason: "no_knowledge_extracted" };
      }

      console.log(`[Step 1] 成功提取 ${extractedKnowledge.length} 条知识`);

      // 2. 扫描现有技能
      console.log("[Step 2] 扫描现有技能文件...");
      const existingSkills = await this.scanExistingSkills();
      console.log(`[Step 2] 发现 ${existingSkills.length} 个现有技能`);

      // 3. 去重检查
      console.log("[Step 3] 执行去重检查...");
      const deduplicationResults = await this.deduplicator.check(
        extractedKnowledge,
        existingSkills
      );

      // 4. 生成或更新技能
      const evolutionResults = [];

      for (const result of deduplicationResults) {
        if (result.isDuplicate && result.matchingSkill) {
          // 更新现有技能
          console.log(
            `[Step 4] 发现重复技能，准备更新: ${result.matchingSkill.name}`
          );
          const updatedSkill = await this.updateExistingSkill(
            result.matchingSkill,
            result.extractedKnowledge
          );
          evolutionResults.push({
            action: "updated",
            skillName: updatedSkill.name,
            skillPath: updatedSkill.path,
          });
        } else {
          // 创建新技能
          console.log(`[Step 4] 创建新技能: ${result.extractedKnowledge.name}`);
          const newSkill = await this.createNewSkill(
            result.extractedKnowledge
          );
          evolutionResults.push({
            action: "created",
            skillName: newSkill.name,
            skillPath: newSkill.path,
          });
        }
      }

      // 5. 验证生成的技能
      console.log("[Step 5] 验证生成的技能文件...");
      const validationResults = await this.validateEvolvedSkills(
        evolutionResults
      );

      console.log("[Auto-Skill-Evolution] 技能进化流程完成");
      return {
        evolved: true,
        results: evolutionResults,
        validation: validationResults,
      };
    } catch (error) {
      console.error("[Auto-Skill-Evolution] 进化流程失败:", error);
      throw error;
    }
  }

  /**
   * 扫描现有技能文件
   */
  async scanExistingSkills() {
    const skills = [];
    const skillDirs = [
      this.config.skillDirectories.lingma,
      this.config.skillDirectories.trae,
    ];

    for (const dir of skillDirs) {
      const fullPath = path.resolve(dir);
      if (!fs.existsSync(fullPath)) continue;

      const subdirs = fs.readdirSync(fullPath, { withFileTypes: true });
      for (const subdir of subdirs) {
        if (subdir.isDirectory()) {
          const skillPath = path.join(fullPath, subdir.name);
          const skillFile = path.join(
            skillPath,
            this.config.skillFileStructure.mainFile
          );
          const metaFile = path.join(
            skillPath,
            this.config.skillFileStructure.metaFile
          );

          if (fs.existsSync(skillFile)) {
            const content = fs.readFileSync(skillFile, "utf-8");
            const meta = fs.existsSync(metaFile)
              ? JSON.parse(fs.readFileSync(metaFile, "utf-8"))
              : null;

            skills.push({
              name: subdir.name,
              path: skillPath,
              content: content,
              meta: meta,
              source: dir.includes("lingma") ? "lingma" : "trae",
            });
          }
        }
      }
    }

    return skills;
  }

  /**
   * 更新现有技能
   */
  async updateExistingSkill(existingSkill, newKnowledge) {
    // 合并新旧内容
    const mergedContent = this.mergeSkillContent(
      existingSkill.content,
      newKnowledge
    );

    // 写入更新后的内容
    const skillFile = path.join(
      existingSkill.path,
      this.config.skillFileStructure.mainFile
    );
    fs.writeFileSync(skillFile, mergedContent, "utf-8");

    // 更新元数据
    this.updateMeta(existingSkill.path);

    return {
      name: existingSkill.name,
      path: existingSkill.path,
      action: "updated",
    };
  }

  /**
   * 创建新技能
   */
  async createNewSkill(knowledge) {
    // 生成技能名称（使用 kebab-case）
    const skillName = knowledge.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // 选择技能目录（优先 .lingma）
    const targetDir = this.config.skillDirectories.lingma;
    const skillPath = path.join(targetDir, skillName);

    // 创建目录
    if (!fs.existsSync(skillPath)) {
      fs.mkdirSync(skillPath, { recursive: true });
    }

    // 生成 SKILL.md
    const skillContent = this.generator.generateSkillMarkdown(knowledge);
    const skillFile = path.join(skillPath, "SKILL.md");
    fs.writeFileSync(skillFile, skillContent, "utf-8");

    // 生成 _meta.json
    const metaContent = this.generator.generateMetaJson(knowledge);
    const metaFile = path.join(skillPath, "_meta.json");
    fs.writeFileSync(metaFile, JSON.stringify(metaContent, null, 2), "utf-8");

    return {
      name: skillName,
      path: skillPath,
      action: "created",
    };
  }

  /**
   * 合并技能内容
   */
  mergeSkillContent(existingContent, newKnowledge) {
    // 检查是否有"常见踩坑点"部分
    if (existingContent.includes("## 常见踩坑点")) {
      // 在踩坑点部分前插入新内容
      const insertIndex = existingContent.indexOf("## 常见踩坑点");
      const before = existingContent.substring(0, insertIndex);
      const after = existingContent.substring(insertIndex);

      const newSection = this.formatNewKnowledgeSection(newKnowledge);
      return before + "\n" + newSection + "\n" + after;
    } else {
      // 在文件末尾添加新内容
      return existingContent + "\n\n" + this.formatNewKnowledgeSection(newKnowledge);
    }
  }

  /**
   * 格式化新知识部分
   */
  formatNewKnowledgeSection(knowledge) {
    return `### ${knowledge.title || knowledge.name}

**问题描述**: ${knowledge.problem || "无"}

**解决方案**: ${knowledge.solution || "无"}

**代码示例**:
\`\`\`typescript
${knowledge.codeExample || "// 无代码示例"}
\`\`\`

**适用场景**: ${knowledge.applicableScenarios || "通用"}

---
`;
  }

  /**
   * 更新元数据
   */
  updateMeta(skillPath) {
    const metaFile = path.join(skillPath, "_meta.json");
    let meta = {};

    if (fs.existsSync(metaFile)) {
      meta = JSON.parse(fs.readFileSync(metaFile, "utf-8"));
    }

    meta.updatedAt = Date.now();
    meta.version = meta.version || "1.0.0";
    // 简单版本号递增
    const versionParts = meta.version.split(".");
    versionParts[2] = parseInt(versionParts[2] || 0) + 1;
    meta.version = versionParts.join(".");

    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2), "utf-8");
  }

  /**
   * 验证进化后的技能
   */
  async validateEvolvedSkills(results) {
    const validations = [];

    for (const result of results) {
      const skillFile = path.join(result.skillPath, "SKILL.md");

      if (!fs.existsSync(skillFile)) {
        validations.push({
          skillName: result.skillName,
          valid: false,
          errors: ["技能文件不存在"],
        });
        continue;
      }

      const content = fs.readFileSync(skillFile, "utf-8");
      const errors = this.validator.validate(content);

      validations.push({
        skillName: result.skillName,
        valid: errors.length === 0,
        errors: errors,
      });
    }

    return validations;
  }
}

export default AutoSkillEvolutionEngine;
