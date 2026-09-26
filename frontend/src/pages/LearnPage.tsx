import { useEffect, useMemo, useState } from "react";
import { SymbolCategory, SymbolCategoryText } from "../constants/SymbolCategory";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import { useLessonStore } from "../stores/LessonStore";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";
import { useIndexedDbStore } from "../hooks/useIndexedDbStore";
import { buildMasteryMap } from "../services/mistakeService";
import { BrailleCell } from "../components/common/BrailleCell";
import { StatusBadge } from "../components/common/StatusBadge";
import { EmptyState } from "../components/common/EmptyState";
import { PracticePanel } from "../components/common/PracticePanel";
import { formatCategory, formatDifficulty, formatMastery } from "../utils/formatters";
import type { BrailleSymbol as BrailleSymbolType } from "../types/BrailleSymbol";

export function LearnPage({ onPracticeLesson }: { onPracticeLesson: (lessonId: number) => void }) {
  const symbolStore = useBrailleSymbolStore();
  const lessonStore = useLessonStore();
  const recordStore = useAnswerRecordStore();
  const sessionStore = usePracticeSessionStore();
  const [category, setCategory] = useState<"ALL" | (typeof SymbolCategory)[number]>("ALL");
  const [difficulty, setDifficulty] = useState<"ALL" | 1 | 2 | 3>("ALL");

  const list = useIndexedDbStore<BrailleSymbolType>(
    useMemo(
      () =>
        symbolStore.rows.filter(
          (symbol) =>
            (category === "ALL" || symbol.category === category) &&
            (difficulty === "ALL" || symbol.difficulty === difficulty)
        ),
      [symbolStore.rows, category, difficulty]
    ),
    symbolStore.load,
    { keywordOf: (row) => `${row.letter} ${row.pinyin}` }
  );

  useEffect(() => {
    void Promise.all([
      lessonStore.rows.length ? Promise.resolve() : lessonStore.load(),
      recordStore.rows.length ? Promise.resolve() : recordStore.load(),
      sessionStore.rows.length ? Promise.resolve() : sessionStore.load()
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const masteryMap = useMemo(
    () => buildMasteryMap(recordStore.rows, sessionStore.rows, symbolStore.rows),
    [recordStore.rows, sessionStore.rows, symbolStore.rows]
  );

  const visibleSymbols = list.pageRows;
  const visibleTotal = list.total;

  return (
    <section className="page-stack">
      <header className="page-head inner">
        <div>
          <p className="eyebrow">BRAILLE FLASHCARDS</p>
          <h1>学习卡片</h1>
          <p className="subtitle">按分类和难度切换点阵卡片；掌握状态由已完成的练习记录自动计算。</p>
        </div>
      </header>

      <PracticePanel title="课程路径" badge={`${lessonStore.rows.length} LESSONS`}>
        <div className="lesson-cards">
          {lessonStore.rows.map((lesson) => (
            <article className="lesson-card" key={lesson.id}>
              <h3>{lesson.title}</h3>
              <p>{lesson.stage} · 约 {lesson.estimated_minutes} 分钟 · {lesson.symbol_ids.length} 个字符</p>
              <p className="hint">{lesson.unlock_rule}</p>
              <button type="button" className="btn primary" onClick={() => onPracticeLesson(lesson.id)}>
                去练习这节课
              </button>
            </article>
          ))}
        </div>
      </PracticePanel>

      <PracticePanel
        title="点阵字符卡片"
        badge={`${visibleTotal} / ${symbolStore.rows.length}`}
      >
        <div className="filter-bar">
          <button type="button" className={`chip ${category === "ALL" ? "active" : ""}`} onClick={() => setCategory("ALL")}>全部分类</button>
          {SymbolCategory.map((value) => (
            <button key={value} type="button" className={`chip ${category === value ? "active" : ""}`} onClick={() => setCategory(value)}>
              {SymbolCategoryText[value]}
            </button>
          ))}
          <span className="filter-divider" />
          <button type="button" className={`chip ${difficulty === "ALL" ? "active" : ""}`} onClick={() => setDifficulty("ALL")}>全部难度</button>
          {[1, 2, 3].map((star) => (
            <button key={star} type="button" className={`chip ${difficulty === star ? "active" : ""}`} onClick={() => setDifficulty(star as 1 | 2 | 3)}>
              {formatDifficulty(star)}
            </button>
          ))}
        </div>
        <input
          className="answer-input"
          placeholder="按字符或拼音搜索"
          value={list.keyword}
          onChange={(event) => list.setKeyword(event.target.value)}
        />
      </PracticePanel>

      {!visibleTotal && <EmptyState title="没有符合条件的字符卡片" />}

      <div className="card-grid">
        {visibleSymbols.map((symbol) => (
          <article className="symbol-card" key={symbol.id}>
            <div className="symbol-card-head">
              <StatusBadge value={formatMastery(masteryMap.get(symbol.id) ?? "NEW")} />
              <span className="difficulty">{formatDifficulty(symbol.difficulty)}</span>
            </div>
            <div className="symbol-card-body">
              <BrailleCell pattern={symbol.cell_pattern} size={36} />
              <div>
                <span className="big-letter">{symbol.letter}</span>
                <p>{symbol.pinyin} · {formatCategory(symbol.category)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      {visibleTotal > list.pageSize && (
        <div className="pager">
          <button type="button" className="btn ghost" disabled={list.page === 1} onClick={() => list.setPage(list.page - 1)}>上一页</button>
          <span>第 {list.page} / {Math.max(1, Math.ceil(visibleTotal / list.pageSize))} 页</span>
          <button
            type="button"
            className="btn ghost"
            disabled={list.page >= Math.ceil(visibleTotal / list.pageSize)}
            onClick={() => list.setPage(list.page + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </section>
  );
}
