import { getManualMastered, saveManualMastered } from "../api/Meta";
import { queryMistakeBook } from "../services/mistakeService";
import { startPractice } from "./practiceController";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { MASTERY_LOG_TEMPLATES } from "../constants/logTemplates";
import { MasteryLevel } from "../constants/MasteryLevel";
import { AppError, wrapControllerError } from "../utils/errors";
import { logger } from "../utils/logger";
import { PracticeMode } from "../constants/PracticeMode";
import type { MistakeBookEntry } from "../types/MistakeBookEntry";
import type { MistakeFilter } from "../services/mistakeService";
import type { PracticeDraft } from "../types/PracticeDraft";

/** 错题本列表（按符号聚合，最近一次答错原因，历史保留）。 */
export async function listMistakes(filter: MistakeFilter = {}): Promise<MistakeBookEntry[]> {
  try {
    return await queryMistakeBook(filter);
  } catch (error) {
    throw wrapControllerError("controller.mistake", error);
  }
}

/** 错题重练：只练仍然 LEARNING 的符号，整组答对后由答题记录自动推导为已掌握。 */
export async function retryMistakes(entries: MistakeBookEntry[]): Promise<PracticeDraft> {
  try {
    const targets = entries.filter((entry) => entry.mastery !== MasteryLevel.MASTERED);
    if (targets.length === 0) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, "controller", "所选错题均已掌握，无需重练");
    }
    return await startPractice({
      lessonId: null,
      mode: PracticeMode.MIXED,
      symbolIds: targets.map((entry) => entry.symbol.id),
      source: "RETRY",
      title: `错题重练（${targets.length} 个符号）`
    });
  } catch (error) {
    throw wrapControllerError("controller.mistake", error);
  }
}

/** 手动标记已掌握（答题历史完整保留，仅在 meta 区打标）。 */
export async function markMastered(symbolId: number): Promise<void> {
  try {
    const ids = new Set(await getManualMastered());
    ids.add(symbolId);
    await saveManualMastered([...ids]);
    logger.info("controller.mistake", MASTERY_LOG_TEMPLATES.mark({ id: symbolId }));
  } catch (error) {
    throw wrapControllerError("controller.mistake", error, ERROR_CODES.MASTERY_MARK_CONFLICT);
  }
}

export async function unmarkMastered(symbolId: number): Promise<void> {
  try {
    const ids = (await getManualMastered()).filter((id) => id !== symbolId);
    await saveManualMastered(ids);
    logger.info("controller.mistake", MASTERY_LOG_TEMPLATES.reset({ id: symbolId }));
  } catch (error) {
    throw wrapControllerError("controller.mistake", error, ERROR_CODES.MASTERY_MARK_CONFLICT);
  }
}

export { ERROR_MESSAGES };
