export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  // 练习模式链路相关错误消息
  DRAFT_NOT_FOUND: "未找到未完成的练习草稿",
  ANSWER_NOT_IN_DRAFT: "当前题目不在草稿会话中，无法记录作答",
  SESSION_INCOMPLETE: "本组还有题目未作答，完成后才能生成练习会话",
  UNSUPPORTED_PRACTICE_MODE: "不支持的练习模式，请重新选择",
  UNSUPPORTED_SYMBOL_CATEGORY: "点字字符分类不在支持范围内",
  LESSON_EMPTY: "该课程没有可练习的点字字符",
  GRADE_FAILED: "作答判定失败，请重试本题",
  DB_ERROR: "本地数据库读写失败，请刷新后重试",
  DEPENDENCY_FAILED: "练习服务依赖的数据层调用失败"
} as const;
