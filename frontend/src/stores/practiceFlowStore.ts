import { create } from "zustand";
import type { PracticeDraft } from "../types/PracticeDraft";
import type { PracticeResult } from "../types/PracticeResult";
import type { PracticeMode } from "../types/PracticeMode";
import type { PracticeQuestion } from "../services/questionService";
import {
  startPractice,
  resumeDraft,
  answerQuestion,
  discardDraft,
  commitPractice,
  getQuestions,
  getLatestResult,
  hasActiveDraft
} from "../controllers/practiceController";
import { logger } from "../utils/logger";

export type PracticePhase = "idle" | "active" | "finished";

interface AnswerFeedbackState {
  correct: boolean;
  explanation: string;
  rightAnswer: string;
  userAnswer: string;
}

type State = {
  phase: PracticePhase;
  ready: boolean;
  draft: PracticeDraft | null;
  questions: PracticeQuestion[];
  currentIndex: number;
  feedback: AnswerFeedbackState | null;
  result: PracticeResult | null;
  busy: boolean;
  error: string | null;

  init: () => Promise<{ resumed: boolean }>;
  start: (params: { lessonId: number | null; mode: PracticeMode; symbolIds?: number[]; source: "LESSON" | "RETRY"; title: string }) => Promise<void>;
  answer: (userAnswer: string, latencyMs: number) => Promise<void>;
  next: () => void;
  jumpTo: (index: number) => void;
  finish: () => Promise<void>;
  quit: () => Promise<void>;
  dismissResult: () => void;
};

export const usePracticeFlowStore = create<State>((set, get) => ({
  phase: "idle",
  ready: false,
  draft: null,
  questions: [],
  currentIndex: 0,
  feedback: null,
  result: null,
  busy: false,
  error: null,

  async init() {
    set({ busy: true, error: null });
    try {
      const [draft, lastResult] = await Promise.all([resumeDraft(), getLatestResult()]);
      if (draft && (await hasActiveDraft())) {
        const questions = await getQuestions(draft);
        const firstUnanswered = draft.answers.findIndex((answer) => !answer);
        set({
          phase: "active",
          ready: true,
          draft,
          questions,
          currentIndex: firstUnanswered === -1 ? 0 : firstUnanswered,
          feedback: null,
          result: lastResult,
          busy: false
        });
        return { resumed: true };
      }
      set({ phase: "idle", ready: true, draft: null, result: lastResult, busy: false });
      return { resumed: false };
    } catch (error) {
      logger.error("store.practiceFlow", "初始化练习状态失败", error);
      set({ busy: false, error: error instanceof Error ? error.message : "初始化失败" });
      return { resumed: false };
    }
  },

  async start(params) {
    set({ busy: true, error: null });
    try {
      const draft = await startPractice(params);
      const questions = await getQuestions(draft);
      set({ phase: "active", draft, questions, currentIndex: 0, feedback: null, result: null, busy: false });
    } catch (error) {
      set({ busy: false, error: error instanceof Error ? error.message : "开始练习失败" });
      throw error;
    }
  },

  async answer(userAnswer, latencyMs) {
    const { draft, currentIndex } = get();
    if (!draft || get().busy) return;
    set({ busy: true, error: null });
    try {
      const { draft: nextDraft, feedback } = await answerQuestion(draft, currentIndex, userAnswer, latencyMs);
      set({
        draft: nextDraft,
        busy: false,
        feedback: {
          correct: feedback.correct,
          explanation: feedback.explanation,
          rightAnswer: feedback.rightAnswer,
          userAnswer
        }
      });
    } catch (error) {
      set({ busy: false, error: error instanceof Error ? error.message : "提交作答失败" });
    }
  },

  next() {
    const { currentIndex, draft, questions } = get();
    if (!draft) return;
    const nextIndex = Math.min(currentIndex + 1, questions.length - 1);
    set({ currentIndex: nextIndex, feedback: draft.answers[nextIndex] ? null : null });
  },

  jumpTo(index) {
    const { draft } = get();
    if (!draft) return;
    if (index < 0 || index >= draft.symbol_ids.length) return;
    set({ currentIndex: index, feedback: null });
  },

  async finish() {
    const { draft } = get();
    if (!draft || get().busy) return;
    set({ busy: true, error: null });
    try {
      const result = await commitPractice(draft);
      set({ phase: "finished", draft: null, questions: [], currentIndex: 0, feedback: null, result, busy: false });
    } catch (error) {
      set({ busy: false, error: error instanceof Error ? error.message : "提交练习失败" });
    }
  },

  async quit() {
    await discardDraft();
    set({ phase: "idle", draft: null, questions: [], currentIndex: 0, feedback: null, busy: false });
  },

  dismissResult() {
    set({ result: null });
  }
}));
