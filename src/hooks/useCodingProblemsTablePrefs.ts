import { useCallback, useEffect, useState } from "react";

// Column ids for the /library/problems table.
export type ProblemColumnId =
  | "row"
  | "status"
  | "title"
  | "topics"
  | "difficulty"
  | "acceptance"
  | "attempts"
  | "bookmark";

export interface ProblemColumnDef {
  id: ProblemColumnId;
  label: string;
  defaultWidth: number; // px — defaultwidth for resizable columns
  minWidth: number;
  maxWidth: number;
  togglable: boolean; // can be hidden from the Columns menu
  defaultVisible: boolean;
}

export const PROBLEM_COLUMNS: ProblemColumnDef[] = [
  { id: "row",        label: "#",          defaultWidth: 56,  minWidth: 44,  maxWidth: 80,  togglable: true,  defaultVisible: true  },
  { id: "status",     label: "Status",     defaultWidth: 70,  minWidth: 56,  maxWidth: 110, togglable: false, defaultVisible: true  },
  { id: "title",      label: "Title",      defaultWidth: 320, minWidth: 180, maxWidth: 700, togglable: false, defaultVisible: true  },
  { id: "topics",     label: "Topics",     defaultWidth: 260, minWidth: 140, maxWidth: 520, togglable: true,  defaultVisible: true  },
  { id: "difficulty", label: "Difficulty", defaultWidth: 120, minWidth: 90,  maxWidth: 180, togglable: true,  defaultVisible: true  },
  { id: "acceptance", label: "Acceptance", defaultWidth: 120, minWidth: 90,  maxWidth: 180, togglable: true,  defaultVisible: true  },
  { id: "attempts",   label: "Attempts",   defaultWidth: 100, minWidth: 70,  maxWidth: 160, togglable: true,  defaultVisible: true  },
  { id: "bookmark",   label: "Bookmark",   defaultWidth: 56,  minWidth: 44,  maxWidth: 80,  togglable: false, defaultVisible: true  },
];

const VERSION = 1;
const KEY = `byteskill:coding-problems-table-prefs:v${VERSION}`;

interface Persisted {
  visible: Partial<Record<ProblemColumnId, boolean>>;
  widths: Partial<Record<ProblemColumnId, number>>;
  /** Per-slug saved sort key (3-state). Use "__list__" for the main list. */
  sortBySlug?: Record<string, string>;
}

const defaultPrefs = (): Persisted => {
  const visible: Persisted["visible"] = {};
  const widths: Persisted["widths"] = {};
  for (const c of PROBLEM_COLUMNS) {
    visible[c.id] = c.defaultVisible;
    widths[c.id] = c.defaultWidth;
  }
  return { visible, widths, sortBySlug: {} };
};

const read = (): Persisted => {
  if (typeof window === "undefined") return defaultPrefs();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultPrefs();
    const parsed = JSON.parse(raw);
    const base = defaultPrefs();
    return {
      visible: { ...base.visible, ...(parsed?.visible ?? {}) },
      widths: { ...base.widths, ...(parsed?.widths ?? {}) },
      sortBySlug: { ...(parsed?.sortBySlug ?? {}) },
    };
  } catch {
    return defaultPrefs();
  }
};

const write = (p: Persisted) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore quota errors */
  }
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export const useCodingProblemsTablePrefs = () => {
  const [prefs, setPrefs] = useState<Persisted>(read);

  useEffect(() => {
    write(prefs);
  }, [prefs]);

  const isVisible = useCallback(
    (id: ProblemColumnId) => prefs.visible[id] !== false,
    [prefs.visible],
  );

  const widthOf = useCallback(
    (id: ProblemColumnId) => {
      const def = PROBLEM_COLUMNS.find((c) => c.id === id);
      const stored = prefs.widths[id];
      if (typeof stored === "number" && Number.isFinite(stored) && def) {
        return clamp(stored, def.minWidth, def.maxWidth);
      }
      return def?.defaultWidth ?? 120;
    },
    [prefs.widths],
  );

  const toggleVisible = useCallback((id: ProblemColumnId) => {
    setPrefs((prev) => ({
      ...prev,
      visible: { ...prev.visible, [id]: prev.visible[id] === false },
    }));
  }, []);

  const setWidth = useCallback((id: ProblemColumnId, px: number) => {
    const def = PROBLEM_COLUMNS.find((c) => c.id === id);
    if (!def) return;
    const next = clamp(Math.round(px), def.minWidth, def.maxWidth);
    setPrefs((prev) => ({
      ...prev,
      widths: { ...prev.widths, [id]: next },
    }));
  }, []);

  const resetAll = useCallback(() => setPrefs(defaultPrefs()), []);

  const getSavedSort = useCallback(
    (slug: string): string | undefined => prefs.sortBySlug?.[slug],
    [prefs.sortBySlug],
  );

  const setSavedSort = useCallback((slug: string, sort: string) => {
    setPrefs((prev) => {
      const nextMap = { ...(prev.sortBySlug ?? {}) };
      if (!sort || sort === "default") delete nextMap[slug];
      else nextMap[slug] = sort;
      return { ...prev, sortBySlug: nextMap };
    });
  }, []);

  return {
    isVisible,
    widthOf,
    toggleVisible,
    setWidth,
    resetAll,
    getSavedSort,
    setSavedSort,
  };
};
