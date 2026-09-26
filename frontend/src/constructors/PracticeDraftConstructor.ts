import type { PracticeDraft, DraftAnswer } from "../types/PracticeDraft";
import { draftId } from "../services/practiceService";
import type { PracticeMode } from "../constants/PracticeMode";

export const createDefaultDraftAnswer = (overrides: Partial<DraftAnswer> = {}): DraftAnswer => ({
  symbol_id: 0,
  mode: "CELL_TO_TEXT",
  user_answer: "",
  correct: false,
  mistake_reason: "",
  latency_ms: 0,
  shown_at: new Date().toISOString(),
  ...overrides
});

// 表单对象：开始练习时构造的草稿默认结构。
export const createPracticeDraftForm = (lessonId: number, mode: PracticeMode, symbolIds: number[]): PracticeDraft => ({
  id: draftId(lessonId, mode),
  lesson_id: lessonId,
  mode,
  started_at: new Date().toISOString(),
  current_index: 0,
  answers: symbolIds.map((symbolId, index) =>
    createDefaultDraftAnswer({
      symbol_id: symbolId,
      mode: mode === "MIXED" ? (["CELL_TO_TEXT", "TEXT_TO_CELL", "LISTENING"][index % 3] as PracticeMode) : mode
    })
  )
});

// 响应对象：从 IndexedDB 读出后补齐结构，防止老草稿缺字段。
export const createPracticeDraftResponse = (raw: Partial<PracticeDraft>): PracticeDraft => ({
  id: raw.id ?? "",
  lesson_id: raw.lesson_id ?? 0,
  mode: raw.mode ?? "CELL_TO_TEXT",
  started_at: raw.started_at ?? new Date().toISOString(),
  current_index: raw.current_index ?? 0,
  answers: (raw.answers ?? []).map((answer) => createDefaultDraftAnswer(answer))
});
