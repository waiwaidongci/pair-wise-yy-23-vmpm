import { idb, STORE_NAMES } from "../utils/db";
import { AppError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";
import { ANSWER_RECORD_LOG_TEMPLATES } from "../constants/logTemplates";
import { logger } from "../utils/logger";
import type { AnswerRecord } from "../types/AnswerRecord";

export async function listAnswerRecord(): Promise<AnswerRecord[]> {
  try {
    return await idb.list<AnswerRecord>(STORE_NAMES.records);
  } catch (error) {
    throw new AppError(ERROR_CODES.STORE_UNAVAILABLE, "api", "读取答题记录失败", error);
  }
}

export async function listAnswerRecordBySession(sessionId: number): Promise<AnswerRecord[]> {
  const rows = await listAnswerRecord();
  return rows.filter((record) => record.session_id === sessionId);
}

export async function saveAnswerRecord(payload: AnswerRecord): Promise<AnswerRecord> {
  await idb.put(STORE_NAMES.records, payload);
  logger.info("api.AnswerRecord", ANSWER_RECORD_LOG_TEMPLATES.update({ id: payload.id, field: "correct", next: payload.correct }));
  return payload;
}
