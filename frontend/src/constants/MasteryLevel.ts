/**
 * 掌握程度枚举（常量定义位置）。
 * 类型镜像见 ../types/MasteryLevel.ts。
 * NEW 未学 / LEARNING 学习中（最近一次答错）/ FAMILIAR 熟悉（最近答对但曾答错）/ MASTERED 已掌握。
 * 新增状态时必须同步：types/MasteryLevel、logTemplates、errorMessages、
 * statusText、services/masteryService、constructors/MasterySnapshotConstructor、
 * MistakesPage 筛选器、StatusBadge 展示样式。
 */
export const MasteryLevel = {
  NEW: "NEW",
  LEARNING: "LEARNING",
  FAMILIAR: "FAMILIAR",
  MASTERED: "MASTERED"
} as const;

export type MasteryLevel = (typeof MasteryLevel)[keyof typeof MasteryLevel];

export const MasteryLevelList: MasteryLevel[] = [
  MasteryLevel.NEW,
  MasteryLevel.LEARNING,
  MasteryLevel.FAMILIAR,
  MasteryLevel.MASTERED
];

export const MasteryLevelText: Record<MasteryLevel, string> = {
  NEW: "未学",
  LEARNING: "学习中",
  FAMILIAR: "熟悉",
  MASTERED: "已掌握"
};
