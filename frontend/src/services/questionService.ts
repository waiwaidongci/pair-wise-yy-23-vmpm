import { PracticeMode } from "../constants/PracticeMode";
import { PracticeModeMistakeReason } from "../constants/PracticeMode";
import { MistakeReason } from "../constants/MistakeReason";
import { toggleDot } from "../utils/braille";
import { seededRandom, hashString } from "../utils/id";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { PracticeMode as PracticeModeType } from "../types/PracticeMode";
import type { MistakeReason as MistakeReasonType } from "../types/MistakeReason";

export type QuestionVariant = "CELL_TO_TEXT" | "TEXT_TO_CELL" | "LISTENING";

export interface PracticeQuestion {
  symbol: BrailleSymbol;
  variant: QuestionVariant;
  /** 选项：CELL_TO_TEXT/LISTENING 为明文字符；TEXT_TO_CELL 为图案串 */
  options: string[];
  answer: string;
}

/** MIXED 模式下逐题决定题型（写入草稿 variants，续答保持一致）。 */
export function resolveVariant(mode: PracticeModeType, index: number, sessionKey: string): QuestionVariant {
  if (mode === PracticeMode.CELL_TO_TEXT) return "CELL_TO_TEXT";
  if (mode === PracticeMode.TEXT_TO_CELL) return "TEXT_TO_CELL";
  if (mode === PracticeMode.LISTENING) return "LISTENING";
  const rand = seededRandom(hashString(sessionKey) + index * 31);
  const roll = rand();
  if (roll < 0.4) return "CELL_TO_TEXT";
  if (roll < 0.75) return "TEXT_TO_CELL";
  return "LISTENING";
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistractors(pool: BrailleSymbol[], correct: BrailleSymbol, rand: () => number, count: number): BrailleSymbol[] {
  const others = shuffle(
    pool.filter((item) => item.id !== correct.id),
    rand
  );
  return others.slice(0, count);
}

/** 构造一道题：4 个选项，干扰项优先同分类。 */
export function buildQuestion(
  symbol: BrailleSymbol,
  variant: QuestionVariant,
  pool: BrailleSymbol[],
  index: number,
  sessionKey: string
): PracticeQuestion {
  const rand = seededRandom(hashString(sessionKey) + symbol.id * 7 + index * 101);
  if (variant === "TEXT_TO_CELL") {
    const candidates = new Set<string>();
    candidates.add(symbol.cell_pattern);
    // 翻转点位生成两个近似干扰图案
    for (let dot = 1; dot <= 6 && candidates.size < 3; dot += 1) {
      const variantPattern = toggleDot(symbol.cell_pattern, dot);
      if (variantPattern !== symbol.cell_pattern) candidates.add(variantPattern);
    }
    pickDistractors(pool, symbol, rand, 4).forEach((item) => candidates.add(item.cell_pattern));
    const options = shuffle([...candidates].slice(0, 4), rand);
    if (!options.includes(symbol.cell_pattern)) options[0] = symbol.cell_pattern;
    return { symbol, variant, options: shuffle(options, rand), answer: symbol.cell_pattern };
  }

  const sameCategory = pool.filter((item) => item.category === symbol.category && item.id !== symbol.id);
  const distractors = pickDistractors(sameCategory.length >= 3 ? sameCategory : pool, symbol, rand, 3);
  const options = shuffle([symbol, ...distractors], rand).map((item) => item.letter);
  return { symbol, variant, options, answer: symbol.letter };
}

/** 判定作答并给出错题原因（即时反馈 + 写入草稿/记录）。 */
export function gradeAnswer(question: PracticeQuestion, userAnswer: string, mode: PracticeModeType): {
  correct: boolean;
  mistakeReason: MistakeReasonType | "";
} {
  let correct: boolean;
  if (question.variant === "TEXT_TO_CELL") {
    const normalize = (value: string) =>
      value
        .split("-")
        .map((part) => Number(part.trim()))
        .filter((dot) => dot >= 1 && dot <= 6)
        .sort((a, b) => a - b)
        .join("-");
    correct = normalize(userAnswer) === normalize(question.answer);
  } else {
    correct = userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();
  }
  if (correct) return { correct: true, mistakeReason: "" };
  // 题型优先决定原因；MIXED 时模式兜底映射
  const byVariant: Record<QuestionVariant, MistakeReasonType> = {
    CELL_TO_TEXT: MistakeReason.PATTERN_MISREAD,
    TEXT_TO_CELL: MistakeReason.DOT_MISPLACED,
    LISTENING: MistakeReason.LISTENING_MISHEARD
  };
  return { correct: false, mistakeReason: byVariant[question.variant] ?? (PracticeModeMistakeReason[mode] as MistakeReasonType) };
}
