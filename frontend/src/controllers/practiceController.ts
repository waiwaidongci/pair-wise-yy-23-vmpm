import { getDraft, saveDraft, clearDraft, getLastResult, saveLastResult } from "../api/Meta";
import { listBrailleSymbol } from "../api/BrailleSymbol";
import { listLesson } from "../api/Lesson";
import {
  commitSessionWithRecords,
  maxSessionId,
  maxAnswerRecordId
} from "../api/PracticeSession";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES, MISTAKE_REASON_HINT, MODE_ERROR_SUFFIX } from "../constants/errorMessages";
import { PRACTICE_SESSION_LOG_TEMPLATES } from "../constants/logTemplates";
import { PracticeMode } from "../constants/PracticeMode";
import { AppError, wrapControllerError } from "../utils/errors";
import { logger } from "../utils/logger";
import { createPracticeDraft, createDraftAnswer } from "../constructors/PracticeDraftConstructor";
import { createSessionFromDraft } from "../constructors/PracticeSessionConstructor";
import { createAnswerRecordFromDraft } from "../constructors/AnswerRecordConstructor";
import { createPracticeResult } from "../constructors/PracticeResultConstructor";
import { buildQuestion, gradeAnswer, resolveVariant, type PracticeQuestion } from "../services/questionService";
import type { PracticeDraft } from "../types/PracticeDraft";
import type { PracticeResult } from "../types/PracticeResult";
import type { PracticeMode as Mode } from "../types/PracticeMode";

export interface AnswerFeedback {
  correct: boolean;
  mistakeReason: string;
  /** 面向学生的错误原因解释 */
  explanation: string;
  rightAnswer: string;
}

function validateMode(mode: string): asserts mode is Mode {
  if (!Object.values(PracticeMode).includes(mode as Mode)) {
    throw new AppError(ERROR_CODES.MODE_UNSUPPORTED, "controller", ERROR_MESSAGES.MODE_UNSUPPORTED);
  }
}

/** 开始一组练习（课程练习或错题重练）。已有未完成草稿时拒绝，避免覆盖。 */
export async function startPractice(params: {
  lessonId: number | null;
  mode: Mode;
  symbolIds?: number[];
  source: "LESSON" | "RETRY";
  title: string;
}): Promise<PracticeDraft> {
  try {
    validateMode(params.mode);
    const existing = await getDraft();
    if (existing && existing.answers.length < existing.symbol_ids.length) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, "controller", "已有未完成的练习，请先继续或放弃该组练习");
    }

    const [allSymbols, lessons] = await Promise.all([listBrailleSymbol(), listLesson()]);
    let symbolIds = params.symbolIds ?? [];
    let title = params.title;
    if (params.source === "LESSON" && params.lessonId != null) {
      const lesson = lessons.find((item) => item.id === params.lessonId);
      if (!lesson) throw new AppError(ERROR_CODES.NOT_FOUND, "controller", ERROR_MESSAGES.NOT_FOUND);
      if (lesson.symbol_ids.length === 0) throw new AppError(ERROR_CODES.LESSON_EMPTY, "controller", ERROR_MESSAGES.LESSON_EMPTY);
      symbolIds = lesson.symbol_ids;
      title = lesson.title;
    }
    const symbols = symbolIds
      .map((id) => allSymbols.find((symbol) => symbol.id === id))
      .filter((s): s is (typeof allSymbols)[number] => Boolean(s));
    if (symbols.length === 0) throw new AppError(ERROR_CODES.LESSON_EMPTY, "controller", ERROR_MESSAGES.LESSON_EMPTY);

    const sessionKey = `practice-${params.source}-${params.lessonId ?? "mixed"}-${Date.now()}`;
    const variants = symbols.map((_, index) => resolveVariant(params.mode, index, sessionKey));
    const draft = createPracticeDraft({
      session_key: sessionKey,
      lesson_id: params.lessonId,
      mode: params.mode,
      source: params.source,
      title,
      symbol_ids: symbols.map((symbol) => symbol.id),
      variants
    });
    await saveDraft(draft);
    logger.info(
      "controller.practice",
      PRACTICE_SESSION_LOG_TEMPLATES.draftCreate({ id: sessionKey, mode: params.mode, total: symbols.length })
    );
    return draft;
  } catch (error) {
    throw wrapControllerError("controller.practice", error);
  }
}

/** 下次回来接着答：恢复草稿（未完成，不计入错题本与进度）。 */
export async function resumeDraft(): Promise<PracticeDraft | null> {
  try {
    const draft = await getDraft();
    if (!draft) return null;
    if (draft.answers.length >= draft.symbol_ids.length) {
      logger.warn("controller.practice", PRACTICE_SESSION_LOG_TEMPLATES.draftResume({ id: draft.session_key, done: draft.answers.length, total: draft.symbol_ids.length }));
      return draft;
    }
    logger.info(
      "controller.practice",
      PRACTICE_SESSION_LOG_TEMPLATES.draftResume({ id: draft.session_key, done: draft.answers.length, total: draft.symbol_ids.length })
    );
    return draft;
  } catch (error) {
    throw wrapControllerError("controller.practice", error);
  }
}

export async function hasActiveDraft(): Promise<boolean> {
  const draft = await getDraft();
  return Boolean(draft && draft.answers.length < draft.symbol_ids.length);
}

/** 由草稿构造当前题目（题目内容与选项顺序由种子随机决定，续答保持一致）。 */
export async function getQuestions(draft: PracticeDraft): Promise<PracticeQuestion[]> {
  const allSymbols = await listBrailleSymbol();
  return draft.symbol_ids.map((symbolId, index) => {
    const symbol = allSymbols.find((item) => item.id === symbolId)!;
    return buildQuestion(symbol, draft.variants[index], allSymbols, index, draft.session_key);
  });
}

/**
 * 作答一题：先判题返回对错与错误原因（即时反馈），
 * 同时把作答写入草稿并持久化（题目留在当前会话，可回看但不可改）。
 * 此时不生成会话/答题记录，故不计入错题本和学习进度。
 */
export async function answerQuestion(
  draft: PracticeDraft,
  index: number,
  userAnswer: string,
  latencyMs: number
): Promise<{ draft: PracticeDraft; feedback: AnswerFeedback }> {
  try {
    if (index < 0 || index >= draft.symbol_ids.length) {
      throw new AppError(ERROR_CODES.QUESTION_INDEX_INVALID, "controller", ERROR_MESSAGES.QUESTION_INDEX_INVALID);
    }
    if (draft.answers[index]) {
      // 已答过的题允许查看反馈，但不覆盖草稿
      const questions = await getQuestions(draft);
      const previous = draft.answers[index];
      return {
        draft,
        feedback: {
          correct: previous.correct,
          mistakeReason: previous.mistake_reason,
          explanation: previous.correct
            ? "回答正确"
            : `${MISTAKE_REASON_HINT[previous.mistake_reason] ?? ERROR_MESSAGES.VALIDATION_FAILED}${MODE_ERROR_SUFFIX[draft.mode] ?? ""}`,
          rightAnswer: questions[index].answer
        }
      };
    }

    const questions = await getQuestions(draft);
    const question = questions[index];
    const { correct, mistakeReason } = gradeAnswer(question, userAnswer, draft.mode);
    const draftAnswer = createDraftAnswer({
      symbol_id: question.symbol.id,
      variant: question.variant,
      user_answer: userAnswer,
      correct,
      latency_ms: latencyMs,
      mistake_reason: mistakeReason
    });
    const answers = [...draft.answers];
    answers[index] = draftAnswer;
    const nextDraft = createPracticeDraft({ ...draft, answers, updated_at: new Date().toISOString() });
    await saveDraft(nextDraft);
    logger.info(
      "controller.practice",
      PRACTICE_SESSION_LOG_TEMPLATES.draftAnswer({
        id: draft.session_key,
        index: index + 1,
        total: draft.symbol_ids.length,
        correct,
        latency: latencyMs
      })
    );
    return {
      draft: nextDraft,
      feedback: {
        correct,
        mistakeReason,
        explanation: correct
          ? "回答正确！"
          : `${MISTAKE_REASON_HINT[mistakeReason] ?? ERROR_MESSAGES.VALIDATION_FAILED}${MODE_ERROR_SUFFIX[draft.mode] ?? ""}`,
        rightAnswer: question.answer
      }
    };
  } catch (error) {
    throw wrapControllerError("controller.practice", error);
  }
}

/** 放弃草稿：已作答内容直接丢弃，不产生任何记录。 */
export async function discardDraft(): Promise<void> {
  const draft = await getDraft();
  if (draft) {
    logger.info(
      "controller.practice",
      PRACTICE_SESSION_LOG_TEMPLATES.draftDiscard({ id: draft.session_key, done: draft.answers.length })
    );
  }
  await clearDraft();
}

/**
 * 整组完成：一次生成练习会话与全部答题记录（同一事务）。
 * 成功后删除草稿、缓存结算结果（切回页面仍能看到这次结果）。
 */
export async function commitPractice(draft: PracticeDraft): Promise<PracticeResult> {
  try {
    if (draft.answers.length !== draft.symbol_ids.length || draft.answers.some((answer) => !answer)) {
      throw new AppError(ERROR_CODES.DRAFT_NOT_FOUND, "controller", "还有题目未完成，无法提交整组练习");
    }
    const [sessionId, recordId] = await Promise.all([maxSessionId(), maxAnswerRecordId()]);
    const finishedAt = new Date().toISOString();
    const session = createSessionFromDraft(draft, sessionId + 1, finishedAt);
    const records = draft.answers.map((answer, index) =>
      createAnswerRecordFromDraft(answer, recordId + index + 1, session.id)
    );
    await commitSessionWithRecords(session, records);

    const result = createPracticeResult(session, draft);
    await saveLastResult(result);
    await clearDraft();
    return result;
  } catch (error) {
    throw wrapControllerError("controller.practice", error);
  }
}

export async function getLatestResult(): Promise<PracticeResult | null> {
  return (await getLastResult()) ?? null;
}
