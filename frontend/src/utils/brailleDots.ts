import type { BrailleSymbol } from "../types/BrailleSymbol";

// cell_pattern 为 6 位 0/1 串，下标 0..5 对应盲文点位 1..6。
export function patternToDots(pattern: string): number[] {
  const dots: number[] = [];
  for (let i = 0; i < 6; i += 1) {
    if (pattern[i] === "1") dots.push(i + 1);
  }
  return dots;
}

export function dotsToPattern(dots: number[]): string {
  const set = new Set(dots);
  return [1, 2, 3, 4, 5, 6].map((dot) => (set.has(dot) ? "1" : "0")).join("");
}

export function isSamePattern(a: string, b: string): boolean {
  return patternToDots(a).join(",") === patternToDots(b).join(",");
}

// TEXT_TO_CELL 作答解析：用户输入形如 "1,3,5" 或 "135"
export function parseDotsInput(raw: string): number[] {
  const matches = raw.match(/[1-6]/g) ?? [];
  return Array.from(new Set(matches.map(Number))).sort((a, b) => a - b);
}

// 按 symbol 查表的便捷判断
export function matchSymbolDots(symbol: BrailleSymbol, raw: string): boolean {
  return dotsToPattern(parseDotsInput(raw)) === symbol.cell_pattern;
}
