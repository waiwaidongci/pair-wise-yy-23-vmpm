import type { MistakeReason } from "./MistakeReason";

/**
 * 答题记录：随会话整组完成一次性写入，驱动错题本与进度统计。
 * 历史记录全部保留（错题本“保留历史”），掌握程度由服务层按时间序推导。
 */
export interface AnswerRecord {
  id: number;
  session_id: number;
  symbol_id: number;
  /** 用户选项对应的明文字符或图案串 */
  user_answer: string;
  correct: boolean;
  latency_ms: number;
  mistake_reason: MistakeReason | "";
  answered_at: string;
  /** 记录答题时的题型，便于历史回溯 */
  variant: "CELL_TO_TEXT" | "TEXT_TO_CELL" | "LISTENING";
}
