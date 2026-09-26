import type { Lesson } from "../types/Lesson";

export const createDefaultLesson = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 0,
  title: "",
  symbol_ids: [],
  stage: "入门",
  estimated_minutes: 10,
  unlock_rule: "开放注册即可学习",
  ...overrides
});

export const createLessonForm = createDefaultLesson;
export const createLessonResponse = createDefaultLesson;
