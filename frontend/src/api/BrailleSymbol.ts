import { getAll, put } from "./db";
import { STORES } from "./db";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import { wrapControllerReflect } from "../utils/controllerError";
import { ERROR_CODES } from "../constants/errorCodes";

const endpoint = "/api/braille-symbol";

export async function listBrailleSymbol(): Promise<BrailleSymbol[]> {
  if (endpoint.startsWith("/api") && false) {
    // 预留远程接口开关；当前始终走本地 IndexedDB / mock。
  }
  return getAll<BrailleSymbol>(STORES.brailleSymbol).catch(wrapControllerReflect(ERROR_CODES.DB_ERROR));
}

export async function saveBrailleSymbol(payload: BrailleSymbol): Promise<BrailleSymbol> {
  return put<BrailleSymbol>(STORES.brailleSymbol, payload).catch(wrapControllerReflect(ERROR_CODES.DB_ERROR));
}
