import { useEffect, useState } from "react";
import { ensureSeedData } from "../api/seed";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import { useLessonStore } from "../stores/LessonStore";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";
import { logger } from "../utils/logger";

type BootstrapState = "booting" | "ready" | "error";

/**
 * 应用启动：先播种 IndexedDB，再并行加载四个实体 store。
 * 草稿/最近结果由 practiceFlowStore.init() 在练习页按需恢复。
 */
export function useIndexedDbStore(): { state: BootstrapState; error: string | null; reload: () => void } {
  const [state, setState] = useState<BootstrapState>("booting");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const loadSymbols = useBrailleSymbolStore((s) => s.load);
  const loadLessons = useLessonStore((s) => s.load);
  const loadSessions = usePracticeSessionStore((s) => s.load);
  const loadRecords = useAnswerRecordStore((s) => s.load);

  useEffect(() => {
    let cancelled = false;
    setState("booting");
    ensureSeedData()
      .then(() => Promise.all([loadSymbols(), loadLessons(), loadSessions(), loadRecords()]))
      .then(() => {
        if (cancelled) return;
        setState("ready");
      })
      .catch((bootError) => {
        logger.error("hook.useIndexedDbStore", "本地数据启动失败", bootError);
        if (!cancelled) {
          setError(bootError instanceof Error ? bootError.message : "本地数据启动失败");
          setState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [nonce, loadSymbols, loadLessons, loadSessions, loadRecords]);

  return { state, error, reload: () => setNonce((value) => value + 1) };
}
