import type { PracticeSession } from "../types/PracticeSession";
import type { PracticeDraft } from "../types/PracticeDraft";
import { PracticeMode } from "../constants/PracticeMode";

/** 已完成会话（仅整组完成时由 controller 构造一次）。 */
export const createDefaultPracticeSession = (overrides: Partial<PracticeSession> = {}): PracticeSession => ({
  id: 0,
  lesson_id: null,
  mode: PracticeMode.CELL_TO_TEXT,
  started_at: "",
  finished_at: "",
  score: 0,
  mistake_count: 0,
  total_count: 0,
  source: "LESSON",
  title: "",
  ...overrides
});

export const createPracticeSessionForm = createDefaultPracticeSession;
export const createPracticeSessionResponse = createDefaultPracticeSession;

/**
 * 由完成的草稿构造正式会话。PracticeMode 枚举与 score/mistake_count
 * 在此汇总，字段变更必须同步 logTemplates.commit 与 ProgressPage。
 */
export const createSessionFromDraft = (
  draft: PracticeDraft,
  id: number,
  finishedAt: string
): PracticeSession => {
  const total = draft.answers.length;
  const mistakes = draft.answers.filter((answer) => !answer.correct).length;
  return createDefaultPracticeSession({
    id,
    lesson_id: draft.lesson_id,
    mode: draft.mode,
    started_at: draft.started_at,
    finished_at: finishedAt,
    score: total ? Math.round(((total - mistakes) / total) * 100) : 0,
    mistake_count: mistakes,
    total_count: total,
    source: draft.source,
    title: draft.title
  });
};
