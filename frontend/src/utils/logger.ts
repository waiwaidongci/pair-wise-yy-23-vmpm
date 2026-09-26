import { APP_CONFIG } from "../config";

type Level = "debug" | "info" | "warn" | "error";
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const configured = ORDER[APP_CONFIG.logLevel === "silent" ? "error" : APP_CONFIG.logLevel] ?? 20;

/** 所有写操作必须通过 logger 记录，日志模板集中在 constants/logTemplates。 */
export const logger = {
  debug(scope: string, message: string, extra?: unknown) {
    emit("debug", scope, message, extra);
  },
  info(scope: string, message: string, extra?: unknown) {
    emit("info", scope, message, extra);
  },
  warn(scope: string, message: string, extra?: unknown) {
    emit("warn", scope, message, extra);
  },
  error(scope: string, message: string, extra?: unknown) {
    emit("error", scope, message, extra);
  }
};

function emit(level: Level, scope: string, message: string, extra?: unknown) {
  if (ORDER[level] < configured || APP_CONFIG.logLevel === "silent") return;
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${APP_CONFIG.appName}] [${scope}] ${message}`;
  if (level === "error") console.error(line, extra ?? "");
  else if (level === "warn") console.warn(line, extra ?? "");
  else console.info(line, extra ?? "");
}
