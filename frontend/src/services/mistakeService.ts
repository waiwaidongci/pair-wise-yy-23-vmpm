import type { AnswerRecord } from "../types/AnswerRecord";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { PracticeSession } from "../types/PracticeSession";
import type { MistakeEntry } from "../types/MistakeEntry";
import type { MistakeReason } from "../constants/MistakeReason";
import { resolveMastery } from "./masteryService";

// 错题本：
// 1) 只统计已完成会话（调用方传入的 sessions 已由 API 过滤 finished_at 非空）；
// 2) 按符号展示“最近一次”答错原因；
// 3) 重练答对（最近一条记录正确）→ 已掌握，不再列入错题本，但全部历史记录保留。
export function buildMistakeEntries(
  records: AnswerRecord[],
  sessions: PracticeSession[],
  symbols: BrailleSymbol[]
): MistakeEntry[] {
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const symbolMap = new Map(symbols.map((symbol) => [symbol.id, symbol]));

  const grouped = new Map<number, AnswerRecord[]>();
  for (const record of records) {
    const session = sessionMap.get(record.session_id);
    if (!session) continue; // 草稿记录不会出现在 answerRecord 表
    const list = grouped.get(record.symbol_id) ?? [];
    list.push(record);
    grouped.set(record.symbol_id, list);
  }

  const entries: MistakeEntry[] = [];
  for (const [symbolId, symbolRecords] of grouped) {
    const symbol = symbolMap.get(symbolId);
    if (!symbol) continue;
    const ordered = symbolRecords.sort((a, b) => {
      const ta = sessionMap.get(a.session_id)?.finished_at ?? "";
      const tb = sessionMap.get(b.session_id)?.finished_at ?? "";
      return ta.localeCompare(tb) || a.id - b.id;
    });
    const latestRecord = ordered[ordered.length - 1];
    if (latestRecord.correct) continue; // 重练已答对 → 已掌握，移出错题本
    const latestSession = sessionMap.get(latestRecord.session_id);
    if (!latestSession) continue;
    entries.push({
      symbol,
      latestRecord,
      latestSession,
      latestReason: (latestRecord.mistake_reason || "WRONG_CHARACTER") as MistakeReason,
      history: ordered.map((record) => ({ record, session: sessionMap.get(record.session_id) as PracticeSession })),
      mastery: resolveMastery(ordered)
    });
  }

  return entries.sort(
    (a, b) => b.latestSession.finished_at.localeCompare(a.latestSession.finished_at) || b.latestRecord.id - a.latestRecord.id
  );
}

// 供学习页展示全部符号的掌握状态（含已掌握但已移出错题本的符号，历史仍保留）。
export function buildMasteryMap(
  records: AnswerRecord[],
  sessions: PracticeSession[],
  symbols: BrailleSymbol[]
): Map<number, ReturnType<typeof resolveMastery>> {
  const entries = new Map<number, AnswerRecord[]>();
  const sessionIds = new Set(sessions.map((session) => session.id));
  for (const record of records) {
    if (!sessionIds.has(record.session_id)) continue;
    const list = entries.get(record.symbol_id) ?? [];
    list.push(record);
    entries.set(record.symbol_id, list);
  }
  const result = new Map<number, ReturnType<typeof resolveMastery>>();
  for (const symbol of symbols) {
    result.set(symbol.id, resolveMastery(entries.get(symbol.id) ?? []));
  }
  return result;
}
