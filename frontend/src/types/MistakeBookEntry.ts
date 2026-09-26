/** 错题本按点字符号聚合后的视图行（服务层推导，不落库）。 */
import type { BrailleSymbol } from "./BrailleSymbol";
import type { AnswerRecord } from "./AnswerRecord";
import type { MasteryLevel } from "./MasteryLevel";

export interface MistakeBookEntry {
  symbol: BrailleSymbol;
  mastery: MasteryLevel;
  /** 最近一次答错的记录（错题本展示“最近一次答错原因”） */
  latestWrong: AnswerRecord;
  wrong_count: number;
  total_count: number;
  history: AnswerRecord[];
  marked_manual: boolean;
}
