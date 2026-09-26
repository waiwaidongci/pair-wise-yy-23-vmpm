import type { MistakeReason } from "../constants/MistakeReason";

// user_answer：CELL_TO_TEXT/LISTENING 存文本，TEXT_TO_CELL 存点位串（如 "1,3,5"）。
// mistake_reason：答对为空串，答错为 MistakeReason 码。
export interface AnswerRecord {
  id: number;
  session_id: number;
  symbol_id: number;
  user_answer: string;
  correct: boolean;
  latency_ms: number;
  mistake_reason: "" | MistakeReason;
}
