import { idb, STORE_NAMES } from "../utils/db";
import { AppError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";
import { LESSON_LOG_TEMPLATES } from "../constants/logTemplates";
import { logger } from "../utils/logger";
import type { Lesson } from "../types/Lesson";

export async function listLesson(): Promise<Lesson[]> {
  try {
    return await idb.list<Lesson>(STORE_NAMES.lessons);
  } catch (error) {
    throw new AppError(ERROR_CODES.STORE_UNAVAILABLE, "api", "读取课程失败", error);
  }
}

export async function saveLesson(payload: Lesson): Promise<Lesson> {
  await idb.put(STORE_NAMES.lessons, payload);
  logger.info("api.Lesson", LESSON_LOG_TEMPLATES.update({ id: payload.id, field: "symbol_ids", next: payload.symbol_ids.length }));
  return payload;
}

export async function bulkPutLesson(rows: Lesson[]): Promise<void> {
  await idb.putMany(STORE_NAMES.lessons, rows);
  logger.info("api.Lesson", LESSON_LOG_TEMPLATES.import({ count: rows.length }));
}
