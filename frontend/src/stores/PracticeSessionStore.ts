import { create } from "zustand";
import { listPracticeSession } from "../api/PracticeSession";
import type { PracticeSession } from "../types/PracticeSession";

type State = {
  rows: PracticeSession[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  add: (row: PracticeSession) => void;
};

// 只承载已完成会话（API 已过滤未完成草稿），错题本与学习进度均消费本 store。
export const usePracticeSessionStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  error: null,
  async load() {
    set({ loading: true, error: null });
    try {
      set({ rows: await listPracticeSession(), loading: false });
    } catch (cause) {
      set({ loading: false, error: (cause as Error).message });
    }
  },
  add(row) {
    set({ rows: [...get().rows, row].sort((a, b) => a.finished_at.localeCompare(b.finished_at)) });
  }
}));
