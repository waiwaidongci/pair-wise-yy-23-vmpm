import type { SymbolCategory } from "./SymbolCategory";
import type { Difficulty } from "./Difficulty";

/**
 * 点字字符：被课程 Lesson.symbol_ids、练习题、错题本、进度统计共同复用，
 * 贯穿 api/services/controllers/stores/components/pages。
 */
export interface BrailleSymbol {
  id: number;
  /** 六点盲文图案，取值 1-6 的点号升序，用 "-" 连接，空串为空格。编号：1·4 / 2·5 / 3·6 */
  cell_pattern: string;
  /** 对应明文字符，如 a / 1 / ，/ sh */
  letter: string;
  /** 拼音或读音提示，听写模式朗读该字段 */
  pinyin: string;
  category: SymbolCategory;
  difficulty: Difficulty;
  /** 语音资源键（本项目为本地 TTL key，不接入第三方服务） */
  audio_hint_key: string;
}
