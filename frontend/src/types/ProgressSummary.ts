import type { PracticeSession } from "./PracticeSession";

export interface LessonProgressStat {
  lesson_id: number;
  title: string;
  completed: boolean;
  lastScore: number | null;
  finishedAt: string | null;
  sessions: PracticeSession[];
}

export interface ProgressSummary {
  lessonCount: number;
  completedLessonCount: number;
  completionRate: number; // 0-100
  overallLastScore: number | null; // 最近一次完成会话得分
  totalSessions: number;
  overallAccuracy: number | null; // 0-100
  lessonStats: LessonProgressStat[];
  recentSessions: PracticeSession[];
}
