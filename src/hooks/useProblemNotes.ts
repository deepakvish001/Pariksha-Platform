import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "parikshaa:coding-problem-notes:v1";

const readMap = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
};

const writeMap = (map: Record<string, string>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

/**
 * Local-only personal markdown notes per problem slug.
 * Autosaves with a 700ms debounce. Returns the latest persisted note plus
 * a save status used to show "Saved Xs ago" indicators.
 */
export const useProblemNotes = (slug: string | undefined) => {
  const [note, setNote] = useState<string>(() =>
    slug ? readMap()[slug] ?? "" : "",
  );
  const [savedAt, setSavedAt] = useState<number | null>(() => (note ? Date.now() : null));
  const debounceRef = useRef<number | null>(null);

  // When slug changes (navigation), reload from storage.
  useEffect(() => {
    if (!slug) {
      setNote("");
      setSavedAt(null);
      return;
    }
    const v = readMap()[slug] ?? "";
    setNote(v);
    setSavedAt(v ? Date.now() : null);
  }, [slug]);

  const update = useCallback(
    (value: string) => {
      setNote(value);
      if (!slug) return;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        const map = readMap();
        if (value) map[slug] = value;
        else delete map[slug];
        writeMap(map);
        setSavedAt(Date.now());
      }, 700);
    },
    [slug],
  );

  useEffect(
    () => () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    },
    [],
  );

  return { note, setNote: update, savedAt };
};

/** Read all notes (used by list page search). */
export const readAllProblemNotes = (): Record<string, string> => readMap();
