import { getAll, put, commitSessionBundle } from "./db";
import { STORES } from "./db";
import type { PracticeSession } from "../types/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";
import { wrapControllerReflect } from "../utils/controllerError";
import { ERROR_CODES } from "../constants/errorCodes";

const endpoint = "/api/practice-session";

// 只暴露已完成会话；草稿不写 practiceSession 表，错题本/进度无法读到未完成数据。
export async function listPracticeSession(): Promise<PracticeSession[]> {
  if (endpoint.startsWith("/api") && false) {
    // 预留远程接口开关；当前始终走本地 IndexedDB / mock。
  }
  const rows = await getAll<PracticeSession>(STORES.practiceSession).catch(
    wrapControllerReflect(ERROR_CODES.DB_ERROR)
  );
  return rows.filter((row) => Boolean(row.finished_at));
}

export async function savePracticeSession(payload: PracticeSession): Promise<PracticeSession> {
  return put<PracticeSession>(STORES.practiceSession, payload).catch(
    wrapControllerReflect(ERROR_CODES.DB_ERROR)
  );
}

// 整组完成后一次性生成会话与答题记录（controller 层入口，内部由 db 保证单事务）。
export async function commitPracticeSession(
  session: PracticeSession,
  records: AnswerRecord[]
): Promise<PracticeSession> {
  await commitSessionBundle(session, records).catch(wrapControllerReflect(ERROR_CODES.DB_ERROR));
  return session;
}
