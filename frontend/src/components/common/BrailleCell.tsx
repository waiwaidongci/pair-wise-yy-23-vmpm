import { patternToDots } from "../../utils/brailleDots";

interface BrailleCellProps {
  pattern: string;
  size?: number;
  active?: boolean; // 是否可点击（据字拼点模式）
  onToggleDot?: (dot: number) => void;
}

// 六点制盲文：左列 1/2/3，右列 4/5/6。
export function BrailleCell({ pattern, size = 44, active = false, onToggleDot }: BrailleCellProps) {
  const raised = new Set(patternToDots(pattern));
  const columns: Array<[number, number, number]> = [
    [1, 2, 3],
    [4, 5, 6]
  ];
  return (
    <div className={`braille-cell ${active ? "interactive" : ""}`} role="img" aria-label={`盲文点阵 ${[...raised].join(",") || "空"}`}>
      {columns.map((column, columnIndex) => (
        <div className="braille-col" key={columnIndex}>
          {column.map((dot) => (
            <button
              type="button"
              key={dot}
              aria-label={`点位 ${dot}`}
              aria-pressed={raised.has(dot)}
              disabled={!active}
              className={`braille-dot ${raised.has(dot) ? "raised" : ""}`}
              style={{ width: size, height: size }}
              onClick={() => onToggleDot?.(dot)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
