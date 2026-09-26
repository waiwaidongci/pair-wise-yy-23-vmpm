import type { PracticeResult } from "../types/PracticeResult";
import type { PracticeSession } from "../types/PracticeSession";
import type { PracticeDraft } from "../types/PracticeDraft";

/** 整组完成后的结算视图（同时缓存到 IDB，切回练习页仍能看到这次结果）。 */
export const createPracticeResult = (
  session: PracticeSession,
  draft: PracticeDraft
): PracticeResult => ({
  session_id: session.id,
  lesson_id: session.lesson_id,
  mode: session.mode,
  title: session.title,
  source: session.source,
  score: session.score,
  total_count: session.total_count,
  correct_count: session.total_count - session.mistake_count,
  mistake_count: session.mistake_count,
  started_at: session.started_at,
  finished_at: session.finished_at,
  symbol_ids: draft.symbol_ids
});
