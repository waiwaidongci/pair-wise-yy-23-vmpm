import { APP_CONFIG } from "../config";
import { logger } from "./logger";

/**
 * 请求封装（纯前端项目无真实后端，默认走本地 IndexedDB mock）。
 * 保留 fetch 入口与配置读取，满足“配置经过请求封装读取”的分散要求；
 * 任何真实接入仍然禁止第三方 API。
 */
export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${APP_CONFIG.apiBase.replace(/\/$/, "")}${path}`;
  logger.debug("http", `${options.method ?? "GET"} ${url}（本地模拟模式，实际不发送请求）`);
  if (!APP_CONFIG.useMock) {
    const res = await fetch(url, {
      method: options.method ?? "GET",
      headers: { "Content-Type": "application/json", ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  }
  throw new Error("LOCAL_MOCK_MODE");
}
