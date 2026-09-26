import { useEffect } from "react";
import { usePracticeStore } from "../stores/PracticeDraftStore";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import { useLessonStore } from "../stores/LessonStore";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";

// 练习模式编排 hook：
// - 挂载时恢复未完成草稿（离开/刷新后回来接着答）；
// - 整组完成后把新会话与答题记录灌入错题本/进度所消费的只读 store。
export function usePracticeSession() {
  const practice = usePracticeStore();
  const symbolStore = useBrailleSymbolStore();
  const lessonStore = useLessonStore();
  const sessionStore = usePracticeSessionStore();
  const recordStore = useAnswerRecordStore();

  useEffect(() => {
    void Promise.all([
      symbolStore.rows.length ? Promise.resolve() : symbolStore.load(),
      lessonStore.rows.length ? Promise.resolve() : lessonStore.load(),
      sessionStore.rows.length ? Promise.resolve() : sessionStore.load(),
      recordStore.rows.length ? Promise.resolve() : recordStore.load(),
      practice.restore()
    ]);
    // 仅挂载时执行一次恢复
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 完成后同步只读 store，让切到错题本/进度页立刻能看到新结果。
  useEffect(() => {
    if (!practice.lastCompleted) return;
    sessionStore.add(practice.lastCompleted.session);
    recordStore.addMany(practice.lastCompleted.records);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practice.lastCompleted]);

  return { practice, symbolStore, lessonStore, sessionStore, recordStore };
}
