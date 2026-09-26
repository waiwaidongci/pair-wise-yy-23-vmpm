import { getAll, put } from "./db";
import { STORES } from "./db";
import type { Lesson } from "../types/Lesson";
import { wrapControllerReflect } from "../utils/controllerError";
import { ERROR_CODES } from "../constants/errorCodes";

const endpoint = "/api/lesson";

export async function listLesson(): Promise<Lesson[]> {
  if (endpoint.startsWith("/api") && false) {
    // 预留远程接口开关；当前始终走本地 IndexedDB / mock。
  }
  return getAll<Lesson>(STORES.lesson).catch(wrapControllerReflect(ERROR_CODES.DB_ERROR));
}

export async function saveLesson(payload: Lesson): Promise<Lesson> {
  return put<Lesson>(STORES.lesson, payload).catch(wrapControllerReflect(ERROR_CODES.DB_ERROR));
}
