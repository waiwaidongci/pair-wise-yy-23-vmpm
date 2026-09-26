import { getAll, put, remove } from "./db";
import { STORES } from "./db";
import type { PracticeDraft } from "../types/PracticeDraft";
import { wrapControllerReflect } from "../utils/controllerError";
import { ERROR_CODES } from "../constants/errorCodes";

// 草稿独立成表：未完成期间不计入错题本和学习进度。
export async function listPracticeDraft(): Promise<PracticeDraft[]> {
  return getAll<PracticeDraft>(STORES.practiceDraft).catch(wrapControllerReflect(ERROR_CODES.DB_ERROR));
}

export async function savePracticeDraft(payload: PracticeDraft): Promise<PracticeDraft> {
  return put<PracticeDraft>(STORES.practiceDraft, payload).catch(
    wrapControllerReflect(ERROR_CODES.DB_ERROR)
  );
}

export async function deletePracticeDraft(id: string): Promise<void> {
  return remove(STORES.practiceDraft, id).catch(wrapControllerReflect(ERROR_CODES.DB_ERROR));
}
