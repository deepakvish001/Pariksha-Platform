import { useCallback, useEffect, useState } from "react";
import { safeStorage } from "../lib/safeStorage";

export interface EditorPrefs {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  /** Multiplier applied to question body text (1 = 100%). */
  questionFontScale: number;
}

const KEY = "assess.editor.prefs";
const DEFAULTS: EditorPrefs = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: false,
  questionFontScale: 1,
};

/** Discrete zoom levels cycled by the A− / A+ buttons. */
export const QUESTION_FONT_SCALES = [0.9, 1, 1.15, 1.3] as const;

function read(): EditorPrefs {
  const raw = safeStorage.get(KEY);
  if (!raw) return DEFAULTS;
  try {
    const parsed = JSON.parse(raw) as Partial<EditorPrefs>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export function useEditorPrefs() {
  const [prefs, setPrefs] = useState<EditorPrefs>(() => read());

  useEffect(() => {
    safeStorage.set(KEY, JSON.stringify(prefs));
  }, [prefs]);

  // Cross-tab + cross-component sync (only fires when real localStorage works)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setPrefs(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch: Partial<EditorPrefs>) => {
    setPrefs((p) => ({ ...p, ...patch }));
  }, []);

  return { prefs, update };
}
