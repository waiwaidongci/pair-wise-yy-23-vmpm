import { create } from "zustand";
import { listLesson, saveLesson } from "../api/Lesson";
import type { Lesson } from "../types/Lesson";
import { logWrite } from "../utils/logger";

type State = {
  rows: Lesson[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  upsert: (row: Lesson) => Promise<void>;
};

export const useLessonStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  error: null,
  async load() {
    set({ loading: true, error: null });
    try {
      set({ rows: await listLesson(), loading: false });
    } catch (cause) {
      set({ loading: false, error: (cause as Error).message });
    }
  },
  async upsert(row) {
    await saveLesson(row);
    logWrite("Lesson", 1, row);
    const rows = [...get().rows.filter((item) => item.id !== row.id), row];
    set({ rows });
  }
}));
