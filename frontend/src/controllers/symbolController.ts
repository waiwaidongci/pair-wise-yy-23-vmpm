import { createSymbol, updateSymbol } from "../services/symbolService";
import { listBrailleSymbol } from "../api/BrailleSymbol";
import { wrapControllerError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";
import { AppError } from "../utils/errors";
import { parsePattern } from "../utils/braille";
import { SymbolCategoryList } from "../constants/SymbolCategory";
import { DifficultyList } from "../constants/Difficulty";
import type { BrailleSymbol } from "../types/BrailleSymbol";

function validateSymbol(input: Partial<BrailleSymbol>): void {
  if (!input.letter || !input.letter.trim()) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, "controller", "字符内容不能为空");
  }
  if (input.cell_pattern != null && input.cell_pattern !== "" && parsePattern(input.cell_pattern).length === 0) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, "controller", "点位只能使用 1-6 的点号，多个点用 - 连接");
  }
  if (input.category && !SymbolCategoryList.includes(input.category)) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, "controller", "字符分类不合法");
  }
  if (input.difficulty && !DifficultyList.includes(input.difficulty)) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, "controller", "难度不合法");
  }
}

export async function createSymbolEntry(input: Partial<BrailleSymbol>): Promise<BrailleSymbol> {
  try {
    validateSymbol(input);
    return await createSymbol(input);
  } catch (error) {
    throw wrapControllerError("controller.symbol", error);
  }
}

export async function updateSymbolEntry(id: number, patch: Partial<BrailleSymbol>): Promise<BrailleSymbol> {
  try {
    validateSymbol(patch);
    return await updateSymbol(id, patch);
  } catch (error) {
    throw wrapControllerError("controller.symbol", error);
  }
}

export async function symbolStats(): Promise<{ total: number; byCategory: Record<string, number> }> {
  const rows = await listBrailleSymbol();
  const byCategory: Record<string, number> = {};
  rows.forEach((row) => {
    byCategory[row.category] = (byCategory[row.category] ?? 0) + 1;
  });
  return { total: rows.length, byCategory };
}
