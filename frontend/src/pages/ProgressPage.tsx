import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { buildProgressOverview, type ProgressOverview } from "../services/progressService";
import { downloadDataBackup, importDataBackup } from "../controllers/dataController";
import { ChartPanel, type BarDatum } from "../components/common/ChartPanel";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { LessonProgress } from "../components/common/LessonProgress";
import { EmptyState } from "../components/common/EmptyState";
import { STATUS_TEXT } from "../constants/statusText";
import { MistakeReasonText } from "../constants/MistakeReason";
import { formatDate, formatPercent, formatScore } from "../utils/formatters";
import { wrapControllerError } from "../utils/errors";

export function ProgressPage() {
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    void downloadDataBackup().catch((exportError) => {
      window.alert(exportError instanceof Error ? exportError.message : "导出失败");
    });
  };

  const handleImportFile = (file: File) => {
    importDataBackup(file)
      .then((counts) => {
        window.alert(`导入完成：字符 ${counts.symbols}、课程 ${counts.lessons}、会话 ${counts.sessions}、记录 ${counts.records}`);
        load();
      })
      .catch((importError) => window.alert(importError instanceof Error ? importError.message : "导入失败"));
  };

  const load = () => {
    setLoading(true);
    buildProgressOverview()
      .then((data) => {
        setOverview(data);
        setError(null);
      })
      .catch((loadError) => {
        const wrapped = wrapControllerError("page.progress", loadError);
        setError(wrapped.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="page"><EmptyState title="正在统计学习进度…" /></div>;
  if (error || !overview) {
    return (
      <div className="page">
        <EmptyState title="统计失败" hint={error ?? undefined} action={<button className="btn btn--primary" onClick={load}>重试</button>} />
      </div>
    );
  }

  const trendData: BarDatum[] = overview.scoreTrend.map((item) => ({
    label: item.label,
    value: item.score,
    hint: formatDate(item.at),
    tone: item.score >= 85 ? "good" : item.score >= 60 ? "warn" : "bad"
  }));

  const reasonData: BarDatum[] = overview.reasonDistribution
    .sort((a, b) => b.count - a.count)
    .map((item) => ({ label: MistakeReasonText[item.reason].split("：")[0], value: item.count, tone: "bad" }));

  const difficultyBars: BarDatum[] = overview.difficultyDistribution.map((item) => ({
    label: STATUS_TEXT.Difficulty[item.difficulty],
    value: item.total,
    hint: `正确 ${item.correct}/${item.total}`,
    tone: item.total && item.correct / item.total >= 0.8 ? "good" : item.total && item.correct / item.total >= 0.6 ? "warn" : "bad"
  }));

  const correctDonut: BarDatum[] = [
    { label: "答对", value: overview.records.filter((record) => record.correct).length, tone: "good" },
    { label: "答错", value: overview.records.filter((record) => !record.correct).length, tone: "bad" }
  ];

  return (
    <div className="page page-progress">
      <header className="page-head">
        <div>
          <p className="eyebrow">PROGRESS · Lesson + PracticeSession + AnswerRecord</p>
          <h1>学习进度</h1>
          <p className="page-sub">
            仅按<strong>已完成会话</strong>统计课程完成率、最近得分与正确率；未完成草稿不出现在本页。
          </p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={load}>
            刷新统计
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={handleExport}>
            导出数据
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => fileInputRef.current?.click()}>
            导入数据
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleImportFile(file);
              event.target.value = "";
            }}
          />
        </div>
      </header>

      <section className="metrics metrics--4">
        <StatCard
          label="课程完成率"
          value={formatPercent(overview.lessonCompletionRate)}
          hint={`${overview.completedLessonCount}/${overview.lessons.length} 门课程已完成`}
          tone={overview.lessonCompletionRate >= 0.8 ? "good" : overview.lessonCompletionRate >= 0.4 ? "warn" : "bad"}
        />
        <StatCard label="已完成会话" value={overview.completedSessions} hint="未完成草稿不计入" />
        <StatCard
          label="最近得分"
          value={overview.latestScore == null ? "—" : formatScore(overview.latestScore)}
          tone={overview.latestScore == null ? "default" : overview.latestScore >= 85 ? "good" : overview.latestScore >= 60 ? "warn" : "bad"}
        />
        <StatCard
          label="累计正确率"
          value={formatPercent(overview.overallCorrectRate)}
          hint={overview.averageScore == null ? undefined : `会话平均 ${overview.averageScore} 分`}
          tone={overview.overallCorrectRate >= 0.8 ? "good" : overview.overallCorrectRate >= 0.6 ? "warn" : "bad"}
        />
      </section>

      <div className="dashboard-grid">
        <ChartPanel
          title="得分趋势"
          subtitle="按已完成会话时间顺序的每次得分（满分 100）"
          type="line"
          data={trendData}
          max={100}
        />
        <ChartPanel title="累计答题对错分布" type="donut" data={correctDonut} />
        <ChartPanel title="错题原因归类" subtitle="按所有答错记录的原因计数" type="bars" data={reasonData} />
        <ChartPanel title="难度分布与正确率" subtitle="按点字字符难度聚合答题情况" type="bars" data={difficultyBars} />
      </div>

      <section className="panel">
        <h2>各课程完成情况</h2>
        <div className="lesson-grid lesson-grid--compact">
          {overview.lessonStats.map((stat) => (
            <LessonProgress
              key={stat.lesson.id}
              title={stat.lesson.title}
              done={stat.completed ? 1 : 0}
              total={1}
              status={stat.completed ? "completed" : "active"}
              latestScore={stat.latest_score}
              estimatedMinutes={stat.lesson.estimated_minutes}
            />
          ))}
        </div>
        <p className="progress-footnote">
          完成率 = 至少有一次已完成会话的课程数 / 全部课程数；最近得分取时间最晚的已完成会话。
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>已完成会话明细</h2>
          <Link className="btn btn--ghost btn--sm" to="/practice">
            去练习
          </Link>
        </div>
        {overview.sessions.length === 0 ? (
          <EmptyState title="还没有已完成的练习会话" hint="去练习模式完成一整组题目后这里会出现记录。" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>完成时间</th>
                <th>名称</th>
                <th>来源</th>
                <th>模式</th>
                <th>题量</th>
                <th>错题</th>
                <th>得分</th>
              </tr>
            </thead>
            <tbody>
              {[...overview.sessions].reverse().map((session) => (
                <tr key={session.id}>
                  <td>{formatDate(session.finished_at)}</td>
                  <td>{session.title}</td>
                  <td>
                    <StatusBadge value={session.source === "RETRY" ? "错题重练" : "课程练习"} />
                  </td>
                  <td>
                    <StatusBadge kind="practice-mode" value={session.mode} />
                  </td>
                  <td>{session.total_count}</td>
                  <td>{session.mistake_count}</td>
                  <td>
                    <strong className={session.score >= 85 ? "text-good" : session.score >= 60 ? "text-warn" : "text-bad"}>
                      {session.score}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
