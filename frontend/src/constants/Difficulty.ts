/** 难度档位（BrailleSymbol.difficulty）。 */
export const Difficulty = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD"
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const DifficultyList: Difficulty[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];

export const DifficultyText: Record<Difficulty, string> = {
  EASY: "入门",
  MEDIUM: "进阶",
  HARD: "挑战"
};
