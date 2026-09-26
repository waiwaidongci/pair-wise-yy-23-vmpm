import type { BrailleSymbol } from "../../types/BrailleSymbol";
import type { PracticeSession } from "../../types/PracticeSession";
import type { AnswerRecord } from "../../types/AnswerRecord";
import { BrailleCell } from "../common/BrailleCell";
import { ResultBadge } from "../common/ResultBadge";
import { PracticePanel } from "../common/PracticePanel";
import { formatDate, formatMistakeReason, formatPracticeMode, formatScore } from "../../utils/formatters";

interface SessionResultProps {
  session: PracticeSession;
  records: AnswerRecord[];
  symbols: BrailleSymbol[];
  onRetry: () => void;
  onClose: () => void;
}

// 整组完成后的结果页：数据此时才落库，错题本与学习进度随即可见。
export function SessionResult({ session, records, symbols, onRetry, onClose }: SessionResultProps) {
  const symbolMap = new Map(symbols.map((symbol) => [symbol.id, symbol]));
  return (
    <PracticePanel
      title="本组练习已完成"
      badge="SESSION_COMPLETED"
      footer={
        <>
          <button type="button" className="btn primary" onClick={onRetry}>再练一次本组</button>
          <button type="button" className="btn ghost" onClick={onClose}>返回选题</button>
        </>
      }
    >
      <div className="metrics inline">
        <div className="stat"><span>本次得分</span><strong>{formatScore(session.score)}</strong></div>
        <div className="stat"><span>错题数</span><strong>{session.mistake_count}</strong></div>
        <div className="stat"><span>练习模式</span><strong>{formatPracticeMode(session.mode)}</strong></div>
        <div className="stat"><span>完成时间</span><strong>{formatDate(session.finished_at)}</strong></div>
      </div>
      <div className="review-list">
        {records.map((record, index) => {
          const symbol = symbolMap.get(record.symbol_id);
          if (!symbol) return null;
          return (
            <article className="review-row" key={record.id}>
              <BrailleCell pattern={symbol.cell_pattern} size={26} />
              <div>
                <strong>第 {index + 1} 题 · {symbol.letter}</strong>
                <p>
                  你的答案 <code>{record.user_answer}</code>
                  {!record.correct && record.mistake_reason ? ` · ${formatMistakeReason(record.mistake_reason)}` : ""}
                  {" · "}耗时 {(record.latency_ms / 1000).toFixed(1)} 秒
                </p>
              </div>
              <ResultBadge correct={record.correct} reason={record.mistake_reason} />
            </article>
          );
        })}
      </div>
    </PracticePanel>
  );
}
