import assert from "node:assert/strict";
import { ensureSeedData } from "../src/api/seed";
import { listPracticeSession } from "../src/api/PracticeSession";
import { listAnswerRecord } from "../src/api/AnswerRecord";
import { getDraft, getLastResult } from "../src/api/Meta";
import {
  startPractice,
  resumeDraft,
  answerQuestion,
  getQuestions,
  commitPractice,
  discardDraft
} from "../src/controllers/practiceController";
import { listMistakes, retryMistakes, markMastered } from "../src/controllers/mistakeController";
import { buildProgressOverview } from "../src/services/progressService";
import { PracticeMode } from "../src/constants/PracticeMode";

let passed = 0;
const check = (name: string, condition: boolean) => {
  assert.ok(condition, name);
  passed += 1;
  console.log(`  ✓ ${name}`);
};

async function main() {
  await ensureSeedData();
  const seededSessions = await listPracticeSession();
  const seededRecords = await listAnswerRecord();
  check("种子会话已写入", seededSessions.length >= 6);
  check("种子答题记录已写入", seededRecords.length >= 40);

  // 1. 开始课程 1 的练习
  let draft = await startPractice({ lessonId: 1, mode: PracticeMode.CELL_TO_TEXT, source: "LESSON", title: "" });
  check("草稿已创建", Boolean(draft.session_key));
  check("草稿题量来自课程", draft.symbol_ids.length === 10);

  // 2. 作答前 3 题（2 对 1 错），验证即时反馈与错误原因
  let questions = await getQuestions(draft);
  const q0 = questions[0];
  let r0 = await answerQuestion(draft, 0, q0.answer, 1000);
  check("第 1 题答对反馈", r0.feedback.correct === true);
  draft = r0.draft;

  const q1 = questions[1];
  const wrong1 = q1.options.find((option) => option !== q1.answer)!;
  let r1 = await answerQuestion(draft, 1, wrong1, 2000);
  check("第 2 题答错反馈", r1.feedback.correct === false);
  check("错误原因非空（CELL_TO_TEXT→点阵误读）", r1.feedback.mistakeReason === "PATTERN_MISREAD");
  check("错误解释包含正确答案", r1.feedback.explanation.length > 0 && r1.feedback.rightAnswer === q1.answer);
  draft = r1.draft;

  const q2 = questions[2];
  let r2 = await answerQuestion(draft, 2, q2.answer, 1500);
  draft = r2.draft;
  check("第 3 题已写入草稿", draft.answers.filter(Boolean).length === 3);

  // 3. 未完成期间：不计入错题本与进度（数量与种子一致）
  const midMistakes = await listMistakes();
  check("未完成不计入错题本（仍是种子数据）", midMistakes.every((entry) => entry.symbol.id <= 50));
  const midOverview = await buildProgressOverview();
  check("未完成不产生新会话", midOverview.completedSessions === seededSessions.length);

  // 模拟离开：草稿在 IDB meta 中仍存在
  const persisted = await getDraft();
  check("草稿已持久化到 IndexedDB", persisted?.session_key === draft.session_key);

  // 4. 下次回来接着答
  const resumed = await resumeDraft();
  check("续答恢复同一草稿", resumed?.session_key === draft.session_key);
  assert.ok(resumed);
  draft = resumed;
  check("续答时已答 3 题保留", draft.answers.filter(Boolean).length === 3);

  // 5. 答完剩余题（第 4 题故意答错，其余答对）
  questions = await getQuestions(draft);
  for (let index = 3; index < questions.length; index += 1) {
    const question = questions[index];
    const answer = index === 3 ? question.options.find((option) => option !== question.answer)! : question.answer;
    const result = await answerQuestion(draft, index, answer, 1200);
    draft = result.draft;
  }
  check("全部 10 题已答", draft.answers.filter(Boolean).length === 10);

  // 6. 整组完成一次提交
  const result = await commitPractice(draft);
  check("整组提交返回结算", result.total_count === 10 && result.mistake_count === 2);
  check("得分 = 80", result.score === 80);
  const draftAfterCommit = await getDraft();
  check("提交后草稿已清除", draftAfterCommit === undefined);
  const lastResult = await getLastResult();
  check("最近结果已缓存（切回页面可见）", lastResult?.session_id === result.session_id);

  const sessionsAfter = await listPracticeSession();
  const recordsAfter = await listAnswerRecord();
  check("一次写入 1 条新会话", sessionsAfter.length === seededSessions.length + 1);
  check("一次写入 10 条答题记录", recordsAfter.length === seededRecords.length + 10);

  // 7. 错题本：按符号聚合，最近一次答错原因
  const mistakes = await listMistakes();
  const bEntry = mistakes.find((entry) => entry.symbol.letter === "b");
  check("错题本包含本次答错的 b", Boolean(bEntry));
  check("b 的最近答错原因已记录", bEntry?.latestWrong.mistake_reason === "PATTERN_MISREAD");
  check("b 仍为学习中（未掌握）", bEntry?.mastery === "LEARNING");
  check("b 的历史完整保留", (bEntry?.total_count ?? 0) >= 2);

  // 8. 错题重练：只练 b（本次新错），整组答对 → MASTERED
  const retry = await retryMistakes(mistakes.filter((entry) => entry.mastery !== "MASTERED" && entry.symbol.letter === "b"));
  const retryQuestions = await getQuestions(retry);
  let work = retry;
  for (let index = 0; index < retryQuestions.length; index += 1) {
    const question = retryQuestions[index];
    const response = await answerQuestion(work, index, question.answer, 900);
    work = response.draft;
  }
  const retryResult = await commitPractice(work);
  check("错题重练整组完成", retryResult.mistake_count === 0 && retryResult.source === "RETRY");

  const mistakesAfterRetry = await listMistakes();
  const bAfter = mistakesAfterRetry.find((entry) => entry.symbol.letter === "b");
  check("重练答对后 b 标记为已掌握", bAfter?.mastery === "MASTERED");
  check("掌握后历史仍保留（含早期错误）", (bAfter?.history.length ?? 0) >= 3 && (bAfter?.wrong_count ?? 0) >= 1);

  // 9. 手动标记掌握
  await markMastered(mistakesAfterRetry[0].symbol.id);

  // 10. 进度：只按已完成会话统计
  const overview = await buildProgressOverview();
  check("已完成会话数增加 2（练习+重练）", overview.completedSessions === seededSessions.length + 2);
  check("课程完成率有效（0-1）", overview.lessonCompletionRate > 0 && overview.lessonCompletionRate <= 1);
  check("最近得分为最近一次会话 100", overview.latestScore === 100);
  check("得分趋势按时间排列", overview.scoreTrend.length === overview.completedSessions);
  check("错题原因分布包含点阵误读", overview.reasonDistribution.some((item) => item.reason === "PATTERN_MISREAD"));
  check("难度分布有统计", overview.difficultyDistribution.length >= 1);

  // 11. 放弃草稿不产生记录
  const abandoned = await startPractice({ lessonId: 2, mode: PracticeMode.MIXED, source: "LESSON", title: "" });
  const q = (await getQuestions(abandoned))[0];
  const partial = await answerQuestion(abandoned, 0, q.answer, 800);
  await discardDraft();
  check("放弃后草稿删除", (await getDraft()) === undefined);
  const finalSessions = await listPracticeSession();
  check("放弃草稿不产生会话", finalSessions.length === sessionsAfter.length + 1);

  console.log(`\n全部 ${passed} 项冒烟检查通过`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
