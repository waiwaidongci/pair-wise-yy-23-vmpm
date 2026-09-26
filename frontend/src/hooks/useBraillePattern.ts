import { useMemo } from "react";
import { parsePattern, patternToDots, samePattern } from "../utils/braille";

/**
 * 点阵解析 hook：把 cell_pattern 转成六点布尔数组与可读点号。
 * 被 BrailleCell / PracticePanel / LearnPage / MistakesPage 共用。
 */
export function useBraillePattern(cellPattern: string) {
  return useMemo(() => {
    const dots = parsePattern(cellPattern);
    const raised = patternToDots(cellPattern);
    return {
      dots,
      raised,
      label: dots.length ? dots.join("、") : "空方",
      matches: (other: string) => samePattern(cellPattern, other)
    };
  }, [cellPattern]);
}
