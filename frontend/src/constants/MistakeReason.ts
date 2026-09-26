// 错题原因码：AnswerRecord.mistake_reason 存码，文案统一经 formatters 展开。
// 错题本按该码分组，重练结果也按该码回查，新增原因需同步 grading / formatter / 筛选项。
export const MistakeReason = [
  "NOT_ANSWERED",
  "WRONG_CHARACTER",
  "MISSING_DOT",
  "EXTRA_DOT",
  "DOT_MISMATCH"
] as const;
export type MistakeReason = (typeof MistakeReason)[number];
export const MistakeReasonText: Record<MistakeReason, string> = {
  NOT_ANSWERED: "未作答",
  WRONG_CHARACTER: "字符识别错误",
  MISSING_DOT: "缺少点位",
  EXTRA_DOT: "多余点位",
  DOT_MISMATCH: "点位不匹配"
};
