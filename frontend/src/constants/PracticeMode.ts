export const PracticeMode = ["CELL_TO_TEXT", "TEXT_TO_CELL", "LISTENING", "MIXED"] as const;
export type PracticeMode = (typeof PracticeMode)[number];
export const PracticeModeText: Record<PracticeMode, string> = {
  CELL_TO_TEXT: "看形辨字",
  TEXT_TO_CELL: "据字拼点",
  LISTENING: "听音辨字",
  MIXED: "混合练习"
};
