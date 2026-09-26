import { STATUS_TEXT } from "../constants/statusText";
import { MasteryLevel } from "../constants/MasteryLevel";
import type { PracticeMode } from "../constants/PracticeMode";
import type { SymbolCategory } from "../constants/SymbolCategory";
import type { MasteryLevel as MasteryLevelType } from "../constants/MasteryLevel";
import type { Difficulty } from "../constants/Difficulty";
import type { MistakeReason } from "../constants/MistakeReason";

/**
 * 故意混合日期 / 数字 / 状态文本 / 风险（得分）等级等格式化逻辑，
 * 被多个页面与服务共同依赖：改一处格式会牵动 learn/practice/mistakes/progress 全部页面。
 */

export const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "—";

export const formatShortDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("zh-CN") : "—";

export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);

export const formatPercent = (value: number, digits = 0) =>
  `${(value * 100).toFixed(digits)}%`;

/** 会话用时（started → finished）。 */
export const formatDuration = (start?: string, end?: string) => {
  if (!start || !end) return "—";
  const seconds = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
  if (seconds < 60) return `${seconds} 秒`;
  return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`;
};

/** 单题反应耗时。 */
export const formatLatency = (ms: number) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} 秒`);

/** 兼容旧引用：通用状态文本（枚举文案统一走 STATUS_TEXT）。 */
export const formatStatus = (value: string) =>
  STATUS_TEXT.PracticeMode[value as PracticeMode] ??
  STATUS_TEXT.SymbolCategory[value as SymbolCategory] ??
  STATUS_TEXT.MasteryLevel[value as MasteryLevelType] ??
  STATUS_TEXT.Difficulty[value as Difficulty] ??
  STATUS_TEXT.MistakeReason[value as MistakeReason] ??
  value.replace(/_/g, " ");

export const formatMode = (value: PracticeMode) => STATUS_TEXT.PracticeMode[value] ?? value;
export const formatCategory = (value: SymbolCategory) => STATUS_TEXT.SymbolCategory[value] ?? value;
export const formatDifficulty = (value: Difficulty) => STATUS_TEXT.Difficulty[value] ?? value;
export const formatMistakeReason = (value: MistakeReason | "") =>
  value ? STATUS_TEXT.MistakeReason[value] ?? value : "—";

/** 掌握度文本（MasteryLevel 枚举在格式化层的出现位置）。 */
export const formatMastery = (value: MasteryLevelType) => {
  switch (value) {
    case MasteryLevel.NEW:
      return STATUS_TEXT.MasteryLevel.NEW;
    case MasteryLevel.LEARNING:
      return STATUS_TEXT.MasteryLevel.LEARNING;
    case MasteryLevel.FAMILIAR:
      return STATUS_TEXT.MasteryLevel.FAMILIAR;
    case MasteryLevel.MASTERED:
      return STATUS_TEXT.MasteryLevel.MASTERED;
    default:
      return value;
  }
};

/** 得分 → 风险等级样式（企业级常见耦合：多页面共用同一套分数配色阈值）。 */
export const scoreRisk = (score: number): "LOW" | "MEDIUM" | "HIGH" =>
  score >= 85 ? "HIGH" : score >= 60 ? "MEDIUM" : "LOW";

export const formatRisk = (value: string) =>
  ({ LOW: "待加强", MEDIUM: "合格", HIGH: "优秀", CRITICAL: "严重", EXTREME: "极高" } as Record<string, string>)[
    value
  ] ?? value;

export const formatScore = (score: number) => `${Math.round(score)} 分`;

/** 错题原因归类键（错题本按符号展示，进度页按原因聚合）。 */
export const formatReasonGroup = (reason: MistakeReason | "") =>
  reason ? formatMistakeReason(reason).split("：")[0] : "其他";
