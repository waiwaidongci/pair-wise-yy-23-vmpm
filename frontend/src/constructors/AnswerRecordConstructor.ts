import type { AnswerRecord } from "../types/AnswerRecord";
import type { DraftAnswer } from "../types/PracticeDraft";

export const createDefaultAnswerRecord = (overrides: Partial<AnswerRecord> = {}): AnswerRecord => ({
  id: 0,
  session_id: 0,
  symbol_id: 0,
  user_answer: "",
  correct: false,
  latency_ms: 0,
  mistake_reason: "",
  answered_at: "",
  variant: "CELL_TO_TEXT",
  ...overrides
});

export const createAnswerRecordForm = createDefaultAnswerRecord;
export const createAnswerRecordResponse = createDefaultAnswerRecord;

/** 草稿作答 → 正式答题记录（随会话整组一次性构造）。 */
export const createAnswerRecordFromDraft = (
  draftAnswer: DraftAnswer,
  id: number,
  sessionId: number
): AnswerRecord =>
  createDefaultAnswerRecord({
    id,
    session_id: sessionId,
    symbol_id: draftAnswer.symbol_id,
    user_answer: draftAnswer.user_answer,
    correct: draftAnswer.correct,
    latency_ms: draftAnswer.latency_ms,
    mistake_reason: draftAnswer.mistake_reason,
    answered_at: draftAnswer.answered_at,
    variant: draftAnswer.variant
  });
