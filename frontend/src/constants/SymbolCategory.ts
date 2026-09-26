/**
 * 点字字符分类枚举（常量定义位置）。
 * 类型镜像见 ../types/SymbolCategory.ts；新增分类时必须同步：
 * types/SymbolCategory、logTemplates、errorMessages、statusText、
 * constructors/BrailleSymbolConstructor、LearnPage/MistakesPage 筛选器、
 * ChartPanel 难度/分类分布与 mocks/seedData 种子。
 */
export const SymbolCategory = {
  LETTER: "LETTER",
  NUMBER: "NUMBER",
  PUNCTUATION: "PUNCTUATION",
  CONTRACTION: "CONTRACTION"
} as const;

export type SymbolCategory = (typeof SymbolCategory)[keyof typeof SymbolCategory];

export const SymbolCategoryList: SymbolCategory[] = [
  SymbolCategory.LETTER,
  SymbolCategory.NUMBER,
  SymbolCategory.PUNCTUATION,
  SymbolCategory.CONTRACTION
];

export const SymbolCategoryText: Record<SymbolCategory, string> = {
  LETTER: "字母",
  NUMBER: "数字",
  PUNCTUATION: "标点",
  CONTRACTION: "简码"
};
