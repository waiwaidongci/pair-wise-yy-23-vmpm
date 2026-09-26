import { idb, STORE_NAMES, transactional } from "../utils/db";
import { SEED_VERSION, seedSymbols, seedLessons, seedSessions, seedAnswerRecords } from "../mocks/seedData";
import { getSeedVersion, saveSeedVersion, saveManualMastered } from "./Meta";
import { BRAILLE_SYMBOL_LOG_TEMPLATES } from "../constants/logTemplates";
import { logger } from "../utils/logger";

/**
 * 首次启动播种：仅当各 store 为空 / 种子版本落后时写入。
 * 四类实体在同一事务写入，避免半成品数据。
 */
export async function ensureSeedData(): Promise<void> {
  const version = await getSeedVersion();
  const existing = await idb.list(STORE_NAMES.symbols);
  if (version === SEED_VERSION && existing.length > 0) return;

  await transactional(
    [STORE_NAMES.symbols, STORE_NAMES.lessons, STORE_NAMES.sessions, STORE_NAMES.records, STORE_NAMES.meta],
    "readwrite",
    (stores) => {
      if (existing.length === 0) seedSymbols.forEach((row) => stores[STORE_NAMES.symbols].put(row));
      seedLessons.forEach((row) => stores[STORE_NAMES.lessons].put(row));
      seedSessions.forEach((row) => stores[STORE_NAMES.sessions].put(row));
      seedAnswerRecords.forEach((row) => stores[STORE_NAMES.records].put(row));
      stores[STORE_NAMES.meta].put({ key: "mistakes:manual-mastered", value: [] });
      stores[STORE_NAMES.meta].put({ key: "system:seed-version", value: SEED_VERSION });
    }
  );
  await saveSeedVersion(SEED_VERSION);
  await saveManualMastered([]);
  logger.info("api.seed", BRAILLE_SYMBOL_LOG_TEMPLATES.seed({ count: seedSymbols.length }));
}
