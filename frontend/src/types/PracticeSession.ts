import type { PracticeMode } from "../constants/PracticeMode";

// 整组题目全部答完后才会一次性生成会话；finished_at 非空表示已完成会话。
// 错题本与学习进度只允许消费已完成会话，草稿不会写入本表。
export interface PracticeSession {
  id: number;
  lesson_id: number;
  mode: PracticeMode;
  started_at: string;
  finished_at: string;
  score: number;
  mistake_count: number;
}
