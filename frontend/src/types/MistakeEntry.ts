import type { MistakeReason } from "../constants/MistakeReason";
import type { MasteryLevel } from "../constants/MasteryLevel";
import type { BrailleSymbol } from "./BrailleSymbol";
import type { AnswerRecord } from "./AnswerRecord";
import type { PracticeSession } from "./PracticeSession";

// 错题本按 symbol 聚合的一条：展示最近一次答错原因，history 保留全部历史记录。
export interface MistakeEntry {
  symbol: BrailleSymbol;
  latestRecord: AnswerRecord;
  latestSession: PracticeSession;
  latestReason: MistakeReason;
  history: Array<{ record: AnswerRecord; session: PracticeSession }>;
  mastery: MasteryLevel;
}
