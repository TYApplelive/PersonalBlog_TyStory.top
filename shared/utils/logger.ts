/**
 * 统一日志工具 (logger)
 *
 * 使用方式：
 *   import { logger } from '#shared/utils/logger'
 *   logger.info('[API]', '消息内容')
 *   logger.error('[模块]', '错误信息', error)
 *
 * 日志级别（通过 LOG_LEVEL 环境变量控制）：
 *   'silent' → 全部关闭
 *   'error'  → 仅 error
 *   'warn'   → error + warn
 *   'info'   → error + warn + info
 *   'debug'  → 全部开启（默认）
 */

type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

function getCurrentLevel(): LogLevel {
  // 服务端：从 runtimeConfig 或环境变量读取
  if (typeof process !== 'undefined' && process.env?.LOG_LEVEL) {
    return process.env.LOG_LEVEL as LogLevel;
  }
  return 'debug';
}

const currentLevel = getCurrentLevel();
const currentPriority = LEVEL_PRIORITY[currentLevel] ?? 4;

function shouldLog(level: LogLevel): boolean {
  return (LEVEL_PRIORITY[level] ?? 0) <= currentPriority;
}

// 格式化参数为字符串
function formatArgs(args: unknown[]): string {
  return args.map(arg => {
    if (arg instanceof Error) {
      return `[${arg.name}] ${arg.message}`;
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
}

export const logger = {
  debug(...args: unknown[]) {
    if (shouldLog('debug')) {
      console.log(`🔍 [DEBUG]`, ...args);
    }
  },

  info(...args: unknown[]) {
    if (shouldLog('info')) {
      console.log(`ℹ️ [INFO] `, ...args);
    }
  },

  warn(...args: unknown[]) {
    if (shouldLog('warn')) {
      console.warn(`⚠️ [WARN] `, ...args);
    }
  },

  error(...args: unknown[]) {
    if (shouldLog('error')) {
      console.error(`❌ [ERROR]`, ...args);
    }
  },

  /** 分隔线（用于标记流程边界） */
  separator(title?: string) {
    if (currentPriority > 0) {
      const msg = title ? ` ${title} ` : '';
      console.log('='.repeat(50) + msg + '='.repeat(50));
    }
  },
};

/** 快捷导出：按模块创建带前缀的 logger */
export function createModuleLogger(module: string) {
  return {
    debug: (...args: unknown[]) => logger.debug(`[${module}]`, ...args),
    info: (...args: unknown[]) => logger.info(`[${module}]`, ...args),
    warn: (...args: unknown[]) => logger.warn(`[${module}]`, ...args),
    error: (...args: unknown[]) => logger.error(`[${module}]`, ...args),
    separator: (...args: unknown[]) => logger.separator(formatArgs(args) as string | undefined),
  };
}
