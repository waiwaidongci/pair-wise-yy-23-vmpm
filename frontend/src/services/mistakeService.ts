import { listAnswerRecord } from "../api/AnswerRecord";
import { listBrailleSymbol } from "../api/BrailleSymbol";
import { getManualMastered } from "../api/Meta";
import { wrapServiceError } from "../utils/errors";
import { deriveMistakeMastery, groupRecordsBySymbol } from "./masteryService";
import { MasteryLevel } from "../constants/MasteryLevel";
import type { MistakeBookEntry } from "../types/MistakeBookEntry";
import type { MistakeReason } from "../types/MistakeReason";
import type { MasteryLevel as MasteryLevelType } from "../types/MasteryLevel";

export interface MistakeFilter {
  reason?: MistakeReason | "ALL";
  mastery?: MasteryLevelType | "ALL";
  keyword?: string;
}

/**
 * 错题本视图：按点字符号聚合。
 * 只收录“历史上至少答错一次”的符号；每条展示最近一次答错原因；
 * 重练答对后 mastery=MASTERED（历史保留，默认折叠在“已掌握”筛选后）。
 */
export async function queryMistakeBook(filter: MistakeFilter = {}): Promise<MistakeBookEntry[]> {
  try {
    const [records, symbols, manualMasteredIds] = await Promise.all([
      listAnswerRecord(),
      listBrailleSymbol(),
      getManualMastered()
    ]);
    const symbolMap = new Map(symbols.map((symbol) => [symbol.id, symbol]));
    const grouped = groupRecordsBySymbol(records);
    const entries: MistakeBookEntry[] = [];

    grouped.forEach((history, symbolId) => {
      if (!history.some((record) => !record.correct)) return; // 没答错过就不进错题本
      const symbol = symbolMap.get(symbolId);
      if (!symbol) return;
      const ordered = [...history].sort((a, b) => b.answered_at.localeCompare(a.answered_at));
      const latestWrong = ordered.find((record) => !record.correct)!;
      const mastery = deriveMistakeMastery(history, manualMasteredIds.includes(symbolId));
      entries.push({
        symbol,
        mastery,
        latestWrong,
        wrong_count: history.filter((record) => !record.correct).length,
        total_count: history.length,
        history: ordered,
        marked_manual: manualMasteredIds.includes(symbolId)
      });
    });

    return entries
      .filter((entry) => (filter.reason && filter.reason !== "ALL" ? entry.latestWrong.mistake_reason === filter.reason : true))
      .filter((entry) => (filter.mastery && filter.mastery !== "ALL" ? entry.mastery === filter.mastery : true))
      .filter((entry) =>
        filter.keyword ? entry.symbol.letter.includes(filter.keyword) || entry.symbol.pinyin.includes(filter.keyword) : true
      )
      .sort((a, b) => {
        if (a.mastery !== b.mastery) {
          const order = [MasteryLevel.LEARNING, MasteryLevel.FAMILIAR, MasteryLevel.MASTERED, MasteryLevel.NEW];
          return order.indexOf(a.mastery) - order.indexOf(b.mastery);
        }
        return b.latestWrong.answered_at.localeCompare(a.latestWrong.answered_at);
      });
  } catch (error) {
    throw wrapServiceError("service.mistake", error);
  }
}
