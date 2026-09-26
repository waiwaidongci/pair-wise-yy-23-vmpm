import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMistakeStore } from "../stores/mistakeStore";
import { retryMistakes } from "../controllers/mistakeController";
import { BrailleCell } from "../components/common/BrailleCell";
import { StatusBadge, MistakeReasonBadge } from "../components/common/StatusBadge";
import { EmptyState } from "../components/common/EmptyState";
import { MasteryLevel, MasteryLevelText } from "../constants/MasteryLevel";
import { MistakeReasonText } from "../constants/MistakeReason";
import { STATUS_FILTER_OPTIONS } from "../constants/statusText";
import { formatDate, formatLatency } from "../utils/formatters";
import { ResultBadge } from "../components/common/ResultBadge";
import type { MistakeBookEntry } from "../types/MistakeBookEntry";
import type { MistakeReason } from "../types/MistakeReason";
import type { MasteryLevel as Mastery } from "../types/MasteryLevel";

export function MistakesPage() {
  const navigate = useNavigate();
  const store = useMistakeStore();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void store.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.reasonFilter, store.masteryFilter, store.keyword]);

  const learningEntries = useMemo(() => store.entries.filter((entry) => entry.mastery !== MasteryLevel.MASTERED), [store.entries]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startRetry = async (entries: MistakeBookEntry[]) => {
    setBusy(true);
    try {
      await retryMistakes(entries);
      navigate("/practice");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "无法开始重练");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page page-mistakes">
      <header className="page-head">
        <div>
          <p className="eyebrow">MISTAKES · AnswerRecord + BrailleSymbol</p>
          <h1>错题本</h1>
          <p className="page-sub">
            按点字符号聚合，展示最近一次答错原因；重练答对后自动标记为已掌握，全部答题历史保留。
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          disabled={learningEntries.length === 0 || busy}
          onClick={() => void startRetry(learningEntries)}
        >
          重练全部待掌握（{learningEntries.length}）
        </button>
      </header>

      <section className="metrics metrics--3">
        <div className="stat-card stat-card--bad">
          <span className="stat-card__label">在册错题符号</span>
          <strong className="stat-card__value">{store.entries.length}</strong>
        </div>
        <div className="stat-card stat-card--warn">
          <span className="stat-card__label">待掌握</span>
          <strong className="stat-card__value">{learningEntries.length}</strong>
        </div>
        <div className="stat-card stat-card--good">
          <span className="stat-card__label">重练后已掌握</span>
          <strong className="stat-card__value">
            {store.entries.filter((entry) => entry.mastery === MasteryLevel.MASTERED).length}
          </strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>错题列表</h2>
          <div className="filters">
            <select
              value={store.reasonFilter}
              onChange={(event) => store.setReasonFilter(event.target.value as MistakeReason | "ALL")}
            >
              <option value="ALL">全部错误原因</option>
              {STATUS_FILTER_OPTIONS.MistakeReason.filter((option) => option.value !== "UNKNOWN_REASON").map((option) => (
                <option key={option.value} value={option.value}>
                  {String(option.label).split("：")[0]}
                </option>
              ))}
            </select>
            <select
              value={store.masteryFilter}
              onChange={(event) => store.setMasteryFilter(event.target.value as Mastery | "ALL")}
            >
              <option value="ALL">全部掌握状态</option>
              {STATUS_FILTER_OPTIONS.MasteryLevel.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input placeholder="搜索字符 / 拼音" value={store.keyword} onChange={(event) => store.setKeyword(event.target.value)} />
          </div>
        </div>

        {store.loading ? (
          <EmptyState title="加载中…" />
        ) : store.entries.length === 0 ? (
          <EmptyState
            title="错题本是空的"
            hint="完成一组练习后，答错的点字符号会带着最近一次答错原因出现在这里。"
          />
        ) : (
          <ul className="mistake-list">
            {store.entries.map((entry) => {
              const isOpen = expanded === entry.symbol.id;
              const mastered = entry.mastery === MasteryLevel.MASTERED;
              return (
                <li key={entry.symbol.id} className={`mistake-item ${mastered ? "mistake-item--mastered" : ""}`}>
                  <div className="mistake-item__main">
                    <input
                      type="checkbox"
                      checked={selected.has(entry.symbol.id)}
                      disabled={mastered}
                      onChange={() => toggleSelect(entry.symbol.id)}
                      aria-label="选择用于重练"
                    />
                    <BrailleCell pattern={entry.symbol.cell_pattern} size="md" />
                    <div className="mistake-item__info">
                      <div className="mistake-item__title">
                        <strong>{entry.symbol.letter}</strong>
                        <span>{entry.symbol.pinyin}</span>
                        <StatusBadge kind="symbol-category" value={entry.symbol.category} />
                        <StatusBadge kind="mastery-level" value={entry.mastery} label={MasteryLevelText[entry.mastery]} />
                      </div>
                      <p className="mistake-item__reason">
                        最近一次答错原因：
                        <MistakeReasonBadge reason={entry.latestWrong.mistake_reason} />
                        <span className="mistake-item__reason-text">
                          {entry.latestWrong.mistake_reason
                            ? MistakeReasonText[entry.latestWrong.mistake_reason]
                            : "—"}
                        </span>
                      </p>
                      <p className="mistake-item__meta">
                        错 {entry.wrong_count} 次 · 共答 {entry.total_count} 次 · 最近答错 {formatDate(entry.latestWrong.answered_at)}
                        {entry.marked_manual ? " · 已手动标记掌握" : ""}
                      </p>
                    </div>
                    <div className="mistake-item__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setExpanded(isOpen ? null : entry.symbol.id)}
                      >
                        {isOpen ? "收起历史" : "查看历史"}
                      </button>
                      {mastered ? (
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void store.unmark(entry.symbol.id)}>
                          取消掌握标记
                        </button>
                      ) : (
                        <>
                          <button type="button" className="btn btn--primary btn--sm" onClick={() => void startRetry([entry])}>
                            重练该符号
                          </button>
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => void store.mark(entry.symbol.id)}>
                            标记已掌握
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isOpen ? (
                    <div className="mistake-history">
                      <table>
                        <thead>
                          <tr>
                            <th>时间</th>
                            <th>题型</th>
                            <th>你的答案</th>
                            <th>结果</th>
                            <th>耗时</th>
                            <th>错误原因</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.history.map((record) => (
                            <tr key={record.id}>
                              <td>{formatDate(record.answered_at)}</td>
                              <td>{record.variant.replace(/_/g, " ")}</td>
                              <td>{record.user_answer}</td>
                              <td>
                                <ResultBadge
                                  correct={record.correct}
                                  neutral={false}
                                  text={record.correct ? "正确" : "错误"}
                                />
                              </td>
                              <td>{formatLatency(record.latency_ms)}</td>
                              <td>{record.mistake_reason ? MistakeReasonText[record.mistake_reason] : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="mistake-history__note">历史记录完整保留：重练答对只会把状态改为“已掌握”，不会删除任何答题记录。</p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        {selected.size > 0 ? (
          <div className="mistakes-bulkbar">
            已选 {selected.size} 个待掌握符号
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() =>
                void startRetry(store.entries.filter((entry) => selected.has(entry.symbol.id)))
              }
            >
              重练所选
            </button>
          </div>
        ) : null}
        {store.error ? <p className="form-error">{store.error}</p> : null}
      </section>
    </div>
  );
}
