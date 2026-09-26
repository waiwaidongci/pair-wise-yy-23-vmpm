import type { PracticeMode } from "../constants/PracticeMode";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import { ERROR_CODES } from "../constants/errorCodes";
import { ServiceError } from "./errors";

// 听音辨字模式的本地语音模拟，无第三方 API；不支持 SpeechSynthesis 时静默降级为可重复播放按钮。
export function speakSymbol(symbol: BrailleSymbol) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(symbol.audio_hint_key);
  utter.lang = symbol.audio_hint_key === "0" ? "en-US" : "zh-CN";
  utter.rate = 0.8;
  window.speechSynthesis.speak(utter);
}

export function modePrompt(mode: PracticeMode): string {
  switch (mode) {
    case "CELL_TO_TEXT":
      return "看点阵，写出对应字符";
    case "TEXT_TO_CELL":
      return "看字符，填写凸起点位（如 1,3,5）";
    case "LISTENING":
      return "听读音，写出对应字符";
    case "MIXED":
      return "混合题目，按题目提示作答";
    default:
      throw new ServiceError(ERROR_CODES.UNSUPPORTED_PRACTICE_MODE);
  }
}
