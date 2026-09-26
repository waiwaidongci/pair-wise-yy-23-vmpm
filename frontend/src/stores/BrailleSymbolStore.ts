import { create } from "zustand";
import { listBrailleSymbol } from "../api/BrailleSymbol";
import { wrapServiceError } from "../utils/errors";
import { logger } from "../utils/logger";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { SymbolCategory } from "../types/SymbolCategory";
import type { Difficulty } from "../types/Difficulty";

type State = {
  rows: BrailleSymbol[];
  loading: boolean;
  error: string | null;
  categoryFilter: SymbolCategory | "ALL";
  difficultyFilter: Difficulty | "ALL";
  keyword: string;
  setCategoryFilter: (value: SymbolCategory | "ALL") => void;
  setDifficultyFilter: (value: Difficulty | "ALL") => void;
  setKeyword: (value: string) => void;
  load: () => Promise<void>;
  getSymbol: (id: number) => BrailleSymbol | undefined;
};

export const useBrailleSymbolStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  error: null,
  categoryFilter: "ALL",
  difficultyFilter: "ALL",
  keyword: "",
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setDifficultyFilter: (difficultyFilter) => set({ difficultyFilter }),
  setKeyword: (keyword) => set({ keyword }),
  async load() {
    set({ loading: true, error: null });
    try {
      const rows = await listBrailleSymbol();
      set({ rows, loading: false });
    } catch (error) {
      const wrapped = wrapServiceError("store.BrailleSymbol", error);
      logger.error("store.BrailleSymbol", wrapped.message);
      set({ loading: false, error: wrapped.message });
    }
  },
  getSymbol: (id) => get().rows.find((row) => row.id === id)
}));
