import { useCallback, useEffect, useState } from "react";

export type LayoutPreset = "split" | "focus" | "reading";

export interface EditorPrefs {
  fontSize: number;
  layout: LayoutPreset;
}

const KEY = "byteskill:coding-editor-prefs:v1";
const MIN = 11;
const MAX = 22;

const defaults = (): EditorPrefs => ({ fontSize: 14, layout: "split" });

const read = (): EditorPrefs => {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const v = JSON.parse(raw);
    const base = defaults();
    return {
      fontSize: typeof v.fontSize === "number" ? Math.min(MAX, Math.max(MIN, v.fontSize)) : base.fontSize,
      layout: v.layout === "focus" || v.layout === "reading" ? v.layout : "split",
    };
  } catch {
    return defaults();
  }
};

export const useEditorPrefs = () => {
  const [prefs, setPrefs] = useState<EditorPrefs>(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs]);

  const setFontSize = useCallback((size: number) => {
    setPrefs((p) => ({ ...p, fontSize: Math.min(MAX, Math.max(MIN, Math.round(size))) }));
  }, []);

  const incFontSize = useCallback(() => {
    setPrefs((p) => ({ ...p, fontSize: Math.min(MAX, p.fontSize + 1) }));
  }, []);

  const decFontSize = useCallback(() => {
    setPrefs((p) => ({ ...p, fontSize: Math.max(MIN, p.fontSize - 1) }));
  }, []);

  const setLayout = useCallback((layout: LayoutPreset) => {
    setPrefs((p) => ({ ...p, layout }));
  }, []);

  return { prefs, setFontSize, incFontSize, decFontSize, setLayout, MIN, MAX };
};
