import type { AnswerRecord } from "../types/AnswerRecord";
import type { MasteryLevel } from "../constants/MasteryLevel";

// 掌握度规则（错题本“重练答对 → 已掌握，保留历史”由本规则派生，不另建覆盖表）：
// - 无任何答错记录：NEW
// - 最近一条记录答错：LEARNING
// - 最近一条答对且历史曾答错：MASTERED
export function resolveMastery(records: AnswerRecord[], orderedTimes: string[] = []): MasteryLevel {
  if (records.length === 0) return "NEW";
  const sorted = [...records].sort((a, b) => a.id - b.id);
  const everWrong = sorted.some((record) => !record.correct);
  if (!everWrong) {
    // 只有全对记录时视为 FAMILIAR（学过且熟悉）；NEW 保留给完全没练过。
    return "FAMILIAR";
  }
  const latest = sorted[sorted.length - 1];
  void orderedTimes;
  return latest.correct ? "MASTERED" : "LEARNING";
}
