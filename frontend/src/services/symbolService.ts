import { listBrailleSymbol, saveBrailleSymbol, bulkPutBrailleSymbol } from "../api/BrailleSymbol";
import { wrapServiceError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";
import { BRAILLE_SYMBOL_LOG_TEMPLATES } from "../constants/logTemplates";
import { logger } from "../utils/logger";
import { createBrailleSymbolForm, createBrailleSymbolResponse } from "../constructors/BrailleSymbolConstructor";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { SymbolCategory } from "../types/SymbolCategory";
import type { Difficulty } from "../types/Difficulty";

export interface SymbolFilter {
  category?: SymbolCategory | "ALL";
  difficulty?: Difficulty | "ALL";
  keyword?: string;
}

export async function querySymbols(filter: SymbolFilter = {}): Promise<BrailleSymbol[]> {
  try {
    const rows = await listBrailleSymbol();
    return rows
      .filter((row) => (filter.category && filter.category !== "ALL" ? row.category === filter.category : true))
      .filter((row) => (filter.difficulty && filter.difficulty !== "ALL" ? row.difficulty === filter.difficulty : true))
      .filter((row) =>
        filter.keyword
          ? row.letter.includes(filter.keyword) ||
            row.pinyin.includes(filter.keyword) ||
            String(row.cell_pattern).includes(filter.keyword)
          : true
      )
      .sort((a, b) => a.id - b.id);
  } catch (error) {
    throw wrapServiceError("service.symbol", error);
  }
}

export async function createSymbol(input: Partial<BrailleSymbol>): Promise<BrailleSymbol> {
  try {
    const rows = await listBrailleSymbol();
    const id = rows.reduce((max, row) => Math.max(max, row.id), 999) + 1;
    const symbol = createBrailleSymbolForm({ ...input, id });
    await saveBrailleSymbol(symbol);
    logger.info("service.symbol", BRAILLE_SYMBOL_LOG_TEMPLATES.create({ id, field: symbol.category }));
    return symbol;
  } catch (error) {
    throw wrapServiceError("service.symbol", error);
  }
}

export async function updateSymbol(id: number, patch: Partial<BrailleSymbol>): Promise<BrailleSymbol> {
  try {
    const rows = await listBrailleSymbol();
    const current = rows.find((row) => row.id === id);
    if (!current) throw wrapServiceError("service.symbol", new Error("not found"), ERROR_CODES.NOT_FOUND);
    const merged = createBrailleSymbolResponse({ ...current, ...patch, id });
    await saveBrailleSymbol(merged);
    return merged;
  } catch (error) {
    throw wrapServiceError("service.symbol", error);
  }
}

export async function importSymbols(rows: Array<Partial<BrailleSymbol>>): Promise<number> {
  try {
    const normalized = rows
      .filter((row) => row && row.id != null && row.letter)
      .map((row) => createBrailleSymbolResponse(row as Partial<BrailleSymbol> & { id: number }));
    await bulkPutBrailleSymbol(normalized);
    return normalized.length;
  } catch (error) {
    throw wrapServiceError("service.symbol", error, ERROR_CODES.IMPORT_FAILED);
  }
}

export async function exportSymbols(): Promise<BrailleSymbol[]> {
  const rows = await querySymbols();
  logger.info("service.symbol", BRAILLE_SYMBOL_LOG_TEMPLATES.export());
  return rows;
}
