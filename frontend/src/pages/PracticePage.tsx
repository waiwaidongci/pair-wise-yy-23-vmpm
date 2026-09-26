import { useEffect, useMemo, useState } from "react";
import { PracticeMode, PracticeModeText } from "../constants/PracticeMode";
import { usePracticeSession } from "../hooks/usePracticeSession";
import { PracticePanel } from "../components/common/PracticePanel";
import { LessonProgress } from "../components/common/LessonProgress";
import { EmptyState } from "../components/common/EmptyState";
import { QuestionCard } from "../components/practice/QuestionCard";
import { SessionResult } from "../components/practice/SessionResult";
import { formatPracticeMode } from "../utils/formatters";
import { modePrompt } from "../utils/speech";

export function PracticePage() {
  const { practice, symbolStore, lessonStore } = usePracticeSession();
  const [lessonId, setLessonId] = useState<number>(0);
  const [mode, setMode] = useState<(typeof PracticeMode)[number]>("CELL_TO_TEXT");
  const [questionIndex, setQuestionIndex] = useState(0);

  // 进入页面（或从错题本跳来）时优先续上未完成草稿。
  useEffect(() => {
    const target = practice.pendingTarget;
    if (target) {
      setLessonId(target.lessonId);
      setMode(target.mode);
      setQuestionIndex(0);
      return;
    }
    if (practice.draft) {
      setLessonId(practice.draft.lesson_id);
      setMode(practice.draft.mode);
      setQuestionIndex(practice.draft.current_index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practice.draft?.id, practice.pendingTarget !== null]);

  // 切换到未作答题目时刷新展示时间，latency_ms 从最近一次进入题目开始计。
  useEffect(() => {
    if (!practice.draft) return;
    const item = practice.draft.answers[questionIndex];
    if (item && !item.user_answer) {
      void practice.enterQuestion(practice.draft.lesson_id, practice.draft.mode, questionIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practice.draft?.id, questionIndex]);

  const symbolMap = useMemo(
    () => new Map(symbolStore.rows.map((symbol) => [symbol.id, symbol])),
    [symbolStore.rows]
  );
  const lesson = useMemo(
    () => lessonStore.rows.find((row) => row.id === lessonId) ?? null,
    [lessonStore.rows, lessonId]
  );

  const draft = practice.draft;
  const draftSymbols = useMemo(
    () =>
      draft
        ? draft.answers.map((item) => symbolMap.get(item.symbol_id)).filter((s): s is NonNullable<typeof s> => Boolean(s))
        : [],
    [draft, symbolMap]
  );
  const currentAnswer = draft?.answers[questionIndex] ?? null;
  const currentSymbol = currentAnswer ? symbolMap.get(currentAnswer.symbol_id) ?? null : null;
  const answeredCount = draft?.answers.filter((item) => userAnswered(item)).length ?? 0;
  const allDone = draft ? draft.answers.every((item) => userAnswered(item)) : false;

  if (practice.lastCompleted) {
    return (
      <section className="practice-page">
        <SessionResult
          session={practice.lastCompleted.session}
          records={practice.lastCompleted.records}
          symbols={symbolStore.rows}
          onRetry={() => {
            const { lesson_id: lid, mode: m } = practice.lastCompleted!.session;
            practice.clearLastCompleted();
            void practice.start(lid, m);
            setQuestionIndex(0);
          }}
          onClose={() => {
            practice.clearLastCompleted();
          }}
        />
      </section>
    );
  }

  return (
    <section className="practice-page">
      <header className="page-head inner">
        <div>
          <p className="eyebrow">CLASSROOM PRACTICE</p>
          <h1>课堂练习模式</h1>
          <p className="subtitle">逐题作答即时反馈；没做完可随时离开，下次回来接着答，未完成不计入错题本和学习进度。</p>
        </div>
      </header>

      {practice.error && (
        <div className="alert error" role="alert">
          {practice.error}
          <button type="button" className="btn link" onClick={practice.clearError}>知道了</button>
        </div>
      )}

      {!draft && (
        <PracticePanel title="选择课程与练习模式" badge="DRAFT_NOT_STARTED">
          <div className="form-grid">
            <label>
              课程
              <select value={lessonId} onChange={(event) => setLessonId(Number(event.target.value))}>
                <option value={0}>请选择课程</option>
                {lessonStore.rows.map((row) => (
                  <option key={row.id} value={row.id}>{row.title}（{row.symbol_ids.length} 题）</option>
                ))}
              </select>
            </label>
            <label>
              练习模式
              <select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
                {PracticeMode.map((value) => (
                  <option key={value} value={value}>{PracticeModeText[value]}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="hint">{modePrompt(mode)}</p>
          <button
            type="button"
            className="btn primary big"
            disabled={practice.busy || !lessonId}
            onClick={() => {
              setQuestionIndex(0);
              void practice.start(lessonId, mode);
            }}
          >
            {practice.busy ? "准备中…" : "开始本组练习"}
          </button>
        </PracticePanel>
      )}

      {draft && currentAnswer && currentSymbol && lesson && (
        <>
          <PracticePanel
            title={`${lesson.title} · ${PracticeModeText[draft.mode]}`}
            badge="DRAFT_IN_PROGRESS"
            footer={
              <div className="runner-actions">
                <button
                  type="button"
                  className="btn ghost"
                  disabled={questionIndex === 0}
                  onClick={() => setQuestionIndex((value) => Math.max(0, value - 1))}
                >
                  上一题
                </button>
                {questionIndex < draft.answers.length - 1 ? (
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => setQuestionIndex((value) => Math.min(draft.answers.length - 1, value + 1))}
                  >
                    下一题
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn primary"
                    disabled={!allDone || practice.busy}
                    title={allDone ? "一次性生成练习会话与答题记录" : "还有题目未作答"}
                    onClick={() => void practice.finish(draft.lesson_id, draft.mode)}
                  >
                    {allDone ? "整组完成并提交" : "还有题目未作答"}
                  </button>
                )}
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => {
                    if (window.confirm("放弃本组草稿？未完成的作答不会计入错题本和学习进度。")) {
                      void practice.abandon(draft.lesson_id, draft.mode).then(() => setQuestionIndex(0));
                    }
                  }}
                >
                  放弃草稿
                </button>
              </div>
            }
          >
            <LessonProgress answered={answeredCount} total={draft.answers.length} currentIndex={questionIndex} />
            <nav className="question-tabs" aria-label="题目导航">
              {draft.answers.map((item, index) => (
                <button
                  key={`${item.symbol_id}-${index}`}
                  type="button"
                  className={`question-tab ${index === questionIndex ? "active" : ""} ${userAnswered(item) ? (item.correct ? "ok" : "bad") : "todo"}`}
                  onClick={() => setQuestionIndex(index)}
                  aria-label={`第 ${index + 1} 题${userAnswered(item) ? (item.correct ? "已答对" : "已答错") : "未作答"}`}
                >
                  {index + 1}
                </button>
              ))}
            </nav>
            <QuestionCard
              key={`${draft.id}-${questionIndex}`}
              answer={currentAnswer}
              index={questionIndex}
              total={draft.answers.length}
              symbol={currentSymbol}
              busy={practice.busy}
              onSubmit={(raw) => void practice.answer(draft.lesson_id, draft.mode, questionIndex, raw, currentSymbol)}
            />
          </PracticePanel>
          {draftSymbols.length === draft.answers.length && (
            <p className="hint">草稿仅保存在本机 IndexedDB，完成提交前不会出现在错题本或学习进度中。</p>
          )}
        </>
      )}

      {draft && (!currentAnswer || !currentSymbol) && <EmptyState title="草稿题目加载中或已失效" hint="可放弃草稿后重新开始本组练习。" />}
      {!draft && !lessonStore.rows.length && <EmptyState title="暂无可练习的课程" hint="请先在学习卡片页确认课程数据已加载。" />}
      {draft && <span className="sr-only">{formatPracticeMode(draft.mode)}</span>}
    </section>
  );
}

function userAnswered(item: { user_answer: string }): boolean {
  return item.user_answer !== "";
}
