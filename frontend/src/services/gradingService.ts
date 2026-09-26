import type { PracticeMode } from "../constants/PracticeMode";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { MistakeReason } from "../constants/MistakeReason";
import { ERROR_CODES } from "../constants/errorCodes";
import { ServiceError } from "../utils/errors";
import { dotsToPattern, parseDotsInput, patternToDots } from "../utils/brailleDots";

export interface GradeResult {
  correct: boolean;
  normalized: string;
  mistake_reason: "" | MistakeReason;
}

// 听音辨字允许英文字母或汉语拼音两种答案；标点允许拼音输入（如“ju4hao4”）。
function acceptedTextAnswers(symbol: BrailleSymbol): string[] {
  const base = [symbol.letter, symbol.pinyin];
  if (symbol.category === "PUNCTUATION") {
    const spoken: Record<string, string[]> = {
      ",": ["逗号", "，"],
      ".": ["句号", "。"],
      "?": ["问号", "？"]
    };
    base.push(...(spoken[symbol.letter] ?? []));
  }
  return base.map((value) => value.trim().toLowerCase());
}

function gradeText(symbol: BrailleSymbol, raw: string): GradeResult {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return { correct: false, normalized, mistake_reason: "NOT_ANSWERED" };
  const correct = acceptedTextAnswers(symbol).includes(normalized);
  return {
    correct,
    normalized,
    mistake_reason: correct ? "" : "WRONG_CHARACTER"
  };
}

function gradeDots(symbol: BrailleSymbol, raw: string): GradeResult {
  const normalized = raw.trim();
  if (!normalized) return { correct: false, normalized, mistake_reason: "NOT_ANSWERED" };
  const inputDots = parseDotsInput(normalized);
  const answerDots = patternToDots(symbol.cell_pattern);
  const inputSet = new Set(inputDots);
  const answerSet = new Set(answerDots);
  const normalizedPattern = dotsToPattern(inputDots);
  if (normalizedPattern === symbol.cell_pattern) {
    return { correct: true, normalized: inputDots.join(","), mistake_reason: "" };
  }
  let reason: MistakeReason;
  const missing = [...answerSet].some((dot) => !inputSet.has(dot));
  const extra = [...inputSet].some((dot) => !answerSet.has(dot));
  if (missing && extra) reason = "DOT_MISMATCH";
  else if (missing) reason = "MISSING_DOT";
  else reason = "EXTRA_DOT";
  return { correct: false, normalized: inputDots.join(","), mistake_reason: reason };
}

// MIXED：题目模式在 draft 构造时已逐题固化到 DraftAnswer.mode，判定以题目实际模式为准。
export function gradeAnswer(symbol: BrailleSymbol, mode: PracticeMode, raw: string): GradeResult {
  try {
    if (mode === "TEXT_TO_CELL") return gradeDots(symbol, raw);
    if (mode === "CELL_TO_TEXT" || mode === "LISTENING") return gradeText(symbol, raw);
    if (mode === "MIXED") {
      // 兜底：MIXED 的题型若未固化，按 CELL_TO_TEXT 处理。
      return gradeText(symbol, raw);
    }
    throw new ServiceError(ERROR_CODES.UNSUPPORTED_PRACTICE_MODE);
  } catch (cause) {
    if (cause instanceof ServiceError) throw cause;
    throw new ServiceError(ERROR_CODES.GRADE_FAILED);
  }
}
