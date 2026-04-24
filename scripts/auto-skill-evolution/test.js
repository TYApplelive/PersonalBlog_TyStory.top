/**
 * Auto-Skill Evolution 测试脚本
 * 验证各个模块的功能是否正常
 */

import { AutoSkillEvolutionEngine } from "./engine.js";
import { SkillExtractor } from "./extractor.js";
import { SkillDeduplicator } from "./deduplicator.js";
import { SkillValidator } from "./validator.js";
import { SkillGenerator } from "./generator.js";

async function runTests() {
  console.log("=".repeat(60));
  console.log("Auto-Skill Evolution 测试套件");
  console.log("=".repeat(60));
  console.log();

  let passed = 0;
  let failed = 0;

  // 测试 1: 知识提取器
  console.log("测试 1: 知识提取器");
  try {
    const extractor = new SkillExtractor();
    const context = {
      taskDescription: "修复路由跳转问题，URL 变了但页面没变",
      modifiedFiles: ["app/pages/blog/index.vue"],
      solution: "使用静态 key 和 watch 监听",
    };
    const result = await extractor.extract(context);
    if (result.length > 0 && result[0].name) {
      console.log("✅ 通过: 知识提取正常");
      passed++;
    } else {
      console.log("❌ 失败: 知识提取结果为空");
      failed++;
    }
  } catch (error) {
    console.log(`❌ 失败: ${error.message}`);
    failed++;
  }

  // 测试 2: 去重检查器
  console.log("\n测试 2: 去重检查器");
  try {
    const deduplicator = new SkillDeduplicator();
    const knowledge = {
      name: "路由冲突修复",
      category: "routing",
      keywords: ["路由", "nuxt"],
      problem: "URL 跳转但页面不变",
    };
    const existingSkills = [
      {
        name: "nuxt-blog-dev",
        content: "Nuxt 路由规范和常见问题解决方案",
      },
    ];
    const result = await deduplicator.check([knowledge], existingSkills);
    if (Array.isArray(result) && result.length > 0) {
      console.log("✅ 通过: 去重检查正常");
      passed++;
    } else {
      console.log("❌ 失败: 去重检查返回异常");
      failed++;
    }
  } catch (error) {
    console.log(`❌ 失败: ${error.message}`);
    failed++;
  }

  // 测试 3: 验证器
  console.log("\n测试 3: 验证器");
  try {
    const validator = new SkillValidator();
    const validContent = `# 测试技能

## 问题描述

这是一个测试问题

## 解决方案

这是一个测试解决方案

\`\`\`typescript
const test = "test";
\`\`\`
`;
    const errors = validator.validate(validContent);
    if (errors.length === 0) {
      console.log("✅ 通过: 有效内容验证通过");
      passed++;
    } else {
      console.log(`❌ 失败: 有效内容验证失败: ${errors.join(", ")}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ 失败: ${error.message}`);
    failed++;
  }

  // 测试 4: 验证器 - 无效内容
  console.log("\n测试 4: 验证器 - 无效内容检测");
  try {
    const validator = new SkillValidator();
    const invalidContent = "没有标题的无效内容";
    const errors = validator.validate(invalidContent);
    if (errors.length > 0) {
      console.log("✅ 通过: 无效内容被正确检测");
      passed++;
    } else {
      console.log("❌ 失败: 无效内容未被检测");
      failed++;
    }
  } catch (error) {
    console.log(`❌ 失败: ${error.message}`);
    failed++;
  }

  // 测试 5: 技能生成器
  console.log("\n测试 5: 技能生成器");
  try {
    const generator = new SkillGenerator();
    const knowledge = {
      name: "测试技能",
      category: "routing",
      problem: "测试问题",
      solution: "测试解决方案",
      keywords: ["test", "nuxt"],
      applicableScenarios: "测试场景",
    };
    const markdown = generator.generateSkillMarkdown(knowledge);
    const meta = generator.generateMetaJson(knowledge);

    if (markdown.includes("# 测试技能") && meta.name === "测试技能") {
      console.log("✅ 通过: 技能生成正常");
      passed++;
    } else {
      console.log("❌ 失败: 技能生成结果异常");
      failed++;
    }
  } catch (error) {
    console.log(`❌ 失败: ${error.message}`);
    failed++;
  }

  // 总结
  console.log();
  console.log("=".repeat(60));
  console.log("测试总结");
  console.log("=".repeat(60));
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`总计: ${passed + failed}`);
  console.log();

  if (failed === 0) {
    console.log("🎉 所有测试通过！");
  } else {
    console.log("⚠️  部分测试失败，请检查代码");
  }
}

runTests();
