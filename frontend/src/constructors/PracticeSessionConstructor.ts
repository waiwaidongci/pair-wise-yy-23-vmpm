import type { PracticeSession } from "../types/PracticeSession";

// finished_at 为空字符串表示未完成（仅在构造表单态出现，不会落 practiceSession 表）。
export const createDefaultPracticeSession = (overrides: Partial<PracticeSession> = {}): PracticeSession => ({
  id: 0,
  lesson_id: 0,
  mode: "CELL_TO_TEXT",
  started_at: "",
  finished_at: "",
  score: 0,
  mistake_count: 0,
  ...overrides
});

export const createPracticeSessionForm = createDefaultPracticeSession;
export const createPracticeSessionResponse = createDefaultPracticeSession;
