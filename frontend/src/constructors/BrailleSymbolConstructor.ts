import type { BrailleSymbol } from "../types/BrailleSymbol";
import { SymbolCategory } from "../constants/SymbolCategory";
import { Difficulty } from "../constants/Difficulty";

/** 默认对象（SymbolCategory/Difficulty 枚举在构造器层的出现位置）。 */
export const createDefaultBrailleSymbol = (overrides: Partial<BrailleSymbol> = {}): BrailleSymbol => ({
  id: 0,
  cell_pattern: "",
  letter: "",
  pinyin: "",
  category: SymbolCategory.LETTER,
  difficulty: Difficulty.EASY,
  audio_hint_key: "",
  ...overrides
});

/** 表单对象：新增字符弹窗初始值。 */
export const createBrailleSymbolForm = (overrides: Partial<BrailleSymbol> = {}): BrailleSymbol =>
  createDefaultBrailleSymbol({ audio_hint_key: overrides.letter ? `letter:${overrides.letter}` : "", ...overrides });

/** 响应对象：导入数据归一化（容错旧字段名）。 */
export const createBrailleSymbolResponse = (raw: Partial<BrailleSymbol> & { id: number }): BrailleSymbol =>
  createDefaultBrailleSymbol({
    ...raw,
    id: Number(raw.id),
    cell_pattern: String(raw.cell_pattern ?? ""),
    letter: String(raw.letter ?? ""),
    pinyin: String(raw.pinyin ?? raw.letter ?? ""),
    category: (raw.category as BrailleSymbol["category"]) ?? SymbolCategory.LETTER,
    difficulty: (raw.difficulty as BrailleSymbol["difficulty"]) ?? Difficulty.MEDIUM,
    audio_hint_key: String(raw.audio_hint_key ?? `symbol:${raw.id}`)
  });
