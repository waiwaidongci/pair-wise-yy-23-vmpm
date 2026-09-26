import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { Lesson } from "../types/Lesson";
import type { PracticeSession } from "../types/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";
import { SymbolCategory } from "../constants/SymbolCategory";
import { Difficulty } from "../constants/Difficulty";
import { PracticeMode } from "../constants/PracticeMode";
import { MistakeReason } from "../constants/MistakeReason";

/**
 * 本地 mock 种子数据（禁止接入第三方 API）。
 * 盲文点位编号：1·4 / 2·5 / 3·6，采用六点盲文通用字母表。
 */

const LETTER_PATTERNS: Record<string, string> = {
  a: "1", b: "1-2", c: "1-4", d: "1-4-5", e: "1-5",
  f: "1-2-4", g: "1-2-4-5", h: "1-2-5", i: "2-4", j: "2-4-5",
  k: "1-3", l: "1-2-3", m: "1-3-4", n: "1-3-4-5", o: "1-3-5",
  p: "1-2-3-4", q: "1-2-3-4-5", r: "1-2-3-5", s: "2-3-4", t: "2-3-4-5",
  u: "1-3-6", v: "1-2-3-6", w: "2-4-5-6", x: "1-3-4-6", y: "1-3-4-5-6", z: "1-3-5-6"
};

const LETTER_PINYIN: Record<string, string> = {
  a: "诶", b: "必", c: "西", d: "第", e: "伊", f: "艾弗", g: "吉", h: "艾尺",
  i: "艾", j: "杰", k: "开", l: "艾勒", m: "艾姆", n: "恩", o: "哦", p: "屁",
  q: "吉吾", r: "啊尔", s: "艾斯", t: "替", u: "优", v: "维", w: "达不溜", x: "艾克斯", y: "歪", z: "贼"
};

function difficultyFor(letter: string): BrailleSymbol["difficulty"] {
  if ("abcdefghij".includes(letter)) return Difficulty.EASY;
  if ("klmnopqrst".includes(letter)) return Difficulty.MEDIUM;
  return Difficulty.HARD;
}

const letters: BrailleSymbol[] = "abcdefghijklmnopqrstuvwxyz".split("").map((letter, index) => ({
  id: index + 1,
  cell_pattern: LETTER_PATTERNS[letter],
  letter,
  pinyin: LETTER_PINYIN[letter],
  category: SymbolCategory.LETTER,
  difficulty: difficultyFor(letter),
  audio_hint_key: `letter:${letter}`
}));

const digitRows: Array<[string, string]> = [
  ["1", "1"], ["2", "1-2"], ["3", "1-4"], ["4", "1-4-5"], ["5", "1-5"],
  ["6", "1-2-4"], ["7", "1-2-4-5"], ["8", "1-2-5"], ["9", "2-4"], ["0", "2-4-5"]
];
const DIGIT_PINYIN: Record<string, string> = {
  "0": "零", "1": "一", "2": "二", "3": "三", "4": "四",
  "5": "五", "6": "六", "7": "七", "8": "八", "9": "九"
};
const numbers: BrailleSymbol[] = digitRows.map(([digit, pattern], index) => ({
  id: 27 + index,
  cell_pattern: pattern,
  letter: digit,
  pinyin: DIGIT_PINYIN[digit],
  category: SymbolCategory.NUMBER,
  difficulty: Difficulty.MEDIUM,
  audio_hint_key: `digit:${digit}`
}));

const punctuationRows: Array<[string, string, string, string]> = [
  [",", "2", "逗号", "punctuation:comma"],
  [";", "2-3", "分号", "punctuation:semicolon"],
  [":", "2-5", "冒号", "punctuation:colon"],
  [".", "2-5-6", "句号", "punctuation:period"],
  ["?", "2-3-6", "问号", "punctuation:question"],
  ["!", "2-3-5", "感叹号", "punctuation:exclamation"],
  ["、", "1-2-6", "顿号", "punctuation:encomma"],
  ["“", "2-3-5-6", "左引号", "punctuation:quote-open"]
];
const punctuation: BrailleSymbol[] = punctuationRows.map(([letter, pattern, pinyin, audio], index) => ({
  id: 37 + index,
  cell_pattern: pattern,
  letter,
  pinyin,
  category: SymbolCategory.PUNCTUATION,
  difficulty: Difficulty.HARD,
  audio_hint_key: audio
}));

/** 汉语盲文常用简码（示意点位，用于 CONTRACTION 分类教学）。 */
const contractionRows: Array<[string, string, string]> = [
  ["的", "1-4-5-6", "de"], ["是", "1-2-3-4-6", "shi"], ["不", "1-2-6", "bu"],
  ["我", "1-3-4-6", "wo"], ["人", "1-2-3-5-6", "ren"], ["们", "1-2-3-6", "men"]
];
const contractions: BrailleSymbol[] = contractionRows.map(([letter, pattern, pinyin], index) => ({
  id: 45 + index,
  cell_pattern: pattern,
  letter,
  pinyin,
  category: SymbolCategory.CONTRACTION,
  difficulty: Difficulty.HARD,
  audio_hint_key: `pinyin:${pinyin}`
}));

export const seedSymbols: BrailleSymbol[] = [...letters, ...numbers, ...punctuation, ...contractions];

const ids = {
  a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 10,
  k: 11, l: 12, m: 13, n: 14, o: 15, p: 16, q: 17, r: 18, s: 19, t: 20,
  u: 21, v: 22, w: 23, x: 24, y: 25, z: 26
};

export const seedLessons: Lesson[] = [
  { id: 1, title: "第一课：a–j 基础点位", symbol_ids: [ids.a, ids.b, ids.c, ids.d, ids.e, ids.f, ids.g, ids.h, ids.i, ids.j], stage: "STAGE_1", estimated_minutes: 10, unlock_rule: "free" },
  { id: 2, title: "第二课：k–t 左列加点", symbol_ids: [ids.k, ids.l, ids.m, ids.n, ids.o, ids.p, ids.q, ids.r, ids.s, ids.t], stage: "STAGE_2", estimated_minutes: 12, unlock_rule: "free" },
  { id: 3, title: "第三课：u–z 与 w 特殊形", symbol_ids: [ids.u, ids.v, ids.w, ids.x, ids.y, ids.z], stage: "STAGE_3", estimated_minutes: 10, unlock_rule: "lesson:2" },
  { id: 4, title: "第四课：数字 0–9", symbol_ids: [27, 28, 29, 30, 31, 32, 33, 34, 35, 36], stage: "STAGE_4", estimated_minutes: 10, unlock_rule: "lesson:1" },
  { id: 5, title: "第五课：常用标点", symbol_ids: [37, 38, 39, 40, 41, 42, 43, 44], stage: "STAGE_5", estimated_minutes: 8, unlock_rule: "lesson:3" },
  { id: 6, title: "第六课：汉语简码", symbol_ids: [45, 46, 47, 48, 49, 50], stage: "STAGE_6", estimated_minutes: 8, unlock_rule: "lesson:5" }
];

const day = (n: number, h: number, m: number) => `2026-09-${String(n).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`;

function buildRecords(sessionId: number, rows: Array<[number, boolean, number, MistakeReason | "", "CELL_TO_TEXT" | "TEXT_TO_CELL" | "LISTENING", string?]>, base: string): AnswerRecord[] {
  const baseTime = new Date(base).getTime();
  return rows.map(([symbolId, correct, latency, reason, variant, userAnswer], index) => {
    const symbol = seedSymbols.find((item) => item.id === symbolId);
    const rightAnswer = variant === "TEXT_TO_CELL" ? symbol?.cell_pattern ?? "" : symbol?.letter ?? "";
    return {
      id: sessionId * 100 + index + 1,
      session_id: sessionId,
      symbol_id: symbolId,
      user_answer: userAnswer ?? rightAnswer,
      correct,
      latency_ms: latency,
      mistake_reason: reason,
      variant,
      answered_at: new Date(baseTime + index * 45000).toISOString()
    };
  });
}

export const seedSessions: PracticeSession[] = [
  { id: 1, lesson_id: 1, mode: PracticeMode.CELL_TO_TEXT, started_at: day(8, 9, 0), finished_at: day(8, 9, 8), score: 100, mistake_count: 0, total_count: 10, source: "LESSON", title: "第一课：a–j 基础点位" },
  { id: 2, lesson_id: 1, mode: PracticeMode.LISTENING, started_at: day(10, 9, 0), finished_at: day(10, 9, 9), score: 80, mistake_count: 2, total_count: 10, source: "LESSON", title: "第一课：a–j 听写复习" },
  { id: 3, lesson_id: 2, mode: PracticeMode.TEXT_TO_CELL, started_at: day(15, 10, 0), finished_at: day(15, 10, 12), score: 100, mistake_count: 0, total_count: 10, source: "LESSON", title: "第二课：k–t 看字摆点" },
  { id: 4, lesson_id: 2, mode: PracticeMode.MIXED, started_at: day(18, 10, 0), finished_at: day(18, 10, 11), score: 80, mistake_count: 2, total_count: 10, source: "LESSON", title: "第二课：k–t 混合测验" },
  { id: 5, lesson_id: 4, mode: PracticeMode.CELL_TO_TEXT, started_at: day(21, 14, 0), finished_at: day(21, 14, 9), score: 80, mistake_count: 2, total_count: 10, source: "LESSON", title: "第四课：数字识读" },
  { id: 6, lesson_id: null, mode: PracticeMode.MIXED, started_at: day(22, 16, 0), finished_at: day(22, 16, 5), score: 100, mistake_count: 0, total_count: 3, source: "RETRY", title: "错题重练：d、f、l" }
];

export const seedAnswerRecords: AnswerRecord[] = [
  ...buildRecords(1, [
    [ids.a, true, 2200, "", "CELL_TO_TEXT"], [ids.b, true, 2600, "", "CELL_TO_TEXT"], [ids.c, true, 3100, "", "CELL_TO_TEXT"],
    [ids.d, true, 2400, "", "CELL_TO_TEXT"], [ids.e, true, 2000, "", "CELL_TO_TEXT"], [ids.f, true, 2900, "", "CELL_TO_TEXT"],
    [ids.g, true, 3400, "", "CELL_TO_TEXT"], [ids.h, true, 3000, "", "CELL_TO_TEXT"], [ids.i, true, 2300, "", "CELL_TO_TEXT"],
    [ids.j, true, 2700, "", "CELL_TO_TEXT"]
  ], seedSessions[0].started_at),
  ...buildRecords(2, [
    [ids.a, true, 2400, "", "LISTENING"], [ids.b, true, 2800, "", "LISTENING"], [ids.c, true, 3200, "", "LISTENING"],
    [ids.d, false, 4100, MistakeReason.LISTENING_MISHEARD, "LISTENING", "b"], [ids.e, true, 2600, "", "LISTENING"],
    [ids.f, false, 5200, MistakeReason.LISTENING_MISHEARD, "LISTENING", "h"], [ids.g, true, 3300, "", "LISTENING"],
    [ids.h, true, 3000, "", "LISTENING"], [ids.i, true, 2500, "", "LISTENING"], [ids.j, true, 2900, "", "LISTENING"]
  ], seedSessions[1].started_at),
  ...buildRecords(3, [
    [ids.k, true, 2600, "", "TEXT_TO_CELL"], [ids.l, true, 3000, "", "TEXT_TO_CELL"], [ids.m, true, 3500, "", "TEXT_TO_CELL"],
    [ids.n, true, 3200, "", "TEXT_TO_CELL"], [ids.o, true, 2800, "", "TEXT_TO_CELL"], [ids.p, true, 3700, "", "TEXT_TO_CELL"],
    [ids.q, true, 4200, "", "TEXT_TO_CELL"], [ids.r, true, 3100, "", "TEXT_TO_CELL"], [ids.s, true, 2900, "", "TEXT_TO_CELL"],
    [ids.t, true, 3300, "", "TEXT_TO_CELL"]
  ], seedSessions[2].started_at),
  ...buildRecords(4, [
    [ids.k, true, 2400, "", "CELL_TO_TEXT"], [ids.l, false, 3800, MistakeReason.DOT_MISPLACED, "TEXT_TO_CELL", "1-2"],
    [ids.m, true, 3300, "", "LISTENING"], [ids.n, true, 3100, "", "CELL_TO_TEXT"], [ids.o, true, 2700, "", "TEXT_TO_CELL"],
    [ids.p, true, 3600, "", "LISTENING"], [ids.q, false, 5600, MistakeReason.PATTERN_MISREAD, "CELL_TO_TEXT", "p"],
    [ids.r, true, 3000, "", "TEXT_TO_CELL"], [ids.s, true, 2800, "", "CELL_TO_TEXT"], [ids.t, true, 3400, "", "LISTENING"]
  ], seedSessions[3].started_at),
  ...buildRecords(5, [
    [27, true, 2400, "", "CELL_TO_TEXT"], [28, true, 2800, "", "CELL_TO_TEXT"], [29, true, 3300, "", "CELL_TO_TEXT"],
    [30, true, 3000, "", "CELL_TO_TEXT"], [31, true, 2600, "", "CELL_TO_TEXT"], [32, false, 4200, MistakeReason.PATTERN_MISREAD, "CELL_TO_TEXT", "8"],
    [33, true, 3700, "", "CELL_TO_TEXT"], [34, true, 3500, "", "CELL_TO_TEXT"], [35, true, 3000, "", "CELL_TO_TEXT"],
    [36, false, 5100, MistakeReason.DOT_MISPLACED, "TEXT_TO_CELL", "2-5"]
  ], seedSessions[4].started_at),
  ...buildRecords(6, [
    [ids.d, true, 2300, "", "CELL_TO_TEXT"], [ids.f, true, 2700, "", "LISTENING"], [ids.l, true, 2500, "", "TEXT_TO_CELL"]
  ], seedSessions[5].started_at)
];

/** 错题本手动“标记已掌握”的种子（不写答题记录，仅 meta）。 */
export const SEED_MANUAL_MASTERED: number[] = [];

export const SEED_VERSION = 1;

export const mockData = {
  brailleSymbol: seedSymbols,
  lesson: seedLessons,
  practiceSession: seedSessions,
  answerRecord: seedAnswerRecords
};
