interface EmptyStateProps {
  title?: string;
  hint?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title = "暂无数据", hint, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden>·</div>
      <strong>{title}</strong>
      {hint ? <p>{hint}</p> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
