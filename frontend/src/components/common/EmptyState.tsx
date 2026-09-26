import type { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  hint?: string;
  children?: ReactNode;
}

export function EmptyState({ title = "暂无数据", hint, children }: EmptyStateProps) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {hint ? <p>{hint}</p> : null}
      {children}
    </div>
  );
}
