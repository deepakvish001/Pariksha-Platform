import { useCallback, useEffect, useState } from "react";

export interface EditorPrefs {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
}

const KEY = "assess.editor.prefs";
const DEFAULTS: EditorPrefs = { fontSize: 13, tabSize: 2, wordWrap: false };

function read(): EditorPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<EditorPrefs>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export function useEditorPrefs() {
  const [prefs, setPrefs] = useState<EditorPrefs>(() => read());

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* noop */
    }
  }, [prefs]);

  // Cross-tab + cross-component sync
  useEffect(() => {
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
