import { LOG_TEMPLATES, type LogEntity } from "../constants/logTemplates";

// 所有写操作统一走该日志器，模板集中在 constants/logTemplates。
export function logWrite(entity: LogEntity, templateIndex: number, detail?: unknown) {
  const tpl = LOG_TEMPLATES[entity][templateIndex] ?? `${entity} 写操作`;
  console.info(`[${new Date().toISOString()}] ${tpl}`, detail ?? "");
}

export function logRead(entity: string, detail?: unknown) {
  console.info(`[${new Date().toISOString()}] ${entity} 数据读取`, detail ?? "");
}
