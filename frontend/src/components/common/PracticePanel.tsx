import type { ReactNode } from "react";
import { StatusBadge } from "./StatusBadge";

interface PracticePanelProps {
  title: string;
  badge?: string;
  children: ReactNode;
  footer?: ReactNode;
}

// 练习模式统一面板外壳：题目区 / 反馈区 / 操作区。
export function PracticePanel({ title, badge, children, footer }: PracticePanelProps) {
  return (
    <section className="panel practice-panel">
      <div className="practice-panel-head">
        <h2>{title}</h2>
        {badge ? <StatusBadge value={badge} /> : null}
      </div>
      <div className="practice-panel-body">{children}</div>
      {footer ? <div className="practice-panel-foot">{footer}</div> : null}
    </section>
  );
}
