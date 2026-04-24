#!/usr/bin/env node

/**
 * Auto-Skill Evolution CLI
 * 自动技能进化命令行工具
 * 
 * 使用方法:
 * node scripts/auto-skill-evolution/cli.js --task "任务描述" --solution "解决方案"
 * 
 * 或者从文件读取上下文:
 * node scripts/auto-skill-evolution/cli.js --context context.json
 */

import { AutoSkillEvolutionEngine } from "./engine.js";
import fs from "fs";
import path from "path";

// 解析命令行参数
const args = process.argv.slice(2);
const context = {};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--task":
    case "-t":
      context.taskDescription = args[++i];
      break;
    case "--solution":
    case "-s":
      context.solution = args[++i];
      break;
    case "--files":
    case "-f":
      context.modifiedFiles = args[++i].split(",");
      break;
    case "--context":
    case "-c":
      const contextFile = args[++i];
      if (fs.existsSync(contextFile)) {
        const fileContent = fs.readFileSync(contextFile, "utf-8");
        Object.assign(context, JSON.parse(fileContent));
      } else {
        console.error(`上下文文件不存在: ${contextFile}`);
        process.exit(1);
      }
      break;
    case "--help":
    case "-h":
      printHelp();
      process.exit(0);
      break;
    default:
      console.error(`未知参数: ${args[i]}`);
      printHelp();
      process.exit(1);
  }
}

// 验证必填参数
if (!context.taskDescription && !context.contextFile) {
  console.error("错误：请提供任务描述 (--task) 或上下文文件 (--context)");
  printHelp();
  process.exit(1);
}

// 执行技能进化
async function main() {
  console.log("=".repeat(60));
  console.log("Auto-Skill Evolution - 自动技能进化系统");
  console.log("=".repeat(60));
  console.log();

  try {
    const engine = new AutoSkillEvolutionEngine();
    const result = await engine.evolve(context);

    console.log();
    console.log("=".repeat(60));
    console.log("进化结果");
    console.log("=".repeat(60));

    if (result.evolved) {
      console.log(`✅ 成功进化 ${result.results.length} 个技能`);
      console.log();

      for (const item of result.results) {
        const icon = item.action === "created" ? "🆕" : "🔄";
        console.log(`${icon} ${item.action === "created" ? "创建" : "更新"}: ${item.skillName}`);
        console.log(`   路径: ${item.skillPath}`);
      }

      console.log();

      // 显示验证结果
      if (result.validation) {
        console.log("验证结果:");
        for (const v of result.validation) {
          const icon = v.valid ? "✅" : "❌";
          console.log(`${icon} ${v.skillName}: ${v.valid ? "通过" : "失败"}`);
          if (!v.valid && v.errors.length > 0) {
            for (const error of v.errors) {
              console.log(`   - ${error}`);
            }
          }
        }
      }
    } else {
      console.log(`⏭️  跳过进化: ${result.reason}`);
    }

    console.log();
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ 技能进化失败:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Auto-Skill Evolution - 自动技能进化系统

用法:
  node scripts/auto-skill-evolution/cli.js [选项]

选项:
  -t, --task <描述>       任务描述
  -s, --solution <方案>   解决方案描述
  -f, --files <文件列表>  修改的文件列表（逗号分隔）
  -c, --context <文件>    从 JSON 文件读取上下文
  -h, --help              显示帮助信息

示例:
  # 直接指定参数
  node scripts/auto-skill-evolution/cli.js \\
    --task "修复路由跳转问题" \\
    --solution "将 blog.vue 改为 blog/index.vue" \\
    --files "app/pages/blog/index.vue,app/pages/blog/[id].vue"

  # 从文件读取上下文
  node scripts/auto-skill-evolution/cli.js --context context.json

上下文文件格式 (context.json):
{
  "taskDescription": "任务描述",
  "solution": "解决方案",
  "modifiedFiles": ["file1.vue", "file2.ts"],
  "codeChanges": {
    "added": ["..."],
    "removed": ["..."],
    "modified": ["..."]
  }
}
`);
}

main();
