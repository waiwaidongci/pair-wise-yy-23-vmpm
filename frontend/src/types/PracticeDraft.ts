import type { PracticeMode } from "./PracticeMode";
import type { MistakeReason } from "./MistakeReason";

/** 会话草稿中的单题作答（即时反馈后写入草稿，题目留在当前会话）。 */
export interface DraftAnswer {
  symbol_id: number;
  variant: "CELL_TO_TEXT" | "TEXT_TO_CELL" | "LISTENING";
  user_answer: string;
  correct: boolean;
  latency_ms: number;
  mistake_reason: MistakeReason | "";
  answered_at: string;
}

/**
 * 练习会话草稿：未完成期间仅存 IndexedDB meta 区，
 * 不生成 PracticeSession / AnswerRecord，故不计入错题本和学习进度。
 */
export interface PracticeDraft {
  session_key: string;
  lesson_id: number | null;
  mode: PracticeMode;
  source: "LESSON" | "RETRY";
  title: string;
  symbol_ids: number[];
  /** 每题的题型（MIXED 下逐题确定，保证续答一致） */
  variants: Array<"CELL_TO_TEXT" | "TEXT_TO_CELL" | "LISTENING">;
  answers: DraftAnswer[];
  started_at: string;
  updated_at: string;
}
