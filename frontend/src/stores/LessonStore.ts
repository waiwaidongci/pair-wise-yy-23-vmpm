import { create } from "zustand";
import { listLesson } from "../api/Lesson";
import { wrapServiceError } from "../utils/errors";
import { logger } from "../utils/logger";
import { isLessonUnlocked } from "../services/lessonService";
import type { Lesson } from "../types/Lesson";

type State = {
  rows: Lesson[];
  loading: boolean;
  error: string | null;
  /** 已完成课程 id 集合，由 PracticeSessionStore/进度数据回填后判定解锁 */
  completedLessonIds: Set<number>;
  load: () => Promise<void>;
  setCompletedLessons: (ids: Iterable<number>) => void;
  isUnlocked: (lesson: Lesson) => boolean;
};

export const useLessonStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  error: null,
  completedLessonIds: new Set<number>(),
  async load() {
    set({ loading: true, error: null });
    try {
      set({ rows: await listLesson(), loading: false });
    } catch (error) {
      const wrapped = wrapServiceError("store.Lesson", error);
      logger.error("store.Lesson", wrapped.message);
      set({ loading: false, error: wrapped.message });
    }
  },
  setCompletedLessons: (ids) => set({ completedLessonIds: new Set(ids) }),
  isUnlocked: (lesson) => isLessonUnlocked(lesson, get().completedLessonIds)
}));
