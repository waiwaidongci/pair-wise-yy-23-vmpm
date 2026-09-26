import { idb, STORE_NAMES } from "../utils/db";
import { AppError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";
import type { PracticeDraft } from "../types/PracticeDraft";
import type { PracticeResult } from "../types/PracticeResult";

/** meta 区的键集中管理：草稿 / 最近结果 / 手动掌握标记 / 种子版本。 */
export const META_KEYS = {
  draft: "practice:draft",
  lastResult: "practice:last-result",
  manualMastered: "mistakes:manual-mastered",
  seedVersion: "system:seed-version"
} as const;

interface MetaRow<T> {
  key: string;
  value: T;
}

async function readMeta<T>(key: string): Promise<T | undefined> {
  try {
    const row = await idb.get<MetaRow<T>>(STORE_NAMES.meta, key);
    return row?.value;
  } catch (error) {
    throw new AppError(ERROR_CODES.STORE_UNAVAILABLE, "api", `读取元数据 ${key} 失败`, error);
  }
}

async function writeMeta<T>(key: string, value: T): Promise<void> {
  await idb.put(STORE_NAMES.meta, { key, value } satisfies MetaRow<T>);
}

export const getDraft = () => readMeta<PracticeDraft>(META_KEYS.draft);
export const saveDraft = (draft: PracticeDraft) => writeMeta(META_KEYS.draft, draft);
export const clearDraft = () => idb.remove(STORE_NAMES.meta, META_KEYS.draft);

export const getLastResult = () => readMeta<PracticeResult>(META_KEYS.lastResult);
export const saveLastResult = (result: PracticeResult) => writeMeta(META_KEYS.lastResult, result);

export const getManualMastered = async (): Promise<number[]> => (await readMeta<number[]>(META_KEYS.manualMastered)) ?? [];
export const saveManualMastered = (ids: number[]) => writeMeta(META_KEYS.manualMastered, ids);

export const getSeedVersion = () => readMeta<number>(META_KEYS.seedVersion);
export const saveSeedVersion = (version: number) => writeMeta(META_KEYS.seedVersion, version);
