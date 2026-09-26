import { useEffect, useMemo } from "react";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";
import { useLessonStore } from "../stores/LessonStore";
import { buildProgressSummary } from "../services/progressService";
import { StatCard } from "../components/common/StatCard";
import { ChartPanel } from "../components/common/ChartPanel";
import { LessonProgress } from "../components/common/LessonProgress";
import { StatusBadge } from "../components/common/StatusBadge";
import { EmptyState } from "../components/common/EmptyState";
import { formatDate, formatPercent, formatPracticeMode, formatScore } from "../utils/formatters";

export function ProgressPage() {
  const recordStore = useAnswerRecordStore();
  const symbolStore = useBrailleSymbolStore();
  const sessionStore = usePracticeSessionStore();
  const lessonStore = useLessonStore();

  useEffect(() => {
    void Promise.all([
      recordStore.rows.length ? Promise.resolve() : recordStore.load(),
      symbolStore.rows.length ? Promise.resolve() : symbolStore.load(),
      sessionStore.rows.length ? Promise.resolve() : sessionStore.load(),
      lessonStore.rows.length ? Promise.resolve() : lessonStore.load()
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = useMemo(
    () => buildProgressSummary(lessonStore.rows, sessionStore.rows, recordStore.rows),
    [lessonStore.rows, sessionStore.rows, recordStore.rows]
  );

  const difficultyDistribution = useMemo(() => {
    const buckets = [
      { label: "1 星", value: 0, tone: "tone-low" },
      { label: "2 星", value: 0, tone: "tone-mid" },
      { label: "3 星", value: 0, tone: "tone-high" }
    ];
    for (const symbol of symbolStore.rows) buckets[Math.min(2, Math.max(0, symbol.difficulty - 1))].value += 1;
    return buckets;
  }, [symbolStore.rows]);

  return (
    <section className="page-stack">
      <header className="page-head inner">
        <div>
          <p className="eyebrow">LEARNING PROGRESS</p>
          <h1>学习进度</h1>
          <p className="subtitle">只统计已完成的练习会话；未提交的草稿不参与课程完成率、最近得分与正确率。</p>
        </div>
      </header>

      <section className="metrics">
        <StatCard label="课程完成率" value={formatPercent(summary.completionRate)} />
        <StatCard label="已完成课程" value={`${summary.completedLessonCount} / ${summary.lessonCount}`} />
        <StatCard label="最近一次得分" value={formatScore(summary.overallLastScore)} />
        <StatCard label="累计完成会话" value={summary.totalSessions} />
        <StatCard label="累计答题正确率" value={formatPercent(summary.overallAccuracy)} />
      </section>

      <section className="workbench panels">
        <div className="panel">
          <h2>课程完成情况</h2>
          {!summary.lessonStats.length && <EmptyState title="还没有课程数据" />}
          <div className="lesson-list">
            {summary.lessonStats.map((stat, index) => (
              <article className="lesson-row" key={stat.lesson_id}>
                <LessonProgress
                  answered={stat.completed ? 1 : 0}
                  total={1}
                  label={stat.title}
                />
                <div className="lesson-row-meta">
                  <StatusBadge value={stat.completed ? "COMPLETED" : "NOT_STARTED"} />
                  <span>最近得分：{formatScore(stat.lastScore)}</span>
                  <span>完成时间：{formatDate(stat.finishedAt ?? "")}</span>
                </div>
                {index < summary.lessonStats.length - 1 && <hr />}
              </article>
            ))}
          </div>
        </div>
        <ChartPanel title="字符难度分布" value={`${symbolStore.rows.length} 个`} segments={difficultyDistribution} />
      </section>

      <section className="panel">
        <h2>最近完成的练习会话</h2>
        {!summary.recentSessions.length ? (
          <EmptyState title="还没有完成的练习会话" hint="去练习模式完整答完一组题目后，这里会显示结果，切回页面仍然可见。" />
        ) : (
          <div className="table">
            <div className="table-row table-head">
              <span>完成时间</span><span>课程</span><span>模式</span><span>得分</span><span>错题数</span>
            </div>
            {summary.recentSessions.map((session) => {
              const lesson = lessonStore.rows.find((row) => row.id === session.lesson_id);
              return (
                <div className="table-row" key={session.id}>
                  <span>{formatDate(session.finished_at)}</span>
                  <span>{lesson?.title ?? `课程 ${session.lesson_id}`}</span>
                  <span>{formatPracticeMode(session.mode)}</span>
                  <span>{formatScore(session.score)}</span>
                  <span>{session.mistake_count}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
