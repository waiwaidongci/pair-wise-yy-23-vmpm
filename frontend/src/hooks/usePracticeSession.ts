import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePracticeFlowStore } from "../stores/practiceFlowStore";
import type { PracticeMode } from "../types/PracticeMode";

/**
 * 练习会话 hook：封装练习页与 store/controller 的交互，
 * 负责每题计时（latency_ms）、键盘 1-4 快捷作答。
 * 状态本体在 Zustand store，组件不持有业务 state。
 */
export function usePracticeSession() {
  const flow = usePracticeFlowStore();
  const questionStartRef = useRef<number>(Date.now());
  const [selected, setSelected] = useState<string | null>(null);

  const draft = flow.draft;
  const question = flow.questions[flow.currentIndex] ?? null;
  const existingAnswer = draft?.answers[flow.currentIndex] ?? null;
  const answered = Boolean(existingAnswer);
  const answeredCount = draft?.answers.filter(Boolean).length ?? 0;
  const allDone = Boolean(draft && answeredCount === draft.symbol_ids.length);

  useEffect(() => {
    questionStartRef.current = Date.now();
    setSelected(null);
  }, [flow.currentIndex, draft?.session_key]);

  const submit = useCallback(
    async (value: string) => {
      if (answered || !value) return;
      setSelected(value);
      const latency = Date.now() - questionStartRef.current;
      await flow.answer(value, latency);
    },
    [answered, flow]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!question || answered || flow.phase !== "active") return;
      const num = Number(event.key);
      if (num >= 1 && num <= question.options.length) {
        void submit(question.options[num - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, answered, flow.phase, submit]);

  const start = useCallback(
    async (params: { lessonId: number | null; mode: PracticeMode; symbolIds?: number[]; source: "LESSON" | "RETRY"; title: string }) => {
      await flow.start(params);
    },
    [flow]
  );

  return useMemo(
    () => ({
      phase: flow.phase,
      ready: flow.ready,
      draft,
      question,
      questions: flow.questions,
      index: flow.currentIndex,
      feedback: flow.feedback,
      result: flow.result,
      busy: flow.busy,
      error: flow.error,
      selected,
      answered,
      answeredCount,
      allDone,
      existingAnswer,
      init: flow.init,
      start,
      submit,
      next: flow.next,
      jumpTo: flow.jumpTo,
      finish: flow.finish,
      quit: flow.quit,
      dismissResult: flow.dismissResult
    }),
    [flow, draft, question, selected, answered, answeredCount, allDone, existingAnswer, start, submit]
  );
}