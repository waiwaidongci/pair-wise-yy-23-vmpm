import { useEffect, useState } from "react";
import { createSymbolEntry, updateSymbolEntry } from "../controllers/symbolController";
import { BrailleCell } from "./common/BrailleCell";
import { SymbolCategoryList, SymbolCategoryText } from "../constants/SymbolCategory";
import { DifficultyList, DifficultyText } from "../constants/Difficulty";
import { toggleDot } from "../utils/braille";
import type { BrailleSymbol } from "../types/BrailleSymbol";
import type { SymbolCategory } from "../types/SymbolCategory";
import type { Difficulty } from "../types/Difficulty";

interface SymbolEditorProps {
  initial?: BrailleSymbol | null;
  onClose: () => void;
  onSaved: () => void;
}

/** 点字字符创建/编辑表单：点位可点击 1-6 组合。 */
export function SymbolEditor({ initial, onClose, onSaved }: SymbolEditorProps) {
  const [letter, setLetter] = useState(initial?.letter ?? "");
  const [pinyin, setPinyin] = useState(initial?.pinyin ?? "");
  const [pattern, setPattern] = useState(initial?.cell_pattern ?? "");
  const [category, setCategory] = useState<SymbolCategory>(initial?.category ?? SymbolCategoryList[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? DifficultyList[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async () => {
    setSaving(true);
    setError(null);
    const payload = {
      letter,
      pinyin: pinyin || letter,
      cell_pattern: pattern,
      category,
      difficulty,
      audio_hint_key: initial?.audio_hint_key ?? `custom:${letter}`
    };
    try {
      if (initial) await updateSymbolEntry(initial.id, payload);
      else await createSymbolEntry(payload);
      onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <h2>{initial ? "编辑点字字符" : "新增点字字符"}</h2>
        <div className="modal__grid">
          <label className="field">
            <span>字符</span>
            <input value={letter} maxLength={4} onChange={(event) => setLetter(event.target.value)} placeholder="如 a / 1 / 的" />
          </label>
          <label className="field">
            <span>拼音 / 读音</span>
            <input value={pinyin} onChange={(event) => setPinyin(event.target.value)} placeholder="如 dì" />
          </label>
          <label className="field">
            <span>分类（SymbolCategory）</span>
            <select value={category} onChange={(event) => setCategory(event.target.value as SymbolCategory)}>
              {SymbolCategoryList.map((value) => (
                <option key={value} value={value}>
                  {SymbolCategoryText[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>难度</span>
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
              {DifficultyList.map((value) => (
                <option key={value} value={value}>
                  {DifficultyText[value]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="modal__pattern">
          <div>
            <span className="field-label">点位（点击凸点组合，1·4 / 2·5 / 3·6）</span>
            <BrailleCell pattern={pattern} size="lg" interactive showDotNumbers onDotClick={(dot) => setPattern(toggleDot(pattern, dot))} />
          </div>
          <code className="modal__pattern-code">{pattern || "空方"}</code>
        </div>

        {error ? <p className="form-error">{error}</p> : null}
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn btn--primary" onClick={() => void save()} disabled={saving || !letter.trim()}>
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
