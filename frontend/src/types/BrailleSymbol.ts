import type { SymbolCategory } from "../constants/SymbolCategory";

// cell_pattern：6 位二进制串，按盲文点位 1..6 顺序，1 表示凸起，如 a = "100000"。
export interface BrailleSymbol {
  id: number;
  cell_pattern: string;
  letter: string;
  pinyin: string;
  category: SymbolCategory;
  difficulty: number; // 1-3 星
  audio_hint_key: string;
}
