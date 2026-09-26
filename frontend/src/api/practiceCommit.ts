import { nextId } from "./db";
import { STORES } from "./db";

// 独立的 id 生成入口，供 service 层调用（api/controller 层不放业务规则）。
export async function nextSessionId(): Promise<number> {
  return nextId(STORES.practiceSession);
}

export async function nextRecordId(): Promise<number> {
  return nextId(STORES.answerRecord);
}
