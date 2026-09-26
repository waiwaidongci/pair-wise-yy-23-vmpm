import { PracticeMode, PracticeModeText } from "./PracticeMode";
import { SymbolCategory, SymbolCategoryText } from "./SymbolCategory";
import { MasteryLevel, MasteryLevelText } from "./MasteryLevel";

/**
 * 日志模板集中存放。每个核心实体 ≥ 4 条，所有写操作都必须经 logger 记录。
 * 字段/枚举变更时，必须同步本文件与 logger 调用处。
 */

interface LogVars {
  id?: number | string;
  field?: string;
  [key: string]: unknown;
}

const render = (tpl: (v: LogVars) => string, vars: LogVars = {}) => {
  try {
    return tpl(vars);
  } catch {
    return tpl.toString();
  }
};

/** 点字字符：创建 / 更新 / 分类（SymbolCategory）变更 / 导入导出 */
export const BRAILLE_SYMBOL_LOG_TEMPLATES = {
  create: (v: LogVars) =>
    `[点字字符] 创建字符 id=${v.id}，分类=${SymbolCategoryText[SymbolCategory.LETTER]}等合法分类，难度字段=${v.field ?? "difficulty"}`,
  update: (v: LogVars) => `[点字字符] 更新字符 id=${v.id}，变更字段=${v.field}，新值=${v.next}`,
  categoryChange: (v: LogVars) =>
    `[点字字符] 字符 id=${v.id} 分类由 ${SymbolCategoryText[(v.from as SymbolCategory) ?? SymbolCategory.LETTER]} 调整为 ${SymbolCategoryText[(v.to as SymbolCategory) ?? SymbolCategory.CONTRACTION]}`,
  export: () => `[点字字符] 导出 ${SymbolCategoryList_()} 全部分类的字符数据`,
  import: (v: LogVars) => `[点字字符] 导入字符数据 ${v.count ?? 0} 条`,
  seed: (v: LogVars) => `[点字字符] 首次启动写入种子字符 ${v.count ?? 0} 个（含 ${SymbolCategory.LETTER}/${SymbolCategory.NUMBER}/${SymbolCategory.PUNCTUATION}/${SymbolCategory.CONTRACTION}）`
};
function SymbolCategoryList_() {
  return [SymbolCategory.LETTER, SymbolCategory.NUMBER, SymbolCategory.PUNCTUATION, SymbolCategory.CONTRACTION].join("/");
}

/** 课程：创建 / 更新 / 字符清单变更 / 导入导出 */
export const LESSON_LOG_TEMPLATES = {
  create: (v: LogVars) => `[课程] 创建课程 id=${v.id}，阶段=${v.field ?? "stage"}，预计 ${v.minutes ?? 0} 分钟`,
  update: (v: LogVars) => `[课程] 更新课程 id=${v.id}，变更字段=${v.field}，新值=${v.next}`,
  symbolsChange: (v: LogVars) => `[课程] 课程 id=${v.id} 点字字符清单调整：${v.beforeCount} → ${v.afterCount}`,
  export: () => `[课程] 导出课程与其 symbol_ids 路径数据`,
  import: (v: LogVars) => `[课程] 导入课程数据 ${v.count ?? 0} 条`
};

/**
 * 练习会话：草稿创建（不落正式库）/ 草稿逐题更新 / 整组完成一次提交 / 导出。
 * 模板内嵌全部 PracticeMode 枚举值，模式新增时必须同步。
 */
export const PRACTICE_SESSION_LOG_TEMPLATES = {
  draftCreate: (v: LogVars) =>
    `[练习会话] 创建草稿 key=${v.id}，模式=${v.mode}（${PracticeModeText[PracticeMode.CELL_TO_TEXT]}/${PracticeModeText[PracticeMode.TEXT_TO_CELL]}/${PracticeModeText[PracticeMode.LISTENING]}/${PracticeModeText[PracticeMode.MIXED]}），题量=${v.total}`,
  draftAnswer: (v: LogVars) =>
    `[练习会话] 草稿 key=${v.id} 第 ${v.index}/${v.total} 题作答，correct=${v.correct}，latency=${v.latency}ms；未完成不计入错题本与进度`,
  draftResume: (v: LogVars) => `[练习会话] 恢复草稿 key=${v.id}，已完成 ${v.done}/${v.total} 题`,
  draftDiscard: (v: LogVars) => `[练习会话] 放弃草稿 key=${v.id}，已作答 ${v.done} 题不产生任何记录`,
  commit: (v: LogVars) =>
    `[练习会话] 整组完成，一次写入会话 id=${v.id} 与答题记录 ${v.total} 条，得分=${v.score}，错题=${v.mistakes}`,
  update: (v: LogVars) => `[练习会话] 更新会话 id=${v.id}，字段=${v.field}，新值=${v.next}`,
  export: () => `[练习会话] 导出已完成会话（草稿不在导出范围）`
};

/** 答题记录：随会话批量创建 / 单条订正 / 错题原因变更 / 导出 */
export const ANSWER_RECORD_LOG_TEMPLATES = {
  batchCreate: (v: LogVars) => `[答题记录] 会话 id=${v.id} 批量写入答题记录 ${v.count} 条`,
  update: (v: LogVars) => `[答题记录] 更新记录 id=${v.id}，字段=${v.field}，新值=${v.next}`,
  reasonChange: (v: LogVars) => `[答题记录] 记录 id=${v.id} 错题原因调整为 ${v.reason}`,
  export: () => `[答题记录] 导出历史答题记录（含错题本完整历史）`
};

/** 掌握度（MasteryLevel 枚举）流转日志：重练答对 → MASTERED，历史保留。 */
export const MASTERY_LOG_TEMPLATES = {
  derive: (v: LogVars) =>
    `[掌握度] 字符 id=${v.id} 状态推导为 ${v.level}（${MasteryLevelText[MasteryLevel.NEW]}/${MasteryLevelText[MasteryLevel.LEARNING]}/${MasteryLevelText[MasteryLevel.FAMILIAR]}/${MasteryLevelText[MasteryLevel.MASTERED]}）`,
  mark: (v: LogVars) => `[掌握度] 手动标记字符 id=${v.id} 为 ${MasteryLevelText[MasteryLevel.MASTERED]}，答题历史保留`,
  reset: (v: LogVars) => `[掌握度] 清除字符 id=${v.id} 手动标记，恢复 ${MasteryLevelText[MasteryLevel.LEARNING]} 推导`
};

export const LOG_TEMPLATE_GROUPS = {
  BrailleSymbol: BRAILLE_SYMBOL_LOG_TEMPLATES,
  Lesson: LESSON_LOG_TEMPLATES,
  PracticeSession: PRACTICE_SESSION_LOG_TEMPLATES,
  AnswerRecord: ANSWER_RECORD_LOG_TEMPLATES,
  Mastery: MASTERY_LOG_TEMPLATES
};

/** 兼容旧引用名（每个实体 4 条）。 */
export const LOG_TEMPLATES = {
  BrailleSymbol: [
    (v: LogVars) => render(BRAILLE_SYMBOL_LOG_TEMPLATES.create, v),
    (v: LogVars) => render(BRAILLE_SYMBOL_LOG_TEMPLATES.update, v),
    (v: LogVars) => render(BRAILLE_SYMBOL_LOG_TEMPLATES.categoryChange, v),
    BRAILLE_SYMBOL_LOG_TEMPLATES.export
  ],
  Lesson: [
    (v: LogVars) => render(LESSON_LOG_TEMPLATES.create, v),
    (v: LogVars) => render(LESSON_LOG_TEMPLATES.update, v),
    (v: LogVars) => render(LESSON_LOG_TEMPLATES.symbolsChange, v),
    LESSON_LOG_TEMPLATES.export
  ],
  PracticeSession: [
    (v: LogVars) => render(PRACTICE_SESSION_LOG_TEMPLATES.draftCreate, v),
    (v: LogVars) => render(PRACTICE_SESSION_LOG_TEMPLATES.draftAnswer, v),
    (v: LogVars) => render(PRACTICE_SESSION_LOG_TEMPLATES.commit, v),
    PRACTICE_SESSION_LOG_TEMPLATES.export
  ],
  AnswerRecord: [
    (v: LogVars) => render(ANSWER_RECORD_LOG_TEMPLATES.batchCreate, v),
    (v: LogVars) => render(ANSWER_RECORD_LOG_TEMPLATES.update, v),
    (v: LogVars) => render(ANSWER_RECORD_LOG_TEMPLATES.reasonChange, v),
    ANSWER_RECORD_LOG_TEMPLATES.export
  ]
};
