import { useCallback, useEffect, useRef, useState } from "react";
import type { LangId } from "@/data/codingProblemsData";

const KEY = "byteskill:coding-my-solution:v1";

export interface SolutionEntry {
  notes: string;
  code: Partial<Record<LangId, string>>;
  /** Per-language last-saved timestamps (ms epoch). */
  codeUpdatedAt?: Partial<Record<LangId, number>>;
  /** When the notes block was last saved. */
  notesUpdatedAt?: number;
  /** Most recent overall save (any field). */
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

const empty: SolutionEntry = {
  notes: "",
  code: {},
  codeUpdatedAt: {},
  notesUpdatedAt: undefined,
  updatedAt: 0,
};

type DirtyMark = "notes" | { code: LangId };

/**
 * Per-slug "My Solution" — stores a markdown writeup plus the user's final
 * solution code per language. Autosaves with a 700ms debounce. Tracks
 * per-language timestamps and supports clear+restore for an undo flow.
 */
export const useProblemSolution = (slug: string | undefined, language: LangId) => {
  const [entry, setEntry] = useState<SolutionEntry>(() =>
    slug ? readMap()[slug] ?? empty : empty,
  );
  const [savedAt, setSavedAt] = useState<number | null>(() =>
    slug && readMap()[slug]?.updatedAt ? readMap()[slug].updatedAt : null,
  );
  /** Tracks unsaved changes since the last flush. */
  const [dirty, setDirty] = useState<{
    notes: boolean;
    code: Partial<Record<LangId, boolean>>;
  }>({ notes: false, code: {} });
  /**
   * One-step previous-code buffer per language. Updated whenever setCode
   * changes that language's value, so a subsequent undoCodeChange restores
   * the prior content for just that language.
   */
  const [undoBuffer, setUndoBuffer] = useState<Partial<Record<LangId, string>>>(
    {},
  );

  const debounceRef = useRef<number | null>(null);
  const pendingRef = useRef<SolutionEntry | null>(null);
  const dirtyMarksRef = useRef<Set<string>>(new Set());

  // Reload when slug changes
  useEffect(() => {
    if (!slug) {
      setEntry(empty);
      setSavedAt(null);
      setDirty({ notes: false, code: {} });
      dirtyMarksRef.current = new Set();
      return;
    }
    const v = readMap()[slug] ?? empty;
    // Backfill defaults for older entries written before per-field timestamps
    const normalised: SolutionEntry = {
      notes: v.notes ?? "",
      code: v.code ?? {},
      codeUpdatedAt: v.codeUpdatedAt ?? {},
      notesUpdatedAt: v.notesUpdatedAt,
      updatedAt: v.updatedAt ?? 0,
    };
    setEntry(normalised);
    setSavedAt(normalised.updatedAt || null);
    setDirty({ notes: false, code: {} });
    dirtyMarksRef.current = new Set();
  }, [slug]);

  const flush = useCallback(() => {
    if (!slug || !pendingRef.current) return;
    const now = Date.now();
    const next: SolutionEntry = { ...pendingRef.current, updatedAt: now };
    // Apply per-field timestamps based on what was marked dirty.
    next.codeUpdatedAt = { ...(next.codeUpdatedAt ?? {}) };
    next.notesUpdatedAt = next.notesUpdatedAt;
    dirtyMarksRef.current.forEach((mark) => {
      if (mark === "notes") next.notesUpdatedAt = now;
      else if (mark.startsWith("code:")) {
        const lang = mark.slice(5) as LangId;
        next.codeUpdatedAt![lang] = now;
      }
    });

    const map = readMap();
    const isEmpty =
      !next.notes.trim() &&
      Object.values(next.code).every((c) => !c || !c.trim());
    if (isEmpty) delete map[slug];
    else map[slug] = next;
    writeMap(map);
    setEntry(next);
    setSavedAt(next.updatedAt);
    setDirty({ notes: false, code: {} });
    pendingRef.current = null;
    dirtyMarksRef.current = new Set();
  }, [slug]);

  const schedule = useCallback(
    (next: SolutionEntry, mark: DirtyMark) => {
      pendingRef.current = next;
      if (mark === "notes") dirtyMarksRef.current.add("notes");
      else dirtyMarksRef.current.add(`code:${mark.code}`);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(flush, 700);
    },
    [flush],
  );

  const setNotes = useCallback(
    (notes: string) => {
      setEntry((prev) => {
        const next = { ...prev, notes };
        schedule(next, "notes");
        return next;
      });
      setDirty((d) => ({ ...d, notes: true }));
    },
    [schedule],
  );

  const setCode = useCallback(
    (code: string) => {
      setEntry((prev) => {
        const next = { ...prev, code: { ...prev.code, [language]: code } };
        schedule(next, { code: language });
        return next;
      });
      setDirty((d) => ({ ...d, code: { ...d.code, [language]: true } }));
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

  /**
   * Clear the entry but return the previous snapshot so callers can offer an
   * undo action. Cancels any pending debounced write.
   */
  const clear = useCallback((): SolutionEntry | null => {
    if (!slug) return null;
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    pendingRef.current = null;
    dirtyMarksRef.current = new Set();
    const map = readMap();
    const previous = map[slug] ? { ...map[slug] } : null;
    delete map[slug];
    writeMap(map);
    setEntry({ ...empty });
    setSavedAt(null);
    setDirty({ notes: false, code: {} });
    return previous;
  }, [slug]);

  /** Restore a previously-cleared snapshot (used by the undo toast action). */
  const restore = useCallback(
    (snapshot: SolutionEntry) => {
      if (!slug || !snapshot) return;
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      pendingRef.current = null;
      dirtyMarksRef.current = new Set();
      const map = readMap();
      const restored: SolutionEntry = { ...snapshot, updatedAt: Date.now() };
      map[slug] = restored;
      writeMap(map);
      setEntry(restored);
      setSavedAt(restored.updatedAt);
      setDirty({ notes: false, code: {} });
    },
    [slug],
  );

  const savedLanguages = (Object.keys(entry.code) as LangId[]).filter(
    (k) => (entry.code[k] ?? "").trim().length > 0,
  );
  const hasNotes = entry.notes.trim().length > 0;
  const hasAnyCode = savedLanguages.length > 0;
  const hasUnsavedCurrentCode = !!dirty.code[language];

  return {
    notes: entry.notes,
    code: entry.code[language] ?? "",
    allCode: entry.code,
    codeUpdatedAt: entry.codeUpdatedAt ?? {},
    notesUpdatedAt: entry.notesUpdatedAt ?? null,
    savedLanguages,
    savedAt,
    setNotes,
    setCode,
    clear,
    restore,
    /** True if the current language's editor has edits not yet flushed. */
    hasUnsavedCurrentCode,
    /** True if any field is dirty (used for switch confirmations). */
    hasUnsavedChanges: dirty.notes || Object.values(dirty.code).some(Boolean),
    hasContent: hasNotes || hasAnyCode,
    hasNotes,
    hasAnyCode,
    /** True when both a notes writeup and at least one code solution are saved. */
    isComplete: hasNotes && hasAnyCode,
  };
};
