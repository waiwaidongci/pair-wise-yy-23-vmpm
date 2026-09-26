import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { Lesson } from "../types/Lesson";
import type { PracticeSession } from "../types/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";

// 标准六点制盲文：cell_pattern 下标 0..5 对应点位 1..6，1 为凸起。
// 数字与字母 a-j 同形（盲文靠数号上下文区分），此处用 category 区分。
const brailleSymbol: BrailleSymbol[] = [
  { id: 1, cell_pattern: "100000", letter: "a", pinyin: "ei", category: "LETTER", difficulty: 1, audio_hint_key: "a" },
  { id: 2, cell_pattern: "110000", letter: "b", pinyin: "bi", category: "LETTER", difficulty: 1, audio_hint_key: "b" },
  { id: 3, cell_pattern: "100100", letter: "c", pinyin: "xi", category: "LETTER", difficulty: 1, audio_hint_key: "c" },
  { id: 4, cell_pattern: "100110", letter: "d", pinyin: "di", category: "LETTER", difficulty: 1, audio_hint_key: "d" },
  { id: 5, cell_pattern: "100010", letter: "e", pinyin: "yi", category: "LETTER", difficulty: 1, audio_hint_key: "e" },
  { id: 6, cell_pattern: "110100", letter: "f", pinyin: "ef", category: "LETTER", difficulty: 2, audio_hint_key: "f" },
  { id: 7, cell_pattern: "110110", letter: "g", pinyin: "ji", category: "LETTER", difficulty: 2, audio_hint_key: "g" },
  { id: 8, cell_pattern: "110010", letter: "h", pinyin: "eich", category: "LETTER", difficulty: 2, audio_hint_key: "h" },
  { id: 9, cell_pattern: "010100", letter: "i", pinyin: "ai", category: "LETTER", difficulty: 2, audio_hint_key: "i" },
  { id: 10, cell_pattern: "010110", letter: "j", pinyin: "zhei", category: "LETTER", difficulty: 2, audio_hint_key: "j" },
  { id: 11, cell_pattern: "101000", letter: "k", pinyin: "kei", category: "LETTER", difficulty: 3, audio_hint_key: "k" },
  { id: 12, cell_pattern: "111000", letter: "l", pinyin: "el", category: "LETTER", difficulty: 3, audio_hint_key: "l" },
  { id: 13, cell_pattern: "100000", letter: "1", pinyin: "yi1", category: "NUMBER", difficulty: 1, audio_hint_key: "1" },
  { id: 14, cell_pattern: "110000", letter: "2", pinyin: "er4", category: "NUMBER", difficulty: 1, audio_hint_key: "2" },
  { id: 15, cell_pattern: "100100", letter: "3", pinyin: "san1", category: "NUMBER", difficulty: 2, audio_hint_key: "3" },
  { id: 16, cell_pattern: "010010", letter: ",", pinyin: "dou4hao4", category: "PUNCTUATION", difficulty: 2, audio_hint_key: "逗号" },
  { id: 17, cell_pattern: "010011", letter: ".", pinyin: "ju4hao4", category: "PUNCTUATION", difficulty: 3, audio_hint_key: "句号" },
  { id: 18, cell_pattern: "011011", letter: "?", pinyin: "wen4hao4", category: "PUNCTUATION", difficulty: 3, audio_hint_key: "问号" },
  { id: 19, cell_pattern: "001101", letter: "ing", pinyin: "hou4zhui4", category: "CONTRACTION", difficulty: 3, audio_hint_key: "ing 后缀" }
];

const lesson: Lesson[] = [
  { id: 1, title: "盲文基础点位（a-e）", symbol_ids: [1, 2, 3, 4, 5], stage: "入门", estimated_minutes: 10, unlock_rule: "开放注册即可学习" },
  { id: 2, title: "进阶字母（f-j）", symbol_ids: [6, 7, 8, 9, 10], stage: "基础", estimated_minutes: 12, unlock_rule: "完成《盲文基础点位（a-e）》" },
  { id: 3, title: "数字与标点", symbol_ids: [13, 14, 15, 16, 17], stage: "进阶", estimated_minutes: 15, unlock_rule: "完成《进阶字母（f-j）》" },
  { id: 4, title: "高阶字母与缩略符", symbol_ids: [11, 12, 18, 19], stage: "高阶", estimated_minutes: 12, unlock_rule: "完成《数字与标点》" }
];

// 已完成的示例会话（错题本与进度统计只消费 finished_at 非空的会话）。
const practiceSession: PracticeSession[] = [
  {
    id: 901,
    lesson_id: 1,
    mode: "CELL_TO_TEXT",
    started_at: "2026-09-20T01:30:00.000Z",
    finished_at: "2026-09-20T01:42:00.000Z",
    score: 80,
    mistake_count: 1
  },
  {
    id: 902,
    lesson_id: 2,
    mode: "CELL_TO_TEXT",
    started_at: "2026-09-22T02:10:00.000Z",
    finished_at: "2026-09-22T02:21:00.000Z",
    score: 100,
    mistake_count: 0
  },
  {
    id: 903,
    lesson_id: 3,
    mode: "TEXT_TO_CELL",
    started_at: "2026-09-24T03:00:00.000Z",
    finished_at: "2026-09-24T03:14:00.000Z",
    score: 60,
    mistake_count: 2
  },
  {
    // 错题重练：单题会话（仅符号 17），仍答错 → 错题本保留历史并更新最近原因
    id: 904,
    lesson_id: 3,
    mode: "TEXT_TO_CELL",
    started_at: "2026-09-25T01:00:00.000Z",
    finished_at: "2026-09-25T01:03:00.000Z",
    score: 0,
    mistake_count: 1
  },
  {
    // 错题重练：单题会话（仅符号 3），答对 → 标记已掌握，历史记录保留
    id: 905,
    lesson_id: 1,
    mode: "CELL_TO_TEXT",
    started_at: "2026-09-23T01:00:00.000Z",
    finished_at: "2026-09-23T01:02:00.000Z",
    score: 100,
    mistake_count: 0
  }
];

const answerRecord: AnswerRecord[] = [
  { id: 9001, session_id: 901, symbol_id: 1, user_answer: "a", correct: true, latency_ms: 4200, mistake_reason: "" },
  { id: 9002, session_id: 901, symbol_id: 2, user_answer: "b", correct: true, latency_ms: 5100, mistake_reason: "" },
  { id: 9003, session_id: 901, symbol_id: 3, user_answer: "e", correct: false, latency_ms: 7300, mistake_reason: "WRONG_CHARACTER" },
  { id: 9004, session_id: 901, symbol_id: 4, user_answer: "d", correct: true, latency_ms: 4800, mistake_reason: "" },
  { id: 9005, session_id: 901, symbol_id: 5, user_answer: "e", correct: true, latency_ms: 3900, mistake_reason: "" },
  { id: 9006, session_id: 902, symbol_id: 6, user_answer: "f", correct: true, latency_ms: 4300, mistake_reason: "" },
  { id: 9007, session_id: 902, symbol_id: 7, user_answer: "g", correct: true, latency_ms: 4600, mistake_reason: "" },
  { id: 9008, session_id: 902, symbol_id: 8, user_answer: "h", correct: true, latency_ms: 5200, mistake_reason: "" },
  { id: 9009, session_id: 902, symbol_id: 9, user_answer: "i", correct: true, latency_ms: 3700, mistake_reason: "" },
  { id: 9010, session_id: 902, symbol_id: 10, user_answer: "j", correct: true, latency_ms: 4100, mistake_reason: "" },
  { id: 9011, session_id: 903, symbol_id: 13, user_answer: "1", correct: true, latency_ms: 5500, mistake_reason: "" },
  { id: 9012, session_id: 903, symbol_id: 14, user_answer: "1,2", correct: false, latency_ms: 9800, mistake_reason: "MISSING_DOT" },
  { id: 9013, session_id: 903, symbol_id: 15, user_answer: "1,4,5", correct: true, latency_ms: 6100, mistake_reason: "" },
  { id: 9014, session_id: 903, symbol_id: 16, user_answer: "2,6", correct: true, latency_ms: 6600, mistake_reason: "" },
  // 同一符号（句号 17）跨会话保留两次答错历史，错题本展示最近一次原因
  { id: 9015, session_id: 903, symbol_id: 17, user_answer: "2,3", correct: false, latency_ms: 8200, mistake_reason: "MISSING_DOT" },
  { id: 9016, session_id: 904, symbol_id: 17, user_answer: "2,3,5", correct: false, latency_ms: 7900, mistake_reason: "EXTRA_DOT" },
  // 符号 3（c）：先在 901 答错，重练会话 905 中答对，错题本不再列出但历史保留
  { id: 9017, session_id: 905, symbol_id: 3, user_answer: "c", correct: true, latency_ms: 3200, mistake_reason: "" }
];

export const mockData = {
  brailleSymbol,
  lesson,
  practiceSession,
  answerRecord
};
