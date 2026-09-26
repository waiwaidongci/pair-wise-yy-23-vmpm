import { listLesson } from "../api/Lesson";
import { wrapServiceError } from "../utils/errors";
import type { Lesson } from "../types/Lesson";
import type { BrailleSymbol } from "../types/BrailleSymbol";

export async function queryLessons(): Promise<Lesson[]> {
  try {
    const rows = await listLesson();
    return rows.sort((a, b) => a.id - b.id);
  } catch (error) {
    throw wrapServiceError("service.lesson", error);
  }
}

/** 解锁规则：free 直接开放；lesson:n 需要前置课程已有已完成会话（在 progressService 判定后由 controller 注入）。 */
export function isLessonUnlocked(lesson: Lesson, completedLessonIds: Set<number>): boolean {
  if (lesson.unlock_rule === "free") return true;
  const match = lesson.unlock_rule.match(/^lesson:(\d+)$/);
  if (!match) return false;
  return completedLessonIds.has(Number(match[1]));
}

export function symbolsOfLesson(lesson: Lesson, symbols: BrailleSymbol[]): BrailleSymbol[] {
  const map = new Map(symbols.map((symbol) => [symbol.id, symbol]));
  return lesson.symbol_ids.map((id) => map.get(id)).filter((s): s is BrailleSymbol => Boolean(s));
}
