import { create } from "zustand";
import { listAnswerRecord } from "../api/AnswerRecord";
import { wrapServiceError } from "../utils/errors";
import { logger } from "../utils/logger";
import type { AnswerRecord } from "../types/AnswerRecord";

type State = {
  rows: AnswerRecord[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  appendMany: (records: AnswerRecord[]) => void;
};

export const useAnswerRecordStore = create<State>((set) => ({
  rows: [],
  loading: false,
  error: null,
  async load() {
    set({ loading: true, error: null });
    try {
      set({ rows: await listAnswerRecord(), loading: false });
    } catch (error) {
      const wrapped = wrapServiceError("store.AnswerRecord", error);
      logger.error("store.AnswerRecord", wrapped.message);
      set({ loading: false, error: wrapped.message });
    }
  },
  appendMany: (records) =>
    set((state) => {
      const known = new Set(state.rows.map((row) => row.id));
      return { rows: [...state.rows, ...records.filter((record) => !known.has(record.id))] };
    })
}));
