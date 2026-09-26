import { PracticeModeList, PracticeModeText } from "./PracticeMode";
import { SymbolCategoryList, SymbolCategoryText } from "./SymbolCategory";
import { MasteryLevelList, MasteryLevelText } from "./MasteryLevel";
import { DifficultyList, DifficultyText } from "./Difficulty";
import { MistakeReasonList, MistakeReasonText } from "./MistakeReason";

/**
 * 状态文案聚合点：页面筛选器、StatusBadge、ChartPanel、formatters 统一从这里取文案。
 * 新增枚举值时必须同步本文件。
 */
export const STATUS_TEXT = {
  PracticeMode: PracticeModeText,
  SymbolCategory: SymbolCategoryText,
  MasteryLevel: MasteryLevelText,
  Difficulty: DifficultyText,
  MistakeReason: MistakeReasonText
};

export const STATUS_FILTER_OPTIONS = {
  PracticeMode: PracticeModeList.map((value) => ({ value, label: PracticeModeText[value] })),
  SymbolCategory: SymbolCategoryList.map((value) => ({ value, label: SymbolCategoryText[value] })),
  MasteryLevel: MasteryLevelList.map((value) => ({ value, label: MasteryLevelText[value] })),
  Difficulty: DifficultyList.map((value) => ({ value, label: DifficultyText[value] })),
  MistakeReason: MistakeReasonList.map((value) => ({ value, label: MistakeReasonText[value] }))
};
