import { create } from "zustand";
import { listPracticeSession } from "../api/PracticeSession";
import { wrapServiceError } from "../utils/errors";
import { logger } from "../utils/logger";
import type { PracticeSession } from "../types/PracticeSession";

type State = {
  rows: PracticeSession[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  upsert: (session: PracticeSession) => void;
};

export const usePracticeSessionStore = create<State>((set) => ({
  rows: [],
  loading: false,
  error: null,
  async load() {
    set({ loading: true, error: null });
    try {
      set({ rows: await listPracticeSession(), loading: false });
    } catch (error) {
      const wrapped = wrapServiceError("store.PracticeSession", error);
      logger.error("store.PracticeSession", wrapped.message);
      set({ loading: false, error: wrapped.message });
    }
  },
  upsert: (session) =>
    set((state) => {
      const rest = state.rows.filter((row) => row.id !== session.id);
      return { rows: [...rest, session] };
    })
}));
