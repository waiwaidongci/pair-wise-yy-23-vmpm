import { MistakeReasonText, type MistakeReason } from "../constants/MistakeReason";
import { SymbolCategoryText } from "../constants/SymbolCategory";
import { MasteryLevelText } from "../constants/MasteryLevel";
import { PracticeModeText } from "../constants/PracticeMode";

export const formatDate = (value: string) => (value ? new Date(value).toLocaleString("zh-CN") : "-");
export const formatStatus = (value: string) => value.replace(/_/g, " ");
export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);
// 沿用风险等级格式化，供难度星级以外的复用场景
export const formatRisk = (value: string) => ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" }[value] ?? value);

export const formatPercent = (value: number | null) => (value === null ? "-" : `${Math.round(value)}%`);
export const formatScore = (value: number | null) => (value === null ? "-" : `${Math.round(value)} 分`);
export const formatDifficulty = (stars: number) => "★".repeat(stars) + "☆".repeat(Math.max(0, 3 - stars));
export const formatCategory = (value: string) => SymbolCategoryText[value as keyof typeof SymbolCategoryText] ?? value;
export const formatMastery = (value: string) => MasteryLevelText[value as keyof typeof MasteryLevelText] ?? value;
export const formatPracticeMode = (value: string) => PracticeModeText[value as keyof typeof PracticeModeText] ?? value;
export const formatMistakeReason = (value: MistakeReason | "") => (value ? MistakeReasonText[value] : "");
