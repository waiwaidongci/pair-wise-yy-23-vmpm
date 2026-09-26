/**
 * 练习模式枚举（常量定义位置）。
 * 类型镜像见 ../types/PracticeMode.ts；新增模式时必须同步：
 * types/PracticeMode、logTemplates、errorMessages、statusText、
 * constructors/PracticeSessionConstructor、controllers/practiceController、
 * PracticePage 模式筛选器、StatusBadge 展示。
 */
export const PracticeMode = {
  CELL_TO_TEXT: "CELL_TO_TEXT",
  TEXT_TO_CELL: "TEXT_TO_CELL",
  LISTENING: "LISTENING",
  MIXED: "MIXED"
} as const;

export type PracticeMode = (typeof PracticeMode)[keyof typeof PracticeMode];

export const PracticeModeList: PracticeMode[] = [
  PracticeMode.CELL_TO_TEXT,
  PracticeMode.TEXT_TO_CELL,
  PracticeMode.LISTENING,
  PracticeMode.MIXED
];

export const PracticeModeText: Record<PracticeMode, string> = {
  CELL_TO_TEXT: "看符识字",
  TEXT_TO_CELL: "看字摆点",
  LISTENING: "听音辨字",
  MIXED: "混合练习"
};

/** 每种模式对应的默认错题原因，答错时由 practiceController 写入 mistake_reason。 */
export const PracticeModeMistakeReason: Record<PracticeMode, string> = {
  CELL_TO_TEXT: "PATTERN_MISREAD",
  TEXT_TO_CELL: "DOT_MISPLACED",
  LISTENING: "LISTENING_MISHEARD",
  MIXED: "PATTERN_MISREAD"
};
