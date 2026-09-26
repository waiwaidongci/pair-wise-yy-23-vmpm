import type { BrailleSymbol } from "../types/BrailleSymbol";

export const createDefaultBrailleSymbol = (overrides: Partial<BrailleSymbol> = {}): BrailleSymbol => ({
  id: 0,
  cell_pattern: "000000",
  letter: "",
  pinyin: "",
  category: "LETTER",
  difficulty: 1,
  audio_hint_key: "",
  ...overrides
});

export const createBrailleSymbolForm = createDefaultBrailleSymbol;
export const createBrailleSymbolResponse = createDefaultBrailleSymbol;
