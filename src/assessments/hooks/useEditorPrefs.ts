import { useCallback, useEffect, useState } from "react";
import { safeStorage } from "../lib/safeStorage";

export interface EditorPrefs {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
}

const KEY = "assess.editor.prefs";
const DEFAULTS: EditorPrefs = { fontSize: 13, tabSize: 2, wordWrap: false };

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
