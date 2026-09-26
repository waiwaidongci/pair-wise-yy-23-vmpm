import { idb, STORE_NAMES } from "../utils/db";
import { AppError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";
import { BRAILLE_SYMBOL_LOG_TEMPLATES } from "../constants/logTemplates";
import { logger } from "../utils/logger";
import type { BrailleSymbol } from "../types/BrailleSymbol";

const endpoint = "/braille-symbol";

/** api 层：只负责 IndexedDB 读写并包装 api 层异常，业务编排在 services/controllers。 */
export async function listBrailleSymbol(): Promise<BrailleSymbol[]> {
  try {
    return await idb.list<BrailleSymbol>(STORE_NAMES.symbols);
  } catch (error) {
    throw new AppError(ERROR_CODES.STORE_UNAVAILABLE, "api", `读取字符失败（${endpoint}）`, error);
  }
}

export async function getBrailleSymbol(id: number): Promise<BrailleSymbol | undefined> {
  return idb.get<BrailleSymbol>(STORE_NAMES.symbols, id);
}

export async function saveBrailleSymbol(payload: BrailleSymbol): Promise<BrailleSymbol> {
  await idb.put(STORE_NAMES.symbols, payload);
  logger.info("api.BrailleSymbol", BRAILLE_SYMBOL_LOG_TEMPLATES.update({ id: payload.id, field: "cell_pattern", next: payload.cell_pattern }));
  return payload;
}

export async function bulkPutBrailleSymbol(rows: BrailleSymbol[]): Promise<void> {
  await idb.putMany(STORE_NAMES.symbols, rows);
  logger.info("api.BrailleSymbol", BRAILLE_SYMBOL_LOG_TEMPLATES.import({ count: rows.length }));
}
