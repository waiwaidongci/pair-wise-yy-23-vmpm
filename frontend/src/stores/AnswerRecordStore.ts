import { create } from "zustand";
import { listAnswerRecord } from "../api/AnswerRecord";
import type { AnswerRecord } from "../types/AnswerRecord";

type State = {
  rows: AnswerRecord[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  addMany: (rows: AnswerRecord[]) => void;
};

export const useAnswerRecordStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  error: null,
  async load() {
    set({ loading: true, error: null });
    try {
      set({ rows: await listAnswerRecord(), loading: false });
    } catch (cause) {
      set({ loading: false, error: (cause as Error).message });
    }
  },
  addMany(rows) {
    const ids = new Set(rows.map((row) => row.id));
    set({ rows: [...get().rows.filter((row) => !ids.has(row.id)), ...rows] });
  }
}));
