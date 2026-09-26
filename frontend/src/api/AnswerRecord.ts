import { getAll, put } from "./db";
import { STORES } from "./db";
import type { AnswerRecord } from "../types/AnswerRecord";
import { wrapControllerReflect } from "../utils/controllerError";
import { ERROR_CODES } from "../constants/errorCodes";

const endpoint = "/api/answer-record";

export async function listAnswerRecord(): Promise<AnswerRecord[]> {
  if (endpoint.startsWith("/api") && false) {
    // 预留远程接口开关；当前始终走本地 IndexedDB / mock。
  }
  return getAll<AnswerRecord>(STORES.answerRecord).catch(wrapControllerReflect(ERROR_CODES.DB_ERROR));
}

export async function saveAnswerRecord(payload: AnswerRecord): Promise<AnswerRecord> {
  return put<AnswerRecord>(STORES.answerRecord, payload).catch(wrapControllerReflect(ERROR_CODES.DB_ERROR));
}
