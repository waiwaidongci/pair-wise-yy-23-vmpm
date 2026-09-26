interface LessonProgressProps {
  answered: number;
  total: number;
  currentIndex?: number;
  label?: string;
}

// 本组答题进度（草稿期也展示，但不计入学习进度统计）。
export function LessonProgress({ answered, total, currentIndex, label }: LessonProgressProps) {
  const percent = total ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="lesson-progress">
      <div className="lesson-progress-head">
        <strong>{label ?? "本组进度"}</strong>
        <span>
          {answered}/{total} 题 · {percent}%{typeof currentIndex === "number" ? ` · 第 ${currentIndex + 1} 题` : ""}
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
