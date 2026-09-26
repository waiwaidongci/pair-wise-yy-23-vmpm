import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import { useLessonStore } from "../stores/LessonStore";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";
import { querySymbols, type SymbolFilter } from "../services/symbolService";
import { symbolsOfLesson } from "../services/lessonService";
import { STATUS_TEXT, STATUS_FILTER_OPTIONS } from "../constants/statusText";
import { PracticeMode, PracticeModeList } from "../constants/PracticeMode";
import type { PracticeMode as PracticeModeType } from "../types/PracticeMode";
import { BrailleCell } from "../components/common/BrailleCell";
import { StatusBadge } from "../components/common/StatusBadge";
import { LessonProgress } from "../components/common/LessonProgress";
import { EmptyState } from "../components/common/EmptyState";
import { SymbolEditor } from "../components/SymbolEditor";
import { useBrailleSymbolStore as useSymbolStoreForReload } from "../stores/BrailleSymbolStore";
import { formatDifficulty } from "../utils/formatters";
import { describeSymbol } from "../utils/braille";
import type { Difficulty } from "../types/Difficulty";
import type { BrailleSymbol as BrailleSymbolType } from "../types/BrailleSymbol";

export function LearnPage() {
  const navigate = useNavigate();
  const symbols = useBrailleSymbolStore((s) => s.rows);
  const lessons = useLessonStore((s) => s.rows);
  const isUnlocked = useLessonStore((s) => s.isUnlocked);
  const setCompletedLessons = useLessonStore((s) => s.setCompletedLessons);
  const sessions = usePracticeSessionStore((s) => s.rows);
  const [filter, setFilter] = useState<SymbolFilter>({ category: "ALL", difficulty: "ALL", keyword: "" });
  const [visible, setVisible] = useState(symbols);
  const [selectedLessonId, setSelectedLessonId] = useState<number>(lessons[0]?.id ?? 1);
  const [mode, setMode] = useState<PracticeModeType>(PracticeMode.CELL_TO_TEXT);
  const [editorTarget, setEditorTarget] = useState<BrailleSymbolType | null | undefined>(undefined);
  const reloadSymbols = useSymbolStoreForReload((s) => s.load);

  // 已完成会话 → 解锁规则
  useEffect(() => {
    const completed = new Set(
      sessions.filter((session) => session.finished_at && session.lesson_id != null).map((session) => session.lesson_id as number)
    );
    setCompletedLessons(completed);
  }, [sessions, setCompletedLessons]);

  useEffect(() => {
    void querySymbols(filter).then(setVisible);
  }, [filter, symbols]);

  const completedLessonIds = useMemo(
    () => new Set(sessions.filter((s) => s.finished_at && s.lesson_id != null).map((s) => s.lesson_id as number)),
    [sessions]
  );

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0];
  const lessonSymbols = selectedLesson ? symbolsOfLesson(selectedLesson, symbols) : [];

  const latestScoreByLesson = useMemo(() => {
    const map = new Map<number, number>();
    sessions
      .filter((session) => session.finished_at && session.lesson_id != null)
      .forEach((session) => map.set(session.lesson_id as number, session.score));
    return map;
  }, [sessions]);

  const goPractice = (lessonId: number) => {
    navigate("/practice", { state: { startLesson: lessonId, mode } });
  };

  return (
    <div className="page page-learn">
      <header className="page-head">
        <div>
          <p className="eyebrow">LEARN · BrailleSymbol + Lesson</p>
          <h1>学习卡片</h1>
          <p className="page-sub">点阵卡片、字符解释、按难度切换；选择课程与题型后进入练习模式。</p>
        </div>
        <div className="mode-switch">
          {PracticeModeList.map((item) => (
            <button
              key={item}
              type="button"
              className={`chip ${mode === item ? "chip--active" : ""}`}
              onClick={() => setMode(item)}
            >
              {STATUS_TEXT.PracticeMode[item]}
            </button>
          ))}
        </div>
      </header>

      <section className="panel">
        <h2>课程路径</h2>
        <div className="lesson-grid">
          {lessons.map((lesson) => {
            const unlocked = isUnlocked(lesson);
            const done = completedLessonIds.has(lesson.id) ? 1 : 0;
            return (
              <LessonProgress
                key={lesson.id}
                title={lesson.title}
                done={done}
                total={1}
                status={!unlocked ? "locked" : done ? "completed" : "active"}
                latestScore={latestScoreByLesson.get(lesson.id) ?? null}
                estimatedMinutes={lesson.estimated_minutes}
                onStart={unlocked ? () => goPractice(lesson.id) : undefined}
                startLabel="开始本组练习"
              />
            );
          })}
        </div>
      </section>

      {selectedLesson ? (
        <section className="panel">
          <div className="panel-head">
            <h2>{selectedLesson.title}</h2>
            <div className="lesson-tabs">
              {lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  className={`chip ${selectedLessonId === lesson.id ? "chip--active" : ""}`}
                  onClick={() => setSelectedLessonId(lesson.id)}
                >
                  {lesson.stage.replace("STAGE_", "第 ") + " 阶段"}
                </button>
              ))}
            </div>
          </div>
          <div className="symbol-card-grid">
            {lessonSymbols.map((symbol) => (
              <article className="symbol-card" key={symbol.id}>
                <BrailleCell pattern={symbol.cell_pattern} size="md" showDotNumbers />
                <div className="symbol-card__body">
                  <div className="symbol-card__char">
                    <strong>{symbol.letter}</strong>
                    <span>{symbol.pinyin}</span>
                  </div>
                  <p className="symbol-card__desc">{describeSymbol(symbol)}</p>
                  <div className="symbol-card__badges">
                    <StatusBadge kind="symbol-category" value={symbol.category} />
                    <StatusBadge kind="difficulty" value={symbol.difficulty} label={formatDifficulty(symbol.difficulty)} />
                  </div>
                  <button type="button" className="btn btn--ghost btn--sm symbol-card__edit" onClick={() => setEditorTarget(symbol)}>
                    编辑
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-head">
          <h2>全部点字字符</h2>
          <div className="filters">
            <button type="button" className="btn btn--primary btn--sm" onClick={() => setEditorTarget(null)}>
              ＋ 新增字符
            </button>
            <select
              value={filter.category}
              onChange={(event) => setFilter((prev) => ({ ...prev, category: event.target.value as SymbolFilter["category"] }))}
            >
              <option value="ALL">全部分类</option>
              {STATUS_FILTER_OPTIONS.SymbolCategory.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filter.difficulty}
              onChange={(event) => setFilter((prev) => ({ ...prev, difficulty: event.target.value as Difficulty | "ALL" }))}
            >
              <option value="ALL">全部难度</option>
              {STATUS_FILTER_OPTIONS.Difficulty.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              placeholder="搜索字符 / 拼音 / 点位"
              value={filter.keyword}
              onChange={(event) => setFilter((prev) => ({ ...prev, keyword: event.target.value }))}
            />
          </div>
        </div>
        {visible.length === 0 ? (
          <EmptyState title="没有匹配的点字字符" hint="试试切换分类或难度筛选" />
        ) : (
          <div className="symbol-strip">
            {visible.map((symbol) => (
              <div className="symbol-chip" key={symbol.id} title={`${symbol.pinyin} · ${describeSymbol(symbol)}`}>
                <BrailleCell pattern={symbol.cell_pattern} size="sm" />
                <span>{symbol.letter}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {editorTarget !== undefined ? (
        <SymbolEditor
          initial={editorTarget}
          onClose={() => setEditorTarget(undefined)}
          onSaved={() => void reloadSymbols()}
        />
      ) : null}
    </div>
  );
}
