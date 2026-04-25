/**
 * 数学工具函数 (math.ts)
 *
 * 耦合关系：
 *   - app/stores/site.ts          → 导入 clampPercent, generateScatterSlots
 *   - app/components/gameLifeDrawer.vue → 导入 clamp / toPercent
 *
 * 导出函数表：
 *   - clamp(value, min, max)     → 数值钳制，限制在 [min, max] 范围内
 *   - clampPercent(value)        → 百分比钳制，限制在 [0, 100] 范围内
 *   - toPercent(value, total)    → 像素值转百分比
 *   - randomAngle(maxDeg)        → 生成随机角度字符串
 *   - generateScatterSlots(count, margin) → 生成随机分散位置槽
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clampPercent(value: number): number {
  return clamp(value, 0, 100);
}

export function toPercent(value: number, total: number): number {
  return total <= 0 ? 0 : (value / total) * 100;
}

/**
 * 生成随机角度字符串
 * @param maxDeg 最大角度（默认 10 度）
 */
export function randomAngle(maxDeg: number = 10): string {
  const deg = Math.floor(Math.random() * (maxDeg * 2 + 1)) - maxDeg;
  return `${deg}deg`;
}

/**
 * 生成随机分散位置槽
 * @param count 槽位数量
 * @param margin 边距（避免卡片超出边界）
 */
export function generateScatterSlots(count: number = 8, margin: number = 12): import('#shared/types/site').ScatterSlot[] {
  const slots: import('#shared/types/site').ScatterSlot[] = [];
  const maxX = 100 - margin;
  const maxY = 100 - margin;

  for (let i = 0; i < count; i++) {
    slots.push({
      x: clamp(Math.random() * maxX + margin / 2, margin, maxX),
      y: clamp(Math.random() * maxY + margin / 2, margin, maxY),
      angle: randomAngle(8),
    });
  }

  return slots;
}
