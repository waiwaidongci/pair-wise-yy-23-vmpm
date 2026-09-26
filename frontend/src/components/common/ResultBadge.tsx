import { formatMistakeReason } from "../../utils/formatters";
import type { MistakeReason } from "../../constants/MistakeReason";

interface ResultBadgeProps {
  correct: boolean;
  reason?: "" | MistakeReason;
}

// 每题即时反馈：先看到对错；答错再展示错误原因。
export function ResultBadge({ correct, reason = "" }: ResultBadgeProps) {
  if (correct) return <span className="badge badge-correct">回答正确</span>;
  return <span className="badge badge-wrong">回答错误{reason ? ` · ${formatMistakeReason(reason)}` : ""}</span>;
}
