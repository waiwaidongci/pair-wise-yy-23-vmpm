import { listBrailleSymbol } from "../api/BrailleSymbol";
import { listLesson } from "../api/Lesson";
import { listPracticeSession } from "../api/PracticeSession";
import { listAnswerRecord } from "../api/AnswerRecord";
import { idb, STORE_NAMES } from "../utils/db";
import { querySymbols, importSymbols } from "../services/symbolService";
import { createLessonResponse } from "../constructors/LessonConstructor";
import { createPracticeSessionResponse } from "../constructors/PracticeSessionConstructor";
import { createAnswerRecordResponse } from "../constructors/AnswerRecordConstructor";
import { wrapControllerError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";
import { AppError } from "../utils/errors";
import {
  BRAILLE_SYMBOL_LOG_TEMPLATES,
  LESSON_LOG_TEMPLATES,
  PRACTICE_SESSION_LOG_TEMPLATES,
  ANSWER_RECORD_LOG_TEMPLATES
} from "../constants/logTemplates";
import { logger } from "../utils/logger";

/** 导出全部本地数据（草稿不导出）。 */
export async function exportAllData(): Promise<string> {
  try {
    const [symbols, lessons, sessions, records] = await Promise.all([
      querySymbols(),
      listLesson(),
      listPracticeSession(),
      listAnswerRecord()
    ]);
    logger.info("controller.data", BRAILLE_SYMBOL_LOG_TEMPLATES.export());
    logger.info("controller.data", LESSON_LOG_TEMPLATES.export());
    logger.info("controller.data", PRACTICE_SESSION_LOG_TEMPLATES.export());
    logger.info("controller.data", ANSWER_RECORD_LOG_TEMPLATES.export());
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        brailleSymbol: symbols,
        lesson: lessons,
        practiceSession: sessions.filter((session) => session.finished_at),
        answerRecord: records
      },
      null,
      2
    );
  } catch (error) {
    throw wrapControllerError("controller.data", error, ERROR_CODES.EXPORT_FAILED);
  }
}

export async function downloadDataBackup(): Promise<void> {
  const content = await exportAllData();
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `braille-trainer-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** 导入备份：四类实体按构造器归一化后整体写入（字符/课程走 upsert，会话/记录幂等按 id 合并）。 */
export async function importDataBackup(file: File): Promise<{ symbols: number; lessons: number; sessions: number; records: number }> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as {
      brailleSymbol?: unknown[];
      lesson?: unknown[];
      practiceSession?: unknown[];
      answerRecord?: unknown[];
    };
    if (!parsed || typeof parsed !== "object") {
      throw new AppError(ERROR_CODES.IMPORT_FAILED, "controller", "文件不是合法的备份 JSON");
    }
    const symbolCount = await importSymbols((parsed.brailleSymbol ?? []) as never[]);

    const lessons = (parsed.lesson ?? [])
      .filter((row): row is Partial<(typeof parsed.lesson)> & object => typeof row === "object" && row !== null && "id" in row)
      .map((row) => createLessonResponse(row as never));
    const sessions = (parsed.practiceSession ?? [])
      .filter((row): row is object => typeof row === "object" && row !== null && "id" in row)
      .map((row) => createPracticeSessionResponse(row as never));
    const records = (parsed.answerRecord ?? [])
      .filter((row): row is object => typeof row === "object" && row !== null && "id" in row)
      .map((row) => createAnswerRecordResponse(row as never));

    if (lessons.length) await idb.putMany(STORE_NAMES.lessons, lessons);
    if (sessions.length) await idb.putMany(STORE_NAMES.sessions, sessions);
    if (records.length) await idb.putMany(STORE_NAMES.records, records);

    return { symbols: symbolCount, lessons: lessons.length, sessions: sessions.length, records: records.length };
  } catch (error) {
    throw wrapControllerError("controller.data", error, ERROR_CODES.IMPORT_FAILED);
  }
}
