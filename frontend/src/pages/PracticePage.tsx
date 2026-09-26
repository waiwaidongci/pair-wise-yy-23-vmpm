import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { useLessonStore } from "../stores/LessonStore";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import { PracticePanel } from "../components/common/PracticePanel";
import { LessonProgress } from "../components/common/LessonProgress";
import { ResultBadge } from "../components/common/ResultBadge";
import { StatusBadge } from "../components/common/StatusBadge";
import { StatCard } from "../components/common/StatCard";
import { PracticeMode, PracticeModeList, PracticeModeText } from "../constants/PracticeMode";
import { formatDuration, formatScore } from "../utils/formatters";
import { isLessonUnlocked } from "../services/lessonService";
import type { PracticeMode as Mode } from "../types/PracticeMode";
import type { PracticeResult } from "../types/PracticeResult";

interface LocationState {
  startLesson?: number;
  mode?: Mode;
}

export function PracticePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const lessons = useLessonStore((s) => s.rows);
  const sessions = usePracticeSessionStore((s) => s.rows);
  const reloadSessions = usePracticeSessionStore((s) => s.load);
  const reloadRecords = useAnswerRecordStore((s) => s.load);
  const session = usePracticeSession();

  const [selectedLesson, setSelectedLesson] = useState<number>(1);
  const [mode, setMode] = useState<Mode>(PracticeMode.CELL_TO_TEXT);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    void session.init();
    // 仅在挂载时恢复草稿 / 最近结果
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 从学习页跳转过来：当且仅当没有未完成草稿（phase=idle）时自动开始指定课程
  const navState = (location.state as LocationState | null) ?? null;
  useEffect(() => {
    if (!session.ready || !navState || session.phase !== "idle" || session.busy) return;
    const lessonId = navState.startLesson;
    if (lessonId == null) return;
    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) return;
    if (!isLessonUnlocked(lesson, completedLessonIds)) return;
    void session
      .start({ lessonId, mode: navState.mode ?? PracticeMode.CELL_TO_TEXT, source: "LESSON", title: lesson.title })
      .then(() => navigate(location.pathname, { replace: true, state: null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navState?.startLesson, session.ready, session.phase]);

  const completedLessonIds = useMemo(
    () =>
      new Set(
        sessions
          .filter((item) => item.finished_at && item.lesson_id != null)
          .map((item) => item.lesson_id as number)
      ),
    [sessions]
  );

  useEffect(() => {
    if (!lessons.some((lesson) => lesson.id === selectedLesson)) {
      setSelectedLesson(lessons.find((lesson) => isLessonUnlocked(lesson, completedLessonIds))?.id ?? lessons[0]?.id ?? 1);
    }
  }, [lessons, completedLessonIds, selectedLesson]);

  const startSelected = () => {
    const lesson = lessons.find((item) => item.id === selectedLesson);
    if (!lesson || !isLessonUnlocked(lesson, completedLessonIds)) return;
    void session.start({ lessonId: lesson.id, mode, source: "LESSON", title: lesson.title });
  };

  const refreshAfterCommit = () => {
    void reloadSessions();
    void reloadRecords();
  };

  // ---------- 结算 ----------
  if (session.phase === "finished" && session.result) {
    const result = session.result;
    return (
      <div className="page page-practice">
        <header className="page-head">
          <div>
            <p className="eyebrow">PRACTICE RESULT</p>
            <h1>本组练习完成</h1>
            <p className="page-sub">练习会话与答题记录已一次生成；错题本和学习进度已更新，切回页面仍能看到这次结果。</p>
          </div>
          <StatusBadge kind="practice-mode" value={result.mode} />
        </header>

        <section className="metrics metrics--4">
          <StatCard
            label="本组得分"
            value={formatScore(result.score)}
            tone={result.score >= 85 ? "good" : result.score >= 60 ? "warn" : "bad"}
          />
          <StatCard label="答对题数" value={`${result.correct_count} / ${result.total_count}`} tone="good" />
          <StatCard label="错题数" value={result.mistake_count} tone={result.mistake_count > 0 ? "bad" : "good"} />
          <StatCard label="完成用时" value={formatDuration(result.started_at, result.finished_at)} />
        </section>

        <section className="panel result-panel">
          <ResultSummary
            score={result.score}
            onRetryMistakes={() => navigate("/mistakes")}
            onAgain={() => {
              if (result.lesson_id == null) return;
              const lesson = lessons.find((item) => item.id === result.lesson_id);
              if (lesson) void session.start({ lessonId: lesson.id, mode: result.mode, source: "LESSON", title: lesson.title });
            }}
            onProgress={() => navigate("/progress")}
          />
        </section>
      </div>
    );
  }

  // ---------- 答题中（含草稿续答） ----------
  if (session.phase === "active" && session.draft && session.question) {
    const draft = session.draft;
    const answeredCount = session.answeredCount;
    return (
      <div className="page page-practice">
        <header className="page-head">
          <div>
            <p className="eyebrow">PRACTICE · 草稿进行中（未完成不计入错题本与进度）</p>
            <h1>{draft.title}</h1>
            <p className="page-sub">
              每题提交后立即显示对错与错误原因；题目留在当前会话，中途离开自动保留草稿，下次回来接着答。
            </p>
          </div>
          <StatusBadge kind="practice-mode" value={draft.mode} label={PracticeModeText[draft.mode]} />
        </header>

        <LessonProgress title="本组进度" done={answeredCount} total={draft.symbol_ids.length} status="active" />

        <div className="question-nav" role="tablist" aria-label="题目导航">
          {draft.symbol_ids.map((symbolId, index) => {
            const answer = draft.answers[index];
            const state = answer
              ? answer.correct
                ? "right"
                : "wrong"
              : index === session.index
                ? "current"
                : "pending";
            return (
              <button
                key={`${symbolId}-${index}`}
                type="button"
                className={`q-dot q-dot--${state}`}
                onClick={() => session.jumpTo(index)}
                title={`第 ${index + 1} 题`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <PracticePanel
          question={session.question}
          index={session.index}
          total={draft.symbol_ids.length}
          mode={draft.mode}
          feedback={session.feedback}
          existing={session.existingAnswer ?? undefined}
          busy={session.busy}
          onSubmit={(value) => void session.submit(value)}
          onNext={() => {
            if (session.index === draft.symbol_ids.length - 1) {
              if (session.allDone) void session.finish().then(refreshAfterCommit);
              else session.next();
            } else {
              session.next();
            }
          }}
          isLast={session.index === draft.symbol_ids.length - 1}
        />

        {session.error ? <p className="form-error">{session.error}</p> : null}

        <div className="practice-actions">
          <button type="button" className="btn btn--ghost" onClick={() => navigate("/learn")}>
            暂离并保存草稿
          </button>
          <button
            type="button"
            className="btn btn--danger-ghost"
            onClick={() => {
              if (confirmDiscard) {
                void session.quit().then(() => setConfirmDiscard(false));
              } else {
                setConfirmDiscard(true);
              }
            }}
          >
            {confirmDiscard ? "确认放弃本组（已答内容不记录）" : "放弃本组"}
          </button>
          {session.allDone ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void session.finish().then(refreshAfterCommit)}
              disabled={session.busy}
            >
              整组完成，提交并查看结果
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  // ---------- 开始页（续答由 init 自动恢复，最近结果卡片在顶部） ----------
  return (
    <div className="page page-practice">
      <header className="page-head">
        <div>
          <p className="eyebrow">PRACTICE · PracticeSession + BrailleSymbol + AnswerRecord</p>
          <h1>练习模式</h1>
          <p className="page-sub">
            整组完成后一次生成练习会话和答题记录；未完成期间只存会话草稿，不计入错题本和学习进度。
          </p>
        </div>
      </header>

      {session.result && session.phase !== "finished" ? (
        <LastResultCard result={session.result} onDismiss={session.dismissResult} />
      ) : null}

      <section className="panel start-panel">
        <h2>开始一组新练习</h2>
        <div className="start-form">
          <label className="field">
            <span>选择课程</span>
            <select value={selectedLesson} onChange={(event) => setSelectedLesson(Number(event.target.value))}>
              {lessons.map((lesson) => {
                const unlocked = isLessonUnlocked(lesson, completedLessonIds);
                return (
                  <option key={lesson.id} value={lesson.id} disabled={!unlocked}>
                    {lesson.title}
                    {unlocked ? "" : "（未解锁）"}
                  </option>
                );
              })}
            </select>
          </label>
          <div className="field">
            <span>练习题型（PracticeMode）</span>
            <div className="mode-switch">
              {PracticeModeList.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`chip ${mode === item ? "chip--active" : ""}`}
                  onClick={() => setMode(item)}
                >
                  {PracticeModeText[item]}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={startSelected}
            disabled={session.busy}
          >
            开始练习
          </button>
          <p className="field-hint">支持键盘 1–4 快速作答。每题提交后立即反馈对错和错误原因。</p>
        </div>
      </section>
    </div>
  );
}

function ResultSummary({
  score,
  onRetryMistakes,
  onAgain,
  onProgress
}: {
  score: number;
  onRetryMistakes: () => void;
  onAgain: () => void;
  onProgress: () => void;
}) {
  return (
    <div className="result-summary">
      <div className="result-summary__badge">
        <ResultBadge correct={score >= 60} text={score >= 85 ? "优秀" : score >= 60 ? "通过" : "继续加油"} />
      </div>
      <p>
        {score >= 85
          ? "整组表现很好，可以到学习进度查看趋势。"
          : "答错的符号已按最近一次答错原因进入错题本；重练答对即标记为已掌握，答题历史保留。"}
      </p>
      <div className="result-summary__actions">
        <button type="button" className="btn btn--primary" onClick={onRetryMistakes}>
          去错题本重练
        </button>
        <button type="button" className="btn btn--ghost" onClick={onAgain}>
          再练本组
        </button>
        <button type="button" className="btn btn--ghost" onClick={onProgress}>
          查看学习进度
        </button>
      </div>
    </div>
  );
}

function LastResultCard({ result, onDismiss }: { result: PracticeResult; onDismiss: () => void }) {
  return (
    <section className="panel last-result-card">
      <div>
        <h2>这次练习结果</h2>
        <p>
          {result.title} · <StatusBadge kind="practice-mode" value={result.mode} /> · {Math.round(result.score)} 分 ·{" "}
          {result.correct_count}/{result.total_count} 题正确
        </p>
      </div>
      <button type="button" className="btn btn--ghost btn--sm" onClick={onDismiss}>
        关闭
      </button>
    </section>
  );
}
