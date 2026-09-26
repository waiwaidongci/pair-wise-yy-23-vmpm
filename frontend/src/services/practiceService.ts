import type { Lesson } from "../types/Lesson";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { PracticeDraft, DraftAnswer } from "../types/PracticeDraft";
import type { PracticeSession } from "../types/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";
import type { PracticeMode } from "../constants/PracticeMode";
import { PracticeMode as PRACTICE_MODES } from "../constants/PracticeMode";
import { ERROR_CODES } from "../constants/errorCodes";
import { ServiceError } from "../utils/errors";
import { logWrite } from "../utils/logger";
import { gradeAnswer } from "./gradingService";
import { calculateScore } from "./progressService";
import { listLesson } from "../api/Lesson";
import { listBrailleSymbol } from "../api/BrailleSymbol";
import {
  listPracticeDraft,
  savePracticeDraft,
  deletePracticeDraft
} from "../api/PracticeDraft";
import { commitPracticeSession } from "../api/PracticeSession";
import { nextSessionId, nextRecordId } from "../api/practiceCommit";

export function draftId(lessonId: number, mode: PracticeMode): string {
  return `${lessonId}:${mode}`;
}

async function requireLessonContext(lessonId: number): Promise<{ lesson: Lesson; symbols: BrailleSymbol[] }> {
  const [lessons, symbols] = await Promise.all([listLesson(), listBrailleSymbol()]);
  const lesson = lessons.find((row) => row.id === lessonId);
  if (!lesson || lesson.symbol_ids.length === 0) throw new ServiceError(ERROR_CODES.LESSON_EMPTY);
  const map = new Map(symbols.map((symbol) => [symbol.id, symbol]));
  const lessonSymbols = lesson.symbol_ids
    .map((id) => map.get(id))
    .filter((symbol): symbol is BrailleSymbol => Boolean(symbol));
  if (lessonSymbols.length === 0) throw new ServiceError(ERROR_CODES.LESSON_EMPTY);
  return { lesson, symbols: lessonSymbols };
}

// MIXED：逐题轮换模式并固化到草稿，续答时题目模式不漂移。
function resolveItemMode(baseMode: PracticeMode, index: number): PracticeMode {
  if (baseMode !== "MIXED") return baseMode;
  const modes = PRACTICE_MODES.filter((mode) => mode !== "MIXED");
  return modes[index % modes.length];
}

export async function startPractice(lessonId: number, mode: PracticeMode): Promise<PracticeDraft> {
  if (!PRACTICE_MODES.includes(mode)) throw new ServiceError(ERROR_CODES.UNSUPPORTED_PRACTICE_MODE);
  const { symbols } = await requireLessonContext(lessonId);
  const existing = await listPracticeDraft();
  const id = draftId(lessonId, mode);
  const previous = existing.find((draft) => draft.id === id);
  if (previous) {
    logWrite("PracticeDraft", 3, previous);
    return previous;
  }
  // 课堂练习模式同时只保留一个进行中草稿：开始新组时清理其它未完成草稿。
  await Promise.all(
    existing
      .filter((draft) => draft.id !== id)
      .map((draft) => deletePracticeDraft(draft.id).then(() => logWrite("PracticeDraft", 2, { draftId: draft.id })))
  );
  const draft: PracticeDraft = {
    id,
    lesson_id: lessonId,
    mode,
    started_at: new Date().toISOString(),
    current_index: 0,
    answers: symbols.map((symbol, index) => ({
      symbol_id: symbol.id,
      mode: resolveItemMode(mode, index),
      user_answer: "",
      correct: false,
      mistake_reason: "",
      latency_ms: 0,
      shown_at: new Date().toISOString()
    }))
  };
  const saved = await savePracticeDraft(draft);
  logWrite("PracticeSession", 0, { draftId: saved.id });
  logWrite("PracticeDraft", 0, saved);
  return saved;
}

// 错题本“重练”：以课程为单位、只含指定符号的单题草稿；答对后该符号标记已掌握。
export async function startTargetedPractice(
  lessonId: number,
  mode: PracticeMode,
  symbolIds: number[]
): Promise<PracticeDraft> {
  if (!PRACTICE_MODES.includes(mode)) throw new ServiceError(ERROR_CODES.UNSUPPORTED_PRACTICE_MODE);
  const { symbols } = await requireLessonContext(lessonId);
  const allowed = new Set(symbols.map((symbol) => symbol.id));
  const targets = symbolIds.filter((id) => allowed.has(id));
  if (targets.length === 0) throw new ServiceError(ERROR_CODES.LESSON_EMPTY);
  const existing = await listPracticeDraft();
  await Promise.all(
    existing.map((draft) => deletePracticeDraft(draft.id).then(() => logWrite("PracticeDraft", 2, { draftId: draft.id })))
  );
  const draft: PracticeDraft = {
    id: draftId(lessonId, mode),
    lesson_id: lessonId,
    mode,
    started_at: new Date().toISOString(),
    current_index: 0,
    answers: targets.map((symbolId, index) => ({
      symbol_id: symbolId,
      mode: resolveItemMode(mode, index),
      user_answer: "",
      correct: false,
      mistake_reason: "",
      latency_ms: 0,
      shown_at: new Date().toISOString()
    }))
  };
  const saved = await savePracticeDraft(draft);
  logWrite("PracticeSession", 0, { draftId: saved.id, targeted: true });
  logWrite("PracticeDraft", 0, saved);
  return saved;
}

export async function resumeDraft(lessonId: number, mode: PracticeMode): Promise<PracticeDraft | null> {
  const existing = await listPracticeDraft();
  const found = existing.find((draft) => draft.id === draftId(lessonId, mode)) ?? null;
  if (found) logWrite("PracticeDraft", 3, found);
  return found;
}

export async function listDrafts(): Promise<PracticeDraft[]> {
  return listPracticeDraft();
}

export async function discardDraft(lessonId: number, mode: PracticeMode): Promise<void> {
  await deletePracticeDraft(draftId(lessonId, mode));
  logWrite("PracticeDraft", 2, { draftId: draftId(lessonId, mode) });
}

async function getDraft(lessonId: number, mode: PracticeMode): Promise<PracticeDraft> {
  const existing = await listPracticeDraft();
  const draft = existing.find((row) => row.id === draftId(lessonId, mode));
  if (!draft) throw new ServiceError(ERROR_CODES.DRAFT_NOT_FOUND);
  return draft;
}

// 每题作答：立即判定对错，题目保留在草稿中，可重新作答；未完成期间不产生答题记录。
export async function answerDraftQuestion(
  lessonId: number,
  mode: PracticeMode,
  index: number,
  rawAnswer: string,
  symbol: BrailleSymbol
): Promise<PracticeDraft> {
  const draft = await getDraft(lessonId, mode);
  const item = draft.answers[index];
  if (!item || item.symbol_id !== symbol.id) throw new ServiceError(ERROR_CODES.ANSWER_NOT_IN_DRAFT);
  const result = gradeAnswer(symbol, item.mode, rawAnswer);
  const latency = Math.max(0, Date.now() - new Date(item.shown_at).getTime());
  const updated: DraftAnswer = {
    ...item,
    user_answer: result.normalized,
    correct: result.correct,
    mistake_reason: result.mistake_reason,
    latency_ms: latency
  };
  const answers = draft.answers.map((row, rowIndex) => (rowIndex === index ? updated : row));
  const nextDraft: PracticeDraft = {
    ...draft,
    answers,
    current_index: Math.max(draft.current_index, Math.min(index + 1, answers.length - 1))
  };
  const saved = await savePracticeDraft(nextDraft);
  logWrite("AnswerRecord", 0, { draftId: saved.id, index });
  logWrite("PracticeDraft", 1, { draftId: saved.id, index });
  return saved;
}

// 进入某题时刷新该题的展示时间，用于 latency 统计。
export async function touchQuestion(lessonId: number, mode: PracticeMode, index: number): Promise<PracticeDraft> {
  const draft = await getDraft(lessonId, mode);
  const item = draft.answers[index];
  if (!item) return draft;
  if (item.user_answer) return draft; // 已作答题目不重置计时
  const answers = draft.answers.map((row, rowIndex) =>
    rowIndex === index ? { ...row, shown_at: new Date().toISOString() } : row
  );
  return savePracticeDraft({ ...draft, answers });
}

export interface CompletedPractice {
  session: PracticeSession;
  records: AnswerRecord[];
}

// 整组完成：校验每题都已作答，一次事务生成会话和答题记录，随后删除草稿。
export async function completePractice(lessonId: number, mode: PracticeMode): Promise<CompletedPractice> {
  const draft = await getDraft(lessonId, mode);
  const unanswered = draft.answers.filter((item) => item.user_answer === "");
  if (unanswered.length > 0) throw new ServiceError(ERROR_CODES.SESSION_INCOMPLETE);

  const { symbols } = await requireLessonContext(lessonId);
  const symbolMap = new Map(symbols.map((symbol) => [symbol.id, symbol]));
  for (const item of draft.answers) {
    if (!symbolMap.has(item.symbol_id)) throw new ServiceError(ERROR_CODES.VALIDATION_FAILED);
  }

  const { score, mistake_count } = calculateScore(draft.answers);
  const [sessionId, recordIdStart] = await Promise.all([nextSessionId(), nextRecordId()]);
  const finishedAt = new Date().toISOString();
  const session: PracticeSession = {
    id: sessionId,
    lesson_id: lessonId,
    mode: draft.mode,
    started_at: draft.started_at,
    finished_at: finishedAt,
    score,
    mistake_count
  };
  const records: AnswerRecord[] = draft.answers.map((item, index) => ({
    id: recordIdStart + index,
    session_id: sessionId,
    symbol_id: item.symbol_id,
    user_answer: item.user_answer,
    correct: item.correct,
    latency_ms: item.latency_ms,
    mistake_reason: item.mistake_reason
  }));

  await commitPracticeSession(session, records);
  await deletePracticeDraft(draft.id);
  logWrite("PracticeSession", 1, session);
  logWrite("AnswerRecord", 1, { sessionId: session.id, count: records.length });
  logWrite("PracticeSession", 2, session);
  return { session, records };
}
