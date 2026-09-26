/** 课程：组织点字字符学习路径，学习进度按已完成会话统计课程完成率。 */
export interface Lesson {
  id: number;
  title: string;
  symbol_ids: number[];
  /** 学习阶段，如 STAGE_1 */
  stage: string;
  estimated_minutes: number;
  /** 解锁规则描述，如 "free" / "lesson:1" */
  unlock_rule: string;
}
