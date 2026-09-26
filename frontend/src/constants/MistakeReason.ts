/**
 * 错题原因枚举：错题本按“点字符号”聚合时，展示该符号最近一次答错的原因。
 * 原因由 practiceController 在判错时按题型写入 AnswerRecord.mistake_reason。
 */
export const MistakeReason = {
  PATTERN_MISREAD: "PATTERN_MISREAD",
  DOT_MISPLACED: "DOT_MISPLACED",
  LISTENING_MISHEARD: "LISTENING_MISHEARD",
  UNKNOWN_REASON: "UNKNOWN_REASON"
} as const;

export type MistakeReason = (typeof MistakeReason)[keyof typeof MistakeReason];

export const MistakeReasonList: MistakeReason[] = [
  MistakeReason.PATTERN_MISREAD,
  MistakeReason.DOT_MISPLACED,
  MistakeReason.LISTENING_MISHEARD,
  MistakeReason.UNKNOWN_REASON
];

export const MistakeReasonText: Record<MistakeReason, string> = {
  PATTERN_MISREAD: "点阵误读：把凸点位置认成了别的字符",
  DOT_MISPLACED: "点位错放：漏点/多点或左右列位置颠倒",
  LISTENING_MISHEARD: "听音偏差：读音与拼音对应错误",
  UNKNOWN_REASON: "未知原因"
};
