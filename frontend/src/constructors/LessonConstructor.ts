import type { Lesson } from "../types/Lesson";

export const createDefaultLesson = (overrides: Partial<Lesson> = {}): Lesson => ({
  id: 0,
  title: "",
  symbol_ids: [],
  stage: "STAGE_1",
  estimated_minutes: 10,
  unlock_rule: "free",
  ...overrides
});

export const createLessonForm = (overrides: Partial<Lesson> = {}): Lesson =>
  createDefaultLesson({ title: "新课程", ...overrides });

export const createLessonResponse = (raw: Partial<Lesson> & { id: number }): Lesson =>
  createDefaultLesson({
    ...raw,
    id: Number(raw.id),
    title: String(raw.title ?? ""),
    symbol_ids: Array.isArray(raw.symbol_ids) ? raw.symbol_ids.map(Number) : [],
    stage: String(raw.stage ?? "STAGE_1"),
    estimated_minutes: Number(raw.estimated_minutes ?? 10),
    unlock_rule: String(raw.unlock_rule ?? "free")
  });
