interface ResultBadgeProps {
  correct: boolean;
  /** 已作答但允许回看时展示静态结果 */
  neutral?: boolean;
  text?: string;
}

/** 即时反馈徽章：每答一题先看到对错。 */
export function ResultBadge({ correct, neutral = false, text }: ResultBadgeProps) {
  if (neutral) return <span className="result-badge result-badge--neutral">{text ?? "已作答"}</span>;
  return (
    <span className={`result-badge ${correct ? "result-badge--correct" : "result-badge--wrong"}`}>
      {text ?? (correct ? "✓ 回答正确" : "✗ 回答错误")}
    </span>
  );
}
