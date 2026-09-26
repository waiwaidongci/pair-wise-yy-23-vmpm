// 每个实体至少 4 条日志模板，所有写操作都必须经 utils/logger 记录。
// 模板按索引被 service 引用，字段或动作变更时必须同步调用处。
export const LOG_TEMPLATES = {
  BrailleSymbol: ["点字字符创建", "点字字符更新", "点字字符难度变更", "点字字符导入导出"],
  Lesson: ["课程创建", "课程更新", "课程解锁规则变更", "课程导入导出"],
  PracticeSession: ["练习会话开始（草稿创建）", "练习会话整组完成提交", "练习会话得分统计落库", "练习会话导出"],
  AnswerRecord: ["答题记录草稿暂存", "答题记录随会话批量生成", "答题记录掌握状态变更", "答题记录导出"],
  PracticeDraft: ["草稿创建", "草稿作答暂存", "草稿放弃", "草稿恢复续答"]
} as const;

export type LogEntity = keyof typeof LOG_TEMPLATES;
