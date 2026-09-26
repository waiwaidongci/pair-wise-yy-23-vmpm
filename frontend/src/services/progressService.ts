import { listPracticeSession } from "../api/PracticeSession";
import { listAnswerRecord } from "../api/AnswerRecord";
import { listLesson } from "../api/Lesson";
import { listBrailleSymbol } from "../api/BrailleSymbol";
import { wrapServiceError } from "../utils/errors";
import type { PracticeSession } from "../types/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";
import type { Lesson } from "../types/Lesson";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { MistakeReason } from "../types/MistakeReason";
import type { Difficulty } from "../types/Difficulty";

export interface LessonProgressStat {
  lesson: Lesson;
  completed: boolean;
  session_count: number;
  latest_score: number | null;
  best_score: number | null;
  average_score: number | null;
  latest_finished_at: string | null;
}

export interface ProgressOverview {
  sessions: PracticeSession[];
  records: AnswerRecord[];
  lessons: Lesson[];
  symbols: BrailleSymbol[];
  /** 已完成会话数（未完成草稿不计入） */
  completedSessions: number;
  /** 课程完成率：至少有一次已完成会话的课程 / 全部课程 */
  lessonCompletionRate: number;
  completedLessonCount: number;
  /** 最近一次得分 */
  latestScore: number | null;
  averageScore: number | null;
  overallCorrectRate: number;
  lessonStats: LessonProgressStat[];
  scoreTrend: Array<{ label: string; score: number; at: string }>;
  reasonDistribution: Array<{ reason: MistakeReason; count: number }>;
  difficultyDistribution: Array<{ difficulty: Difficulty; total: number; correct: number }>;
}

/**
 * 学习进度：严格只统计已完成会话（PracticeSession.finished_at 非空）。
 * 练习草稿永远不出现在这里。
 */
export async function buildProgressOverview(): Promise<ProgressOverview> {
  try {
    const [sessionsRaw, records, lessons, symbols] = await Promise.all([
      listPracticeSession(),
      listAnswerRecord(),
      listLesson(),
      listBrailleSymbol()
    ]);
    const sessions = sessionsRaw
      .filter((session) => session.finished_at)
      .sort((a, b) => a.finished_at.localeCompare(b.finished_at));

    const completedSet = new Set<number>();
    const lessonStats: LessonProgressStat[] = lessons
      .sort((a, b) => a.id - b.id)
      .map((lesson) => {
        const own = sessions.filter((session) => session.lesson_id === lesson.id);
        own.forEach((session) => completedSet.add(lesson.id));
        const scores = own.map((session) => session.score);
        return {
          lesson,
          completed: own.length > 0,
          session_count: own.length,
          latest_score: own.length ? own[own.length - 1].score : null,
          best_score: scores.length ? Math.max(...scores) : null,
          average_score: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
          latest_finished_at: own.length ? own[own.length - 1].finished_at : null
        };
      });

    const totalAnswered = records.length;
    const totalCorrect = records.filter((record) => record.correct).length;

    const wrongRecords = records.filter((record) => !record.correct);
    const reasonCounts = new Map<MistakeReason, number>();
    wrongRecords.forEach((record) => {
      if (!record.mistake_reason) return;
      reasonCounts.set(record.mistake_reason, (reasonCounts.get(record.mistake_reason) ?? 0) + 1);
    });

    const symbolMap = new Map(symbols.map((symbol) => [symbol.id, symbol]));
    const difficultyMap = new Map<Difficulty, { total: number; correct: number }>();
    records.forEach((record) => {
      const symbol = symbolMap.get(record.symbol_id);
      if (!symbol) return;
      const bucket = difficultyMap.get(symbol.difficulty) ?? { total: 0, correct: 0 };
      bucket.total += 1;
      if (record.correct) bucket.correct += 1;
      difficultyMap.set(symbol.difficulty, bucket);
    });

    const scoreTrend = sessions.map((session, index) => ({
      label: `第 ${index + 1} 次`,
      score: session.score,
      at: session.finished_at
    }));

    return {
      sessions,
      records,
      lessons,
      symbols,
      completedSessions: sessions.length,
      lessonCompletionRate: lessons.length ? completedSet.size / lessons.length : 0,
      completedLessonCount: completedSet.size,
      latestScore: sessions.length ? sessions[sessions.length - 1].score : null,
      averageScore: sessions.length
        ? Math.round(sessions.reduce((sum, session) => sum + session.score, 0) / sessions.length)
        : null,
      overallCorrectRate: totalAnswered ? totalCorrect / totalAnswered : 0,
      lessonStats,
      scoreTrend,
      reasonDistribution: [...reasonCounts.entries()].map(([reason, count]) => ({ reason, count })),
      difficultyDistribution: [...difficultyMap.entries()].map(([difficulty, value]) => ({ difficulty, ...value }))
    };
  } catch (error) {
    throw wrapServiceError("service.progress", error);
  }
}
