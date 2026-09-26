import type { BrailleSymbol } from "../types/BrailleSymbol";

/**
 * 盲文六点编号：
 *  1 4
 *  2 5
 *  3 6
 * cell_pattern 形如 "1-3-4"，空串表示无点。
 */
export const DOT_COUNT = 6;

export function parsePattern(pattern: string): number[] {
  if (!pattern) return [];
  return pattern
    .split("-")
    .map((part) => Number(part.trim()))
    .filter((dot) => dot >= 1 && dot <= 6)
    .sort((a, b) => a - b);
}

export function isDotRaised(pattern: string, dot: number): boolean {
  return parsePattern(pattern).includes(dot);
}

/** 供“看字摆点”选项使用的图案差异：干扰项 = 正确图案翻转某个点。 */
export function toggleDot(pattern: string, dot: number): string {
  const dots = new Set(parsePattern(pattern));
  if (dots.has(dot)) dots.delete(dot);
  else dots.add(dot);
  return [...dots].sort((a, b) => a - b).join("-");
}

export function patternToDots(pattern: string): boolean[] {
  const raised = new Set(parsePattern(pattern));
  return Array.from({ length: DOT_COUNT }, (_, i) => raised.has(i + 1));
}

/** 两点图案是否等价（写法归一化后比较）。 */
export function samePattern(a: string, b: string): boolean {
  return parsePattern(a).join("-") === parsePattern(b).join("-");
}

export function describeSymbol(symbol: BrailleSymbol): string {
  const dots = parsePattern(symbol.cell_pattern);
  return dots.length ? `第 ${dots.join("、")} 点` : "空方";
}
