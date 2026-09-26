import type { PracticeDraft, DraftAnswer } from "../types/PracticeDraft";
import type { PracticeMode } from "../types/PracticeMode";
import type { MistakeReason } from "../types/MistakeReason";

/** 新建会话草稿（未完成期间只存在该对象，不产生会话与答题记录）。 */
export const createPracticeDraft = (overrides: Partial<PracticeDraft> & Pick<PracticeDraft, "session_key" | "symbol_ids">): PracticeDraft => ({
  lesson_id: null,
  mode: "CELL_TO_TEXT" as PracticeMode,
  source: "LESSON",
  title: "练习",
  variants: [],
  answers: [],
  started_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

/** 单题作答草稿（即时反馈后立刻写入，题目留在当前会话）。 */
export const createDraftAnswer = (
  overrides: Omit<DraftAnswer, "answered_at" | "mistake_reason"> & {
    answered_at?: string;
    mistake_reason?: MistakeReason | "";
  }
): DraftAnswer => ({
  answered_at: new Date().toISOString(),
  mistake_reason: "",
  ...overrides
});
