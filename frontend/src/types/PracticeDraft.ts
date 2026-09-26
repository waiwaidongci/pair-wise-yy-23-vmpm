import type { MistakeReason } from "../constants/MistakeReason";
import type { PracticeMode } from "../constants/PracticeMode";

// 草稿中的单题作答状态；未完成期间只存在草稿对象里，不产生 AnswerRecord。
export interface DraftAnswer {
  symbol_id: number;
  mode: PracticeMode;
  user_answer: string;
  correct: boolean;
  mistake_reason: "" | MistakeReason;
  latency_ms: number;
  shown_at: string; // 本题最近一次展示时间，用于计算 latency_ms
}

// 练习草稿：离开页面 / 刷新后从 IndexedDB 恢复，回来接着答。
export interface PracticeDraft {
  id: string; // `${lesson_id}:${mode}`
  lesson_id: number;
  mode: PracticeMode;
  started_at: string;
  current_index: number;
  answers: DraftAnswer[];
}
