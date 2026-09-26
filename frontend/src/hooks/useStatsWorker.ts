import { useEffect, useRef, useState } from "react";
import type { PracticeSession } from "../types/PracticeSession";
import type { AnswerRecord } from "../types/AnswerRecord";
import type { BrailleSymbol } from "../types/BrailleSymbol";

export interface WorkerStats {
  totalSessions: number;
  latestScore: number | null;
  averageScore: number | null;
  correctRate: number;
  scoreTrend: Array<{ label: string; score: number; at: string }>;
  reasons: Array<{ reason: string; count: number }>;
  difficulty: Array<{ difficulty: string; total: number; correct: number }>;
}

/**
 * 耗时统计放入 Web Worker（workers/statsWorker.ts）。
 * Worker 不可用（旧浏览器/构建裁剪）时返回 null，由调用方走主线程统计。
 */
export function useStatsWorker(input: { sessions: PracticeSession[]; records: AnswerRecord[]; symbols: BrailleSymbol[] } | null) {
  const workerRef = useRef<Worker | null>(null);
  const [stats, setStats] = useState<WorkerStats | null>(null);

  useEffect(() => {
    if (!input) return undefined;
    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL("../workers/statsWorker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent<WorkerStats>) => setStats(event.data);
      worker.postMessage(input);
    } catch {
      workerRef.current = null;
    }
    return () => {
      worker?.terminate();
      workerRef.current = null;
    };
  }, [input]);

  return stats;
}
