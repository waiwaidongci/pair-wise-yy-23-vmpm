import { create } from "zustand";
import { listMistakes, markMastered, unmarkMastered } from "../controllers/mistakeController";
import type { MistakeBookEntry } from "../types/MistakeBookEntry";
import type { MistakeReason } from "../types/MistakeReason";
import type { MasteryLevel } from "../types/MasteryLevel";

type State = {
  entries: MistakeBookEntry[];
  loading: boolean;
  error: string | null;
  reasonFilter: MistakeReason | "ALL";
  masteryFilter: MasteryLevel | "ALL";
  keyword: string;
  setReasonFilter: (value: MistakeReason | "ALL") => void;
  setMasteryFilter: (value: MasteryLevel | "ALL") => void;
  setKeyword: (value: string) => void;
  load: () => Promise<void>;
  mark: (symbolId: number) => Promise<void>;
  unmark: (symbolId: number) => Promise<void>;
};

export const useMistakeStore = create<State>((set, get) => ({
  entries: [],
  loading: false,
  error: null,
  reasonFilter: "ALL",
  masteryFilter: "ALL",
  keyword: "",
  setReasonFilter: (reasonFilter) => set({ reasonFilter }),
  setMasteryFilter: (masteryFilter) => set({ masteryFilter }),
  setKeyword: (keyword) => set({ keyword }),
  async load() {
    const { reasonFilter, masteryFilter, keyword } = get();
    set({ loading: true, error: null });
    try {
      const entries = await listMistakes({ reason: reasonFilter, mastery: masteryFilter, keyword });
      set({ entries, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : "加载错题本失败" });
    }
  },
  async mark(symbolId) {
    await markMastered(symbolId);
    await get().load();
  },
  async unmark(symbolId) {
    await unmarkMastered(symbolId);
    await get().load();
  }
}));
