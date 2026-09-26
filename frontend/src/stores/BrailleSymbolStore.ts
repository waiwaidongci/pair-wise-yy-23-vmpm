import { create } from "zustand";
import { listBrailleSymbol, saveBrailleSymbol } from "../api/BrailleSymbol";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import { logWrite } from "../utils/logger";

type State = {
  rows: BrailleSymbol[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  upsert: (row: BrailleSymbol) => Promise<void>;
};

export const useBrailleSymbolStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  error: null,
  async load() {
    set({ loading: true, error: null });
    try {
      set({ rows: await listBrailleSymbol(), loading: false });
    } catch (cause) {
      set({ loading: false, error: (cause as Error).message });
    }
  },
  async upsert(row) {
    await saveBrailleSymbol(row);
    logWrite("BrailleSymbol", 1, row);
    const rows = [...get().rows.filter((item) => item.id !== row.id), row];
    set({ rows });
  }
}));
