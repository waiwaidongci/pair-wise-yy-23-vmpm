import type { PracticeSession } from "../types/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";
import type { BrailleSymbol } from "../types/BrailleSymbol";

interface StatsInput {
  sessions: PracticeSession[];
  records: AnswerRecord[];
  symbols: BrailleSymbol[];
}

/** 耗时统计放入 Web Worker：课程完成率相关原始量、最近得分、原因/难度分布。 */
function computeStats(input: StatsInput) {
  const sessions = input.sessions
    .filter((session) => session.finished_at)
    .sort((a, b) => a.finished_at.localeCompare(b.finished_at));

  const correct = input.records.filter((record) => record.correct).length;
  const reasonMap = new Map<string, number>();
  input.records
    .filter((record) => !record.correct && record.mistake_reason)
    .forEach((record) => reasonMap.set(record.mistake_reason ?? "", (reasonMap.get(record.mistake_reason ?? "") ?? 0) + 1));

  const symbolMap = new Map(input.symbols.map((symbol) => [symbol.id, symbol]));
  const difficultyMap = new Map<string, { total: number; correct: number }>();
  input.records.forEach((record) => {
    const symbol = symbolMap.get(record.symbol_id);
    if (!symbol) return;
    const bucket = difficultyMap.get(symbol.difficulty) ?? { total: 0, correct: 0 };
    bucket.total += 1;
    if (record.correct) bucket.correct += 1;
    difficultyMap.set(symbol.difficulty, bucket);
  });

  return {
    totalSessions: sessions.length,
    latestScore: sessions.length ? sessions[sessions.length - 1].score : null,
    averageScore: sessions.length ? Math.round(sessions.reduce((sum, session) => sum + session.score, 0) / sessions.length) : null,
    correctRate: input.records.length ? correct / input.records.length : 0,
    scoreTrend: sessions.map((session, index) => ({ label: `第 ${index + 1} 次`, score: session.score, at: session.finished_at })),
    reasons: [...reasonMap.entries()].map(([reason, count]) => ({ reason, count })),
    difficulty: [...difficultyMap.entries()].map(([difficulty, value]) => ({ difficulty, ...value }))
  };
}

declare const self: DedicatedWorkerGlobalScope;
interface DedicatedWorkerGlobalScope {
  onmessage: ((event: MessageEvent<StatsInput>) => void) | null;
  postMessage(message: unknown): void;
}

self.onmessage = (event: MessageEvent<StatsInput>) => {
  self.postMessage(computeStats(event.data));
};

export {};
