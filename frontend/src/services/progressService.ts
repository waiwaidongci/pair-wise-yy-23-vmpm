import type { AnswerRecord } from "../types/AnswerRecord";
import type { Lesson } from "../types/Lesson";
import type { PracticeSession } from "../types/PracticeSession";
import type { ProgressSummary } from "../types/ProgressSummary";

// 学习进度只按“已完成会话”统计，草稿不参与。
export function buildProgressSummary(
  lessons: Lesson[],
  sessions: PracticeSession[],
  records: AnswerRecord[]
): ProgressSummary {
  const finished = sessions
    .filter((session) => Boolean(session.finished_at))
    .sort((a, b) => a.finished_at.localeCompare(b.finished_at) || a.id - b.id);

  const byLesson = new Map<number, PracticeSession[]>();
  for (const session of finished) {
    const list = byLesson.get(session.lesson_id) ?? [];
    list.push(session);
    byLesson.set(session.lesson_id, list);
  }

  const lessonStats = lessons.map((lesson) => {
    const list = byLesson.get(lesson.id) ?? [];
    const last = list.length ? list[list.length - 1] : null;
    return {
      lesson_id: lesson.id,
      title: lesson.title,
      completed: list.length > 0,
      lastScore: last ? last.score : null,
      finishedAt: last ? last.finished_at : null,
      sessions: list
    };
  });

  const completedLessonCount = lessonStats.filter((stat) => stat.completed).length;
  const lastSession = finished.length ? finished[finished.length - 1] : null;

  const sessionIds = new Set(finished.map((session) => session.id));
  const sessionRecords = records.filter((record) => sessionIds.has(record.session_id));
  const correctCount = sessionRecords.filter((record) => record.correct).length;

  return {
    lessonCount: lessons.length,
    completedLessonCount,
    completionRate: lessons.length ? (completedLessonCount / lessons.length) * 100 : 0,
    overallLastScore: lastSession ? lastSession.score : null,
    totalSessions: finished.length,
    overallAccuracy: sessionRecords.length ? (correctCount / sessionRecords.length) * 100 : null,
    lessonStats,
    recentSessions: [...finished].reverse().slice(0, 8)
  };
}

// 会话得分（完成提交时计算）：百分制，按正确率取整。
export function calculateScore(records: Array<{ correct: boolean }>): {
  score: number;
  mistake_count: number;
} {
  const total = records.length;
  const mistakeCount = records.filter((record) => !record.correct).length;
  return {
    score: total ? Math.round(((total - mistakeCount) / total) * 100) : 0,
    mistake_count: mistakeCount
  };
}
