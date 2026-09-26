import { create } from "zustand";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { PracticeDraft } from "../types/PracticeDraft";
import type { PracticeSession } from "../types/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";
import type { PracticeMode } from "../constants/PracticeMode";
import {
  startPractice,
  startTargetedPractice,
  answerDraftQuestion,
  touchQuestion,
  completePractice,
  discardDraft,
  listDrafts
} from "../services/practiceService";

interface PendingTarget {
  lessonId: number;
  mode: PracticeMode;
  symbolIds: number[];
}

interface PracticeState {
  draft: PracticeDraft | null;
  busy: boolean;
  error: string | null;
  pendingTarget: PendingTarget | null;
  lastCompleted: { session: PracticeSession; records: AnswerRecord[] } | null;
  restore: () => Promise<PracticeDraft | null>;
  start: (lessonId: number, mode: PracticeMode) => Promise<void>;
  startTarget: (lessonId: number, mode: PracticeMode, symbolIds: number[]) => Promise<void>;
  answer: (lessonId: number, mode: PracticeMode, index: number, raw: string, symbol: BrailleSymbol) => Promise<void>;
  enterQuestion: (lessonId: number, mode: PracticeMode, index: number) => Promise<void>;
  finish: (lessonId: number, mode: PracticeMode) => Promise<void>;
  abandon: (lessonId: number, mode: PracticeMode) => Promise<void>;
  clearError: () => void;
  clearLastCompleted: () => void;
}

// 练习模式唯一状态出口：未完成时只持有草稿，整组完成后通过回调把会话/记录灌入只读 store。
export const usePracticeStore = create<PracticeState>((set, get) => ({
  draft: null,
  busy: false,
  error: null,
  pendingTarget: null,
  lastCompleted: null,

  async restore() {
    const drafts = await listDrafts();
    const draft = drafts[0] ?? null; // 课堂练习模式同时只跟踪一个进行中的草稿
    set({ draft });
    return draft;
  },

  async start(lessonId, mode) {
    set({ busy: true, error: null, pendingTarget: null });
    try {
      const draft = await startPractice(lessonId, mode);
      set({ draft, busy: false, lastCompleted: null });
    } catch (cause) {
      set({ busy: false, error: (cause as Error).message });
    }
  },

  async startTarget(lessonId, mode, symbolIds) {
    set({ busy: true, error: null, pendingTarget: { lessonId, mode, symbolIds } });
    try {
      const draft = await startTargetedPractice(lessonId, mode, symbolIds);
      set({ draft, busy: false, lastCompleted: null });
    } catch (cause) {
      set({ busy: false, error: (cause as Error).message });
    }
  },

  async answer(lessonId, mode, index, raw, symbol) {
    set({ busy: true, error: null });
    try {
      const draft = await answerDraftQuestion(lessonId, mode, index, raw, symbol);
      set({ draft, busy: false });
    } catch (cause) {
      set({ busy: false, error: (cause as Error).message });
    }
  },

  async enterQuestion(lessonId, mode, index) {
    const current = get().draft;
    if (!current) return;
    const draft = await touchQuestion(lessonId, mode, index);
    set({ draft });
  },

  async finish(lessonId, mode) {
    set({ busy: true, error: null });
    try {
      const result = await completePractice(lessonId, mode);
      set({ draft: null, busy: false, lastCompleted: result });
    } catch (cause) {
      set({ busy: false, error: (cause as Error).message });
    }
  },

  async abandon(lessonId, mode) {
    set({ busy: true, error: null });
    try {
      await discardDraft(lessonId, mode);
      set({ draft: null, busy: false });
    } catch (cause) {
      set({ busy: false, error: (cause as Error).message });
    }
  },

  clearError() {
    set({ error: null });
  },
  clearLastCompleted() {
    set({ lastCompleted: null, pendingTarget: null });
  }
}));
