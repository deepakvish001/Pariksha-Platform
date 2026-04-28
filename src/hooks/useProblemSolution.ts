import { useCallback, useEffect, useRef, useState } from "react";
import type { LangId } from "@/data/codingProblemsData";

const KEY = "byteskill:coding-my-solution:v1";

export interface SolutionEntry {
  notes: string;
  code: Partial<Record<LangId, string>>;
  updatedAt: number;
}

type SolutionMap = Record<string, SolutionEntry>;

const readMap = (): SolutionMap => {
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

const writeMap = (map: SolutionMap) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
};

const empty: SolutionEntry = { notes: "", code: {}, updatedAt: 0 };

/**
 * Per-slug "My Solution" — stores a markdown writeup plus the user's final
 * solution code per language. Autosaves with a 700ms debounce.
 */
export const useProblemSolution = (slug: string | undefined, language: LangId) => {
  const [entry, setEntry] = useState<SolutionEntry>(() =>
    slug ? readMap()[slug] ?? empty : empty,
  );
  const [savedAt, setSavedAt] = useState<number | null>(() =>
    slug && readMap()[slug]?.updatedAt ? readMap()[slug].updatedAt : null,
  );
  const debounceRef = useRef<number | null>(null);
  const pendingRef = useRef<SolutionEntry | null>(null);

  // Reload when slug changes
  useEffect(() => {
    if (!slug) {
      setEntry(empty);
      setSavedAt(null);
      return;
    }
    const v = readMap()[slug] ?? empty;
    setEntry(v);
    setSavedAt(v.updatedAt || null);
  }, [slug]);

  const flush = useCallback(() => {
    if (!slug || !pendingRef.current) return;
    const map = readMap();
    const next = { ...pendingRef.current, updatedAt: Date.now() };
    const isEmpty =
      !next.notes.trim() &&
      Object.values(next.code).every((c) => !c || !c.trim());
    if (isEmpty) delete map[slug];
    else map[slug] = next;
    writeMap(map);
    setSavedAt(next.updatedAt);
    pendingRef.current = null;
  }, [slug]);

  const schedule = useCallback(
    (next: SolutionEntry) => {
      pendingRef.current = next;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(flush, 700);
    },
    [flush],
  );

  const setNotes = useCallback(
    (notes: string) => {
      setEntry((prev) => {
        const next = { ...prev, notes };
        schedule(next);
        return next;
      });
    },
    [schedule],
  );

  const setCode = useCallback(
    (code: string) => {
      setEntry((prev) => {
        const next = { ...prev, code: { ...prev.code, [language]: code } };
        schedule(next);
        return next;
      });
    },
    [schedule, language],
  );

  // Flush on unmount / slug change
  useEffect(
    () => () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        flush();
      }
    },
    [flush],
  );

  const clear = useCallback(() => {
    if (!slug) return;
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    pendingRef.current = null;
    const map = readMap();
    delete map[slug];
    writeMap(map);
    setEntry({ notes: "", code: {}, updatedAt: 0 });
    setSavedAt(null);
  }, [slug]);

  const savedLanguages = (Object.keys(entry.code) as LangId[]).filter(
    (k) => (entry.code[k] ?? "").trim().length > 0,
  );
  const hasNotes = entry.notes.trim().length > 0;
  const hasAnyCode = savedLanguages.length > 0;

  return {
    notes: entry.notes,
    code: entry.code[language] ?? "",
    allCode: entry.code,
    savedLanguages,
    savedAt,
    setNotes,
    setCode,
    clear,
    hasContent: hasNotes || hasAnyCode,
    hasNotes,
    hasAnyCode,
    /** True when both a notes writeup and at least one code solution are saved. */
    isComplete: hasNotes && hasAnyCode,
  };
};
