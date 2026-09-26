interface LessonProgressProps {
  title: string;
  /** 当前进度分子/分母（会话内即“已答/总题数”，课程行即“已完成会话数/目标”） */
  done: number;
  total: number;
  status?: "idle" | "active" | "locked" | "completed";
  latestScore?: number | null;
  estimatedMinutes?: number;
  onStart?: () => void;
  startLabel?: string;
}

/** 课程/会话进度条共享组件：LearnPage 课程列表与 PracticePage 顶部共用。 */
export function LessonProgress({
  title,
  done,
  total,
  status = "idle",
  latestScore,
  estimatedMinutes,
  onStart,
  startLabel
}: LessonProgressProps) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className={`lesson-progress lesson-progress--${status}`}>
      <div className="lesson-progress__head">
        <strong>{title}</strong>
        <span className="lesson-progress__meta">
          {typeof estimatedMinutes === "number" ? `${estimatedMinutes} 分钟 · ` : ""}
          {done}/{total}
        </span>
      </div>
      <div className="lesson-progress__track">
        <div className="lesson-progress__bar" style={{ width: `${percent}%` }} />
      </div>
      <div className="lesson-progress__foot">
        <span className="lesson-progress__percent">{percent}%</span>
        {latestScore != null ? <span className="lesson-progress__score">最近 {Math.round(latestScore)} 分</span> : null}
        {onStart && status !== "locked" ? (
          <button type="button" className="btn btn--primary btn--sm" onClick={onStart}>
            {startLabel ?? "开始练习"}
          </button>
        ) : null}
        {status === "locked" ? <span className="lesson-progress__lock">🔒 完成前置课程解锁</span> : null}
      </div>
    </div>
  );
}
