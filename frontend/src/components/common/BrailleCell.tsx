import { useBraillePattern } from "../../hooks/useBraillePattern";

interface BrailleCellProps {
  pattern: string;
  size?: "sm" | "md" | "lg";
  /** 已选点位（看字摆点反馈高亮） */
  selectedPattern?: string;
  showDotNumbers?: boolean;
  interactive?: boolean;
  onDotClick?: (dot: number) => void;
  label?: string;
}

/**
 * 六点盲文点阵：
 *  1 4
 *  2 5
 *  3 6
 */
export function BrailleCell({
  pattern,
  size = "md",
  selectedPattern,
  showDotNumbers = false,
  interactive = false,
  onDotClick,
  label
}: BrailleCellProps) {
  const { raised, dots } = useBraillePattern(pattern);
  const selected = useBraillePattern(selectedPattern ?? "");
  // 视觉列序：左列 1,2,3；右列 4,5,6
  const visualOrder = [1, 4, 2, 5, 3, 6];

  return (
    <div className={`braille-cell braille-cell--${size}`} role="img" aria-label={`盲文点位 ${dots.join("、") || "空方"}`}>
      <div className="braille-cell__grid">
        {visualOrder.map((dot) => {
          const isRaised = raised[dot - 1];
          const isSelected = selectedPattern ? selected.raised[dot - 1] : false;
          const stateClass = isRaised
            ? "braille-dot--raised"
            : isSelected
              ? "braille-dot--selected"
              : "braille-dot--flat";
          return (
            <button
              type="button"
              key={dot}
              disabled={!interactive}
              className={`braille-dot ${stateClass} ${interactive ? "braille-dot--interactive" : ""}`}
              onClick={() => onDotClick?.(dot)}
              aria-pressed={isRaised || isSelected}
            >
              {showDotNumbers ? dot : ""}
            </button>
          );
        })}
      </div>
      {label ? <span className="braille-cell__label">{label}</span> : null}
    </div>
  );
}
