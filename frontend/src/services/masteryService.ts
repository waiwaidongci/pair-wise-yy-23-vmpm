import type { AnswerRecord } from "../types/AnswerRecord";
import { MasteryLevel } from "../constants/MasteryLevel";
import type { MasteryLevel as MasteryLevelType } from "../types/MasteryLevel";
import { MASTERY_LOG_TEMPLATES } from "../constants/logTemplates";
import { logger } from "../utils/logger";

/**
 * 按时间序推导单个符号的掌握度（历史全部保留，只看“最近一次”结果）：
 * - 无记录               → NEW
 * - 最近一次答错          → LEARNING（错题本在册）
 * - 最近一次答对、曾答错   → FAMILIAR（重练答对即“已掌握”业务入口由错题本单独标记）
 * - 全部答对             → MASTERED
 */
export function deriveMastery(history: AnswerRecord[]): MasteryLevelType {
  if (history.length === 0) return MasteryLevel.NEW;
  const ordered = [...history].sort((a, b) => a.answered_at.localeCompare(b.answered_at));
  const latest = ordered[ordered.length - 1];
  const everWrong = ordered.some((record) => !record.correct);
  if (!latest.correct) return MasteryLevel.LEARNING;
  if (everWrong) return MasteryLevel.FAMILIAR;
  return MasteryLevel.MASTERED;
}

/**
 * 错题本“重练答对 → 已掌握”：最近一次答对且历史上出过错，即视为已掌握。
 * 与 deriveMastery 的区别：错题本语义里重练成功即 MASTERED（保留历史）。
 */
export function deriveMistakeMastery(history: AnswerRecord[], manualMastered: boolean): MasteryLevelType {
  if (history.length === 0) return MasteryLevel.NEW;
  const ordered = [...history].sort((a, b) => a.answered_at.localeCompare(b.answered_at));
  const latest = ordered[ordered.length - 1];
  const everWrong = ordered.some((record) => !record.correct);
  if (manualMastered) return MasteryLevel.MASTERED;
  if (!latest.correct) return MasteryLevel.LEARNING;
  if (everWrong) {
    logger.debug("service.mastery", MASTERY_LOG_TEMPLATES.derive({ id: latest.symbol_id, level: MasteryLevel.MASTERED }));
    return MasteryLevel.MASTERED;
  }
  return MasteryLevel.FAMILIAR;
}

export function groupRecordsBySymbol(records: AnswerRecord[]): Map<number, AnswerRecord[]> {
  const map = new Map<number, AnswerRecord[]>();
  [...records]
    .sort((a, b) => a.answered_at.localeCompare(b.answered_at))
    .forEach((record) => {
      const list = map.get(record.symbol_id) ?? [];
      list.push(record);
      map.set(record.symbol_id, list);
    });
  return map;
}
