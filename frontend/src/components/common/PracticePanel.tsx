import { ResultBadge } from "./ResultBadge";
import { BrailleCell } from "./BrailleCell";
import { SpeakButton } from "../SpeakButton";
import type { PracticeQuestion } from "../../services/questionService";
import type { DraftAnswer } from "../../types/PracticeDraft";
import { PracticeModeText } from "../../constants/PracticeMode";
import { formatLatency } from "../../utils/formatters";

interface PracticePanelProps {
  question: PracticeQuestion;
  index: number;
  total: number;
  mode: string;
  feedback?: {
    correct: boolean;
    explanation: string;
    rightAnswer: string;
    userAnswer: string;
  } | null;
  existing?: DraftAnswer;
  busy?: boolean;
  onSubmit: (answer: string) => void;
  onNext: () => void;
  isLast: boolean;
}

const VARIANT_INSTRUCTION: Record<PracticeQuestion["variant"], string> = {
  CELL_TO_TEXT: "看点阵，选择它对应的字符",
  TEXT_TO_CELL: "看字符，选择正确的六点图案",
  LISTENING: "听读音，选择对应的字符"
};

/** 练习作答面板：题目、点阵、选项、即时反馈、下一题入口。 */
export function PracticePanel({
  question,
  index,
  total,
  mode,
  feedback,
  existing,
  busy,
  onSubmit,
  onNext,
  isLast
}: PracticePanelProps) {
  const answered = Boolean(existing) || Boolean(feedback);
  const shown = feedback ?? (existing
    ? {
        correct: existing.correct,
        explanation: existing.correct ? "回答正确！" : "这一题当时答错了（草稿保留中）",
        rightAnswer: question.options.includes(question.answer) ? question.answer : question.answer,
        userAnswer: existing.user_answer
      }
    : null);

  const renderOption = (option: string) => {
    const isAnswer = option === question.answer;
    const isPicked = shown?.userAnswer === option;
    let stateClass = "option-card";
    if (shown) {
      if (isAnswer) stateClass += " option-card--right";
      else if (isPicked) stateClass += " option-card--wrong";
    }
    return (
      <button
        type="button"
        key={option}
        className={stateClass}
        disabled={answered || busy}
        onClick={() => onSubmit(option)}
      >
        {question.variant === "TEXT_TO_CELL" ? (
          <BrailleCell pattern={option} size="sm" />
        ) : (
          <span className="option-card__char">{option}</span>
        )}
      </button>
    );
  };

  return (
    <div className="practice-panel">
      <div className="practice-panel__top">
        <span className="practice-panel__index">第 {index + 1} / {total} 题</span>
        <span className="practice-panel__mode">{PracticeModeText[mode as keyof typeof PracticeModeText] ?? mode}</span>
        <span className="practice-panel__variant">{VARIANT_INSTRUCTION[question.variant]}</span>
      </div>

      <div className="practice-panel__body">
        {question.variant === "TEXT_TO_CELL" ? (
          <div className="practice-panel__prompt">
            <span className="prompt-char">{question.symbol.letter}</span>
            <span className="prompt-hint">{question.symbol.pinyin}</span>
          </div>
        ) : question.variant === "LISTENING" ? (
          <div className="practice-panel__prompt practice-panel__prompt--listen">
            <span className="prompt-ear" aria-hidden>🔊</span>
            <SpeakButton text={question.symbol.pinyin} auto />
            <span className="prompt-hint">听音辨字：请根据读音选择对应字符</span>
          </div>
        ) : (
          <div className="practice-panel__prompt">
            <BrailleCell pattern={question.symbol.cell_pattern} size="lg" showDotNumbers />
          </div>
        )}

        <div className={`option-grid option-grid--${question.variant === "TEXT_TO_CELL" ? "patterns" : "chars"}`}>
          {question.options.map(renderOption)}
        </div>
      </div>

      {shown ? (
        <div className={`practice-panel__feedback ${shown.correct ? "is-correct" : "is-wrong"}`}>
          <ResultBadge correct={shown.correct} />
          <p className="feedback-explanation">
            {shown.explanation}
            {!shown.correct ? (
              <>
                {" "}
                正确答案：
                {question.variant === "TEXT_TO_CELL" ? (
                  <BrailleCell pattern={shown.rightAnswer} size="sm" />
                ) : (
                  <strong>{shown.rightAnswer}</strong>
                )}
              </>
            ) : null}
          </p>
          {existing && !feedback ? <span className="feedback-meta">耗时 {formatLatency(existing.latency_ms)}</span> : null}
          <button type="button" className="btn btn--primary" onClick={onNext} disabled={busy}>
            {isLast ? "查看整组结果" : "下一题"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
