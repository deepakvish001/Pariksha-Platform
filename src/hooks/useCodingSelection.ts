import { useCallback, useEffect, useState } from "react";

const KEY = "parikshaa:coding-selection";

interface Persisted {
  mode: boolean;
  slugs: string[];
}

const read = (): Persisted => {
  if (typeof window === "undefined") return { mode: false, slugs: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { mode: false, slugs: [] };
    const v = JSON.parse(raw);
    return {
      mode: !!v?.mode,
      slugs: Array.isArray(v?.slugs) ? v.slugs.filter((s: unknown) => typeof s === "string") : [],
    };
  } catch {
    return { mode: false, slugs: [] };
  }
};

const write = (p: Persisted) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
};

export const useCodingSelection = () => {
  const initial = read();
  const [selectionMode, setSelectionModeState] = useState<boolean>(initial.mode);
  const [selected, setSelectedState] = useState<Set<string>>(new Set(initial.slugs));

  useEffect(() => {
    write({ mode: selectionMode, slugs: Array.from(selected) });
  }, [selectionMode, selected]);

  const setSelectionMode = useCallback((v: boolean) => setSelectionModeState(v), []);

  const toggleSelected = useCallback((slug: string) => {
    setSelectedState((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const addMany = useCallback((slugs: string[]) => {
    setSelectedState((prev) => {
      const next = new Set(prev);
      slugs.forEach((s) => next.add(s));
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedState(new Set()), []);

  const exitSelection = useCallback(() => {
    setSelectionModeState(false);
    setSelectedState(new Set());
  }, []);

  return {
    selectionMode,
    setSelectionMode,
    selected,
    toggleSelected,
    addMany,
    clearSelection,
    exitSelection,
  };
};
