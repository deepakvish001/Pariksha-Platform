import { useCallback, useEffect, useRef, useState } from "react";
import type { LangId } from "@/data/codingProblemsData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

/** Convert a DB row into a SolutionEntry. */
const rowToEntry = (row: {
  notes: string | null;
  code: unknown;
  code_updated_at: unknown;
  notes_updated_at: string | null;
  updated_at: string;
}): SolutionEntry => {
  const code = (row.code && typeof row.code === "object" ? row.code : {}) as Partial<
    Record<LangId, string>
  >;
  const cua = (row.code_updated_at && typeof row.code_updated_at === "object"
    ? row.code_updated_at
    : {}) as Partial<Record<LangId, number>>;
  return {
    notes: row.notes ?? "",
    code,
    codeUpdatedAt: cua,
    notesUpdatedAt: row.notes_updated_at ? new Date(row.notes_updated_at).getTime() : undefined,
    updatedAt: new Date(row.updated_at).getTime(),
  };
};

/**
 * Per-slug "My Solution" — stores a markdown writeup plus the user's final
 * solution code per language. Autosaves with a 700ms debounce. Persists to
 * localStorage immediately and syncs to Supabase when the user is signed in,
 * so solutions follow the user across devices.
 */
export const useProblemSolution = (slug: string | undefined, language: LangId) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [entry, setEntry] = useState<SolutionEntry>(() =>
    slug ? readMap()[slug] ?? empty : empty,
  );
  const [savedAt, setSavedAt] = useState<number | null>(() =>
    slug && readMap()[slug]?.updatedAt ? readMap()[slug].updatedAt : null,
  );
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error" | "offline">(
    "idle",
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

  // Reload local entry whenever the slug changes
  useEffect(() => {
    if (!slug) {
      setEntry(empty);
      setSavedAt(null);
      setDirty({ notes: false, code: {} });
      setUndoBuffer({});
      dirtyMarksRef.current = new Set();
      return;
    }
    const v = readMap()[slug] ?? empty;
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
    setUndoBuffer({});
    dirtyMarksRef.current = new Set();
  }, [slug]);

  // Pull from DB and merge (most-recent timestamp wins per field) when signed
  // in or when the slug/user changes.
  useEffect(() => {
    if (!slug || !userId) {
      if (!userId) setSyncStatus("offline");
      return;
    }
    let cancelled = false;
    setSyncStatus("syncing");
    (async () => {
      const { data, error } = await supabase
        .from("user_problem_solutions")
        .select("notes, code, code_updated_at, notes_updated_at, updated_at")
        .eq("user_id", userId)
        .eq("problem_slug", slug)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        setSyncStatus("error");
        return;
      }

      const local = readMap()[slug];
      const remote = data ? rowToEntry(data) : null;

      // Merge: take the freshest version for notes and per language.
      const localTs = local?.updatedAt ?? 0;
      const remoteTs = remote?.updatedAt ?? 0;

      // No remote -> push local up if local has content.
      if (!remote) {
        if (local && (local.notes.trim() || Object.values(local.code).some((c) => c?.trim()))) {
          await pushToDb(userId, slug, local);
        }
        setSyncStatus("synced");
        return;
      }

      // No local or remote is newer overall -> adopt remote.
      if (!local || remoteTs >= localTs) {
        const map = readMap();
        map[slug] = remote;
        writeMap(map);
        setEntry(remote);
        setSavedAt(remote.updatedAt);
        setSyncStatus("synced");
        return;
      }

      // Local is newer -> push to DB.
      await pushToDb(userId, slug, local);
      setSyncStatus("synced");
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, userId]);

  const pushToDb = async (uid: string, problemSlug: string, value: SolutionEntry) => {
    try {
      const isEmpty =
        !value.notes.trim() &&
        Object.values(value.code).every((c) => !c || !c.trim());
      if (isEmpty) {
        await supabase
          .from("user_problem_solutions")
          .delete()
          .eq("user_id", uid)
          .eq("problem_slug", problemSlug);
        return;
      }
      await supabase.from("user_problem_solutions").upsert(
        {
          user_id: uid,
          problem_slug: problemSlug,
          notes: value.notes,
          code: value.code as Record<string, string>,
          code_updated_at: (value.codeUpdatedAt ?? {}) as Record<string, number>,
          notes_updated_at: value.notesUpdatedAt
            ? new Date(value.notesUpdatedAt).toISOString()
            : null,
          updated_at: new Date(value.updatedAt).toISOString(),
        },
        { onConflict: "user_id,problem_slug" },
      );
    } catch {
      /* swallow — local copy is still safe */
    }
  };

  const flush = useCallback(() => {
    if (!slug || !pendingRef.current) return;
    const now = Date.now();
    const next: SolutionEntry = { ...pendingRef.current, updatedAt: now };
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

    // Push to DB if signed in.
    if (userId) {
      setSyncStatus("syncing");
      pushToDb(userId, slug, next).then(() => setSyncStatus("synced")).catch(() =>
        setSyncStatus("error"),
      );
    }
  }, [slug, userId]);

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
        const previousCode = prev.code[language] ?? "";
        if (previousCode !== code) {
          setUndoBuffer((b) => ({ ...b, [language]: previousCode }));
        }
        const next = { ...prev, code: { ...prev.code, [language]: code } };
        schedule(next, { code: language });
        return next;
      });
      setDirty((d) => ({ ...d, code: { ...d.code, [language]: true } }));
    },
    [schedule, language],
  );

  const undoCodeChange = useCallback(
    (lang: LangId): boolean => {
      const prevValue = undoBuffer[lang];
      if (prevValue === undefined) return false;
      setEntry((prev) => {
        const currentValue = prev.code[lang] ?? "";
        setUndoBuffer((b) => ({ ...b, [lang]: currentValue }));
        const next = { ...prev, code: { ...prev.code, [lang]: prevValue } };
        schedule(next, { code: lang });
        return next;
      });
      setDirty((d) => ({ ...d, code: { ...d.code, [lang]: true } }));
      return true;
    },
    [schedule, undoBuffer],
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
    setUndoBuffer({});

    if (userId) {
      setSyncStatus("syncing");
      supabase
        .from("user_problem_solutions")
        .delete()
        .eq("user_id", userId)
        .eq("problem_slug", slug)
        .then(({ error }) => setSyncStatus(error ? "error" : "synced"));
    }
    return previous;
  }, [slug, userId]);

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
      setUndoBuffer({});

      if (userId) {
        setSyncStatus("syncing");
        pushToDb(userId, slug, restored)
          .then(() => setSyncStatus("synced"))
          .catch(() => setSyncStatus("error"));
      }
    },
    [slug, userId],
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
    undoCodeChange,
    canUndoCode: (lang: LangId) => undoBuffer[lang] !== undefined,
    hasUnsavedCurrentCode,
    hasUnsavedChanges: dirty.notes || Object.values(dirty.code).some(Boolean),
    hasContent: hasNotes || hasAnyCode,
    hasNotes,
    hasAnyCode,
    isComplete: hasNotes && hasAnyCode,
    /** Cloud sync status: idle | syncing | synced | error | offline (signed-out). */
    syncStatus,
    /** True when the solution is being persisted to the cloud. */
    isCloudSynced: !!userId,
  };
};
