import { ERROR_CODES } from "./errorCodes";
import { PracticeModeList, PracticeModeText } from "./PracticeMode";
import { SymbolCategoryList, SymbolCategoryText } from "./SymbolCategory";
import { MasteryLevelList, MasteryLevelText } from "./MasteryLevel";
import { MistakeReasonText } from "./MistakeReason";

/** 错误消息模板集中定义；service/controller 分别包装并补充上下文。 */
export const ERROR_MESSAGES: Record<keyof typeof ERROR_CODES, string> = {
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  STORE_UNAVAILABLE: "本地数据库（IndexedDB）不可用，请检查浏览器隐私模式设置",
  NOT_FOUND: "目标记录不存在或已被移除",
  DRAFT_NOT_FOUND: "未找到可继续的练习草稿",
  DRAFT_ALREADY_FINISHED: "该组练习已完成，无法继续写入草稿",
  QUESTION_INDEX_INVALID: "题目序号超出当前练习范围",
  LESSON_EMPTY: "课程没有包含任何点字字符，无法开始练习",
  LESSON_LOCKED: "课程尚未解锁，请先完成前置课程",
  MODE_UNSUPPORTED: `不支持的练习模式，可选模式：${PracticeModeList.map((m) => PracticeModeText[m]).join("、")}`,
  MASTERY_MARK_CONFLICT: `掌握状态只能在 ${MasteryLevelList.map((m) => MasteryLevelText[m]).join(" / ")} 之间流转`,
  EXPORT_FAILED: "导出练习数据失败",
  IMPORT_FAILED: `导入失败：仅支持字母(${Object.values(SymbolCategoryText).join("/")})等合法分类数据`,
  SEED_FAILED: "初始化本地示例数据失败"
};

/** 错题原因 → 面向学生的错误解释（即时反馈与错题本共用）。 */
export const MISTAKE_REASON_HINT: Record<string, string> = {
  PATTERN_MISREAD: MistakeReasonText.PATTERN_MISREAD,
  DOT_MISPLACED: MistakeReasonText.DOT_MISPLACED,
  LISTENING_MISHEARD: MistakeReasonText.LISTENING_MISHEARD,
  UNKNOWN_REASON: MistakeReasonText.UNKNOWN_REASON
};

/** 按练习模式给出的判错补充说明。 */
export const MODE_ERROR_SUFFIX: Record<string, string> = {
  CELL_TO_TEXT: `（${PracticeModeText.CELL_TO_TEXT}：先定左右列，再数上下点号）`,
  TEXT_TO_CELL: `（${PracticeModeText.TEXT_TO_CELL}：左列 1/2/3，右列 4/5/6）`,
  LISTENING: `（${PracticeModeText.LISTENING}：注意听完整拼音再选择）`,
  MIXED: `（${PracticeModeText.MIXED}：先判断题型再作答）`
};
