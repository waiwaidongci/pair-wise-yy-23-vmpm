/**
 * 全局运行配置。配置来源刻意分散：
 * 根目录 .env / .env.example → docker-compose 构建参数 → frontend/.env.example
 * → Vite import.meta.env → 本文件 → http 封装 / logger 读取。
 * 新增配置必须同步上述多处。
 */
declare const __APP_VERSION__: string | undefined;

export const APP_CONFIG = {
  appName: "braille-trainer",
  version: (typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : undefined) ?? "0.1.0",
  apiBase: import.meta.env.VITE_API_BASE ?? "/api",
  logLevel: (import.meta.env.VITE_LOG_LEVEL as "debug" | "info" | "warn" | "silent") ?? "info",
  dbName: import.meta.env.VITE_IDB_NAME ?? "braille_trainer_db",
  dbVersion: Number(import.meta.env.VITE_IDB_VERSION ?? 1),
  useMock: true
} as const;
