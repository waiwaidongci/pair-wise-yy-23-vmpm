import type { PracticeMode } from "./PracticeMode";

/** 整组完成后的结算结果（同时持久化在 IDB meta 区，切回 /practice 仍可见）。 */
export interface PracticeResult {
  session_id: number;
  lesson_id: number | null;
  mode: PracticeMode;
  title: string;
  source: "LESSON" | "RETRY";
  score: number;
  total_count: number;
  correct_count: number;
  mistake_count: number;
  started_at: string;
  finished_at: string;
  symbol_ids: number[];
}
