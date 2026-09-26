import { useEffect, useMemo, useState } from "react";
import { MistakeReason, MistakeReasonText } from "../constants/MistakeReason";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";
import { useLessonStore } from "../stores/LessonStore";
import { usePracticeStore } from "../stores/PracticeDraftStore";
import { buildMistakeEntries } from "../services/mistakeService";
import { BrailleCell } from "../components/common/BrailleCell";
import { ResultBadge } from "../components/common/ResultBadge";
import { EmptyState } from "../components/common/EmptyState";
import { PracticePanel } from "../components/common/PracticePanel";
import { formatCategory, formatDate, formatDifficulty, formatMistakeReason } from "../utils/formatters";
import type { MistakeEntry } from "../types/MistakeEntry";
import type { MistakeReason as MistakeReasonType } from "../constants/MistakeReason";

export function MistakesPage({ onNavigatePractice }: { onNavigatePractice: () => void }) {
  const recordStore = useAnswerRecordStore();
  const symbolStore = useBrailleSymbolStore();
  const sessionStore = usePracticeSessionStore();
  const lessonStore = useLessonStore();
  const practiceStore = usePracticeStore();
  const [reasonFilter, setReasonFilter] = useState<"ALL" | MistakeReasonType>("ALL");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    void Promise.all([
      recordStore.rows.length ? Promise.resolve() : recordStore.load(),
      symbolStore.rows.length ? Promise.resolve() : symbolStore.load(),
      sessionStore.rows.length ? Promise.resolve() : sessionStore.load(),
      lessonStore.rows.length ? Promise.resolve() : lessonStore.load()
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entries = useMemo(
    () => buildMistakeEntries(recordStore.rows, sessionStore.rows, symbolStore.rows),
    [recordStore.rows, sessionStore.rows, symbolStore.rows]
  );
  const filtered = entries.filter((entry) => reasonFilter === "ALL" || entry.latestReason === reasonFilter);
  const usedReasons = new Set(entries.map((entry) => entry.latestReason));

  // 重练：定位包含该符号的第一课，发起单题草稿并跳到练习页；答对后该符号自动标记已掌握。
  const retry = (entry: MistakeEntry) => {
    const lesson = lessonStore.rows.find((row) => row.symbol_ids.includes(entry.symbol.id));
    if (!lesson) return;
    void practiceStore.startTarget(lesson.id, "CELL_TO_TEXT", [entry.symbol.id]).then(() => onNavigatePractice());
  };

  return (
    <section className="page-stack">
      <header className="page-head inner">
        <div>
          <p className="eyebrow">MISTAKE BOOK</p>
          <h1>错题本</h1>
          <p className="subtitle">按符号展示最近一次答错原因；重练答对即标记已掌握并移出错题本，全部历史记录保留。</p>
        </div>
      </header>

      <PracticePanel title={`待攻克错题（${entries.length} 个符号）`} badge={entries.length ? "LEARNING" : "MASTERED"}>
        <div className="filter-bar">
          <button type="button" className={`chip ${reasonFilter === "ALL" ? "active" : ""}`} onClick={() => setReasonFilter("ALL")}>
            全部
          </button>
          {MistakeReason.map((reason) => (
            <button
              key={reason}
              type="button"
              className={`chip ${reasonFilter === reason ? "active" : ""}`}
              disabled={!usedReasons.has(reason)}
              onClick={() => setReasonFilter(reason)}
            >
              {MistakeReasonText[reason]}
            </button>
          ))}
        </div>
      </PracticePanel>

      {!entries.length && (
        <EmptyState title="错题本是空的" hint="完成的练习中暂无答错符号；曾答错但重练答对的符号已标记为已掌握。" />
      )}

      <div className="mistake-grid">
        {filtered.map((entry) => (
          <PracticePanel
            key={entry.symbol.id}
            title={`${entry.symbol.letter} · ${formatCategory(entry.symbol.category)}`}
            badge={entry.mastery}
            footer={
              <>
                <button type="button" className="btn primary" onClick={() => retry(entry)}>重练本题</button>
                <button type="button" className="btn ghost" onClick={() => setExpanded(expanded === entry.symbol.id ? null : entry.symbol.id)}>
                  {expanded === entry.symbol.id ? "收起历史" : `查看历史（${entry.history.length} 条）`}
                </button>
              </>
            }
          >
            <div className="mistake-body">
              <BrailleCell pattern={entry.symbol.cell_pattern} size={40} />
              <div className="mistake-meta">
                <p className="difficulty">{formatDifficulty(entry.symbol.difficulty)}</p>
                <p>拼音提示：{entry.symbol.pinyin}</p>
                <p>最近答错：{formatDate(entry.latestSession.finished_at)}</p>
                <ResultBadge correct={false} reason={entry.latestReason} />
              </div>
            </div>
            {expanded === entry.symbol.id && (
              <ul className="history-list">
                {[...entry.history].reverse().map(({ record, session }) => (
                  <li key={record.id} className={record.correct ? "ok" : "bad"}>
                    <span>{formatDate(session.finished_at)}</span>
                    <span>作答 <code>{record.user_answer || "未作答"}</code></span>
                    <span>{record.correct ? "答对（已掌握）" : `答错 · ${formatMistakeReason(record.mistake_reason)}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </PracticePanel>
        ))}
      </div>
    </section>
  );
}
