import { useMemo, useState } from "react";
import { dotsToPattern, patternToDots } from "../utils/brailleDots";

// 据字拼点（TEXT_TO_CELL）交互：6 个点位可点击切换，也可直接输入点位串。
export function useBraillePattern(initialPattern = "000000") {
  const [dots, setDots] = useState<number[]>(() => patternToDots(initialPattern));

  const pattern = useMemo(() => dotsToPattern(dots), [dots]);

  const toggleDot = (dot: number) => {
    setDots((prev) => (prev.includes(dot) ? prev.filter((item) => item !== dot) : [...prev, dot].sort((a, b) => a - b)));
  };

  const setFromInput = (raw: string) => {
    const next = new Set<number>();
    for (const char of raw) {
      const dot = Number(char);
      if (dot >= 1 && dot <= 6) next.add(dot);
    }
    setDots([...next].sort((a, b) => a - b));
  };

  const reset = (nextPattern = initialPattern) => setDots(patternToDots(nextPattern));

  return { dots, pattern, toggleDot, setFromInput, reset };
}
