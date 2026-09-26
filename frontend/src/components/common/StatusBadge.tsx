import { STATUS_TEXT } from "../../constants/statusText";
import type { MistakeReason } from "../../types/MistakeReason";

type BadgeKind = "practice-mode" | "symbol-category" | "mastery-level" | "difficulty" | "mistake-reason" | "plain";

interface StatusBadgeProps {
  value: string;
  kind?: BadgeKind;
  label?: string;
}

const TEXT_MAP: Record<Exclude<BadgeKind, "plain">, Record<string, string>> = {
  "practice-mode": STATUS_TEXT.PracticeMode,
  "symbol-category": STATUS_TEXT.SymbolCategory,
  "mastery-level": STATUS_TEXT.MasteryLevel,
  difficulty: STATUS_TEXT.Difficulty,
  "mistake-reason": STATUS_TEXT.MistakeReason
};

/** 枚举展示组件：新增枚举值时本组件与 statusText 都要同步。 */
export function StatusBadge({ value, kind = "plain", label }: StatusBadgeProps) {
  const text = label ?? (kind === "plain" ? value.replace(/_/g, " ") : TEXT_MAP[kind][value] ?? value);
  return (
    <span className={`badge badge--${kind} badge--${String(value).toLowerCase().replace(/_/g, "-")}`}>
      {text}
    </span>
  );
}

export function MistakeReasonBadge({ reason }: { reason: MistakeReason | "" }) {
  if (!reason) return <span className="badge badge--plain">—</span>;
  return <StatusBadge kind="mistake-reason" value={reason} label={STATUS_TEXT.MistakeReason[reason].split("：")[0]} />;
}
