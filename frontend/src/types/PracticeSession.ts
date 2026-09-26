import type { PracticeMode } from "./PracticeMode";

/**
 * 练习会话：只有整组题目全部完成后才会由 controller 一次写入。
 * 未完成期间只保留 PracticeDraft，不生成会话，因此不进入错题本与学习进度。
 */
export interface PracticeSession {
  id: number;
  lesson_id: number | null;
  mode: PracticeMode;
  started_at: string;
  finished_at: string;
  /** 0-100 */
  score: number;
  mistake_count: number;
  /** 整组题目数量 */
  total_count: number;
  /** 课程练习 / 错题重练 */
  source: "LESSON" | "RETRY";
  title: string;
}
