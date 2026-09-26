import { useState } from "react";
import type { BrailleSymbol } from "../../types/BrailleSymbol";
import type { DraftAnswer } from "../../types/PracticeDraft";
import { BrailleCell } from "../common/BrailleCell";
import { ResultBadge } from "../common/ResultBadge";
import { useBraillePattern } from "../../hooks/useBraillePattern";
import { dotsToPattern } from "../../utils/brailleDots";
import { speakSymbol } from "../../utils/speech";
import { formatMistakeReason } from "../../utils/formatters";

interface QuestionCardProps {
  answer: DraftAnswer;
  index: number;
  total: number;
  symbol: BrailleSymbol;
  busy: boolean;
  onSubmit: (raw: string) => void;
}

// 单题作答 + 即时反馈：提交后先看到对错与错误原因，题目留在当前草稿可重做。
export function QuestionCard({ answer, index, total, symbol, busy, onSubmit }: QuestionCardProps) {
  const answered = answer.user_answer !== "";
  const [editing, setEditing] = useState(!answered);
  const [text, setText] = useState(answer.user_answer !== "" && answer.mode !== "TEXT_TO_CELL" ? answer.user_answer : "");
  const dotPicker = useBraillePattern("000000");

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const raw = answer.mode === "TEXT_TO_CELL" ? dotPicker.dots.join(",") : text;
    if (!raw.trim()) return;
    onSubmit(raw);
    setEditing(false);
  };

  const redo = () => {
    setText("");
    dotPicker.reset("000000");
    setEditing(true);
  };

  return (
    <div className="question-card">
      <div className="question-index">第 {index + 1} / {total} 题</div>
      <div className="question-main">
        {answer.mode === "CELL_TO_TEXT" && (
          <div className="question-prompt">
            <BrailleCell pattern={symbol.cell_pattern} size={52} />
            <p>观察点阵，写出对应字符</p>
          </div>
        )}
        {answer.mode === "LISTENING" && (
          <div className="question-prompt">
            <button type="button" className="btn primary" onClick={() => speakSymbol(symbol)}>
              🔊 播放读音
            </button>
            <p>听读音，写出对应字符（英文字母或汉语拼音均可）</p>
          </div>
        )}
        {answer.mode === "TEXT_TO_CELL" && (
          <div className="question-prompt">
            <span className="big-letter">{symbol.letter}</span>
            <p>点击点位拼出该字符的点阵</p>
            <BrailleCell pattern={dotsToPattern(dotPicker.dots)} size={44} active onToggleDot={dotPicker.toggleDot} />
          </div>
        )}
      </div>

      {editing ? (
        <form className="answer-form" onSubmit={submit}>
          {answer.mode !== "TEXT_TO_CELL" && (
            <input
              className="answer-input"
              value={text}
              placeholder="输入答案后回车"
              onChange={(event) => setText(event.target.value)}
              autoFocus
            />
          )}
          <button type="submit" className="btn primary" disabled={busy}>
            提交答案
          </button>
        </form>
      ) : (
        <div className="answer-feedback">
          <ResultBadge correct={answer.correct} reason={answer.mistake_reason} />
          <div className="answer-detail">
            <span>你的答案：<code>{answer.user_answer || "未作答"}</code></span>
            {!answer.correct && (
              <span>
                正确答案：
                <code>{answer.mode === "TEXT_TO_CELL" ? symbol.cell_pattern.split("").flatMap((bit, i) => (bit === "1" ? [String(i + 1)] : [])).join(",") : symbol.letter}</code>
                {answer.mistake_reason ? `（${formatMistakeReason(answer.mistake_reason)}）` : ""}
              </span>
            )}
          </div>
          <button type="button" className="btn ghost" onClick={redo}>重新作答本题</button>
        </div>
      )}
    </div>
  );
}
