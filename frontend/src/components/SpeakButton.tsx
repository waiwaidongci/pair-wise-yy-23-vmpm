import { useEffect, useState } from "react";

/** 使用浏览器本地语音合成朗读拼音（无第三方 API；不支持时仅显示按钮）。 */
export function SpeakButton({ text, auto = false }: { text: string; auto?: boolean }) {
  const [supported, setSupported] = useState(true);

  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (auto) {
      const timer = window.setTimeout(speak, 250);
      return () => window.clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, auto]);

  if (!supported) return <span className="speak-hint">🔊 {text}（当前浏览器不支持朗读）</span>;
  return (
    <button type="button" className="btn btn--ghost" onClick={speak}>
      🔊 播放读音
    </button>
  );
}
