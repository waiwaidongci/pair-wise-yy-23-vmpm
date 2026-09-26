import { idb, STORE_NAMES, transactional } from "../utils/db";
import { AppError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";
import { PRACTICE_SESSION_LOG_TEMPLATES, ANSWER_RECORD_LOG_TEMPLATES } from "../constants/logTemplates";
import { logger } from "../utils/logger";
import type { PracticeSession } from "../types/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";

export async function listPracticeSession(): Promise<PracticeSession[]> {
  try {
    return await idb.list<PracticeSession>(STORE_NAMES.sessions);
  } catch (error) {
    throw new AppError(ERROR_CODES.STORE_UNAVAILABLE, "api", "读取练习会话失败", error);
  }
}

export async function maxSessionId(): Promise<number> {
  const rows = await listPracticeSession();
  return rows.reduce((max, row) => Math.max(max, row.id), 0);
}

export async function maxAnswerRecordId(): Promise<number> {
  const rows = await idb.list<AnswerRecord>(STORE_NAMES.records);
  return rows.reduce((max, row) => Math.max(max, row.id), 0);
}

/**
 * 整组完成：会话 + 答题记录在同一个 IndexedDB 事务中一次写入。
 * 草稿（meta 区）与此无关，未完成绝不进入这里。
 */
export async function commitSessionWithRecords(
  session: PracticeSession,
  records: AnswerRecord[]
): Promise<void> {
  await transactional([STORE_NAMES.sessions, STORE_NAMES.records], "readwrite", (stores) => {
    stores[STORE_NAMES.sessions].put(session);
    records.forEach((record) => stores[STORE_NAMES.records].put(record));
  });
  logger.info(
    "api.PracticeSession",
    PRACTICE_SESSION_LOG_TEMPLATES.commit({
      id: session.id,
      total: records.length,
      score: session.score,
      mistakes: session.mistake_count
    })
  );
  logger.info("api.AnswerRecord", ANSWER_RECORD_LOG_TEMPLATES.batchCreate({ id: session.id, count: records.length }));
}
