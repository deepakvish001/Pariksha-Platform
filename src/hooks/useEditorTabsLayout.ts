import { useCallback, useEffect, useMemo, useState } from "react";

const KEY = "byteskill:coding-editor-tabs-layout:v1";

export type EditorTabId =
  | "description"
  | "my-solution"
  | "solution"
  | "notes"
  | "submissions"
  | "runs";

export const DEFAULT_TAB_ORDER: EditorTabId[] = [
  "description",
  "my-solution",
  "solution",
  "notes",
  "submissions",
  "runs",
];

interface LayoutEntry {
  order?: EditorTabId[];
  active?: EditorTabId;
}

type LayoutMap = Record<string, LayoutEntry>;

const isTabId = (v: unknown): v is EditorTabId =>
  typeof v === "string" &&
  (DEFAULT_TAB_ORDER as readonly string[]).includes(v);

const sanitizeOrder = (raw: unknown): EditorTabId[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const cleaned = raw.filter(isTabId) as EditorTabId[];
  // De-dupe and ensure every default tab is represented (append missing).
  const seen = new Set<EditorTabId>();
  const out: EditorTabId[] = [];
  for (const id of cleaned) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  for (const id of DEFAULT_TAB_ORDER) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
};

const readMap = (): LayoutMap => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: LayoutMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (!v || typeof v !== "object") continue;
      const entry = v as { order?: unknown; active?: unknown };
      const cleaned: LayoutEntry = {};
      const order = sanitizeOrder(entry.order);
      if (order) cleaned.order = order;
      if (isTabId(entry.active)) cleaned.active = entry.active;
      out[k] = cleaned;
    }
    return out;
  } catch {
    return {};
  }
};

const writeMap = (map: LayoutMap) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

const buildKey = (slug: string | undefined, language: string) =>
  `${slug ?? "_"}::${language}`;

/**
 * Persists tab order and active tab per (problem slug, language).
 * Falls back to DEFAULT_TAB_ORDER and "description" when nothing is stored.
 */
export const useEditorTabsLayout = (
  slug: string | undefined,
  language: string,
) => {
  const [map, setMap] = useState<LayoutMap>(readMap);

  useEffect(() => {
    setMap(readMap());
  }, [slug, language]);

  const k = buildKey(slug, language);
  const entry = map[k] ?? {};

  const order = useMemo<EditorTabId[]>(
    () => entry.order ?? DEFAULT_TAB_ORDER,
    [entry.order],
  );
  const active: EditorTabId = entry.active ?? order[0] ?? "description";

  const setOrder = useCallback(
    (next: EditorTabId[]) => {
      setMap((prev) => {
        const cleaned = sanitizeOrder(next) ?? DEFAULT_TAB_ORDER;
        const prevEntry = prev[k] ?? {};
        const updated: LayoutMap = {
          ...prev,
          [k]: { ...prevEntry, order: cleaned },
        };
        writeMap(updated);
        return updated;
      });
    },
    [k],
  );

  const setActive = useCallback(
    (id: EditorTabId) => {
      if (!isTabId(id)) return;
      setMap((prev) => {
        const prevEntry = prev[k] ?? {};
        if (prevEntry.active === id) return prev;
        const updated: LayoutMap = {
          ...prev,
          [k]: { ...prevEntry, active: id },
        };
        writeMap(updated);
        return updated;
      });
    },
    [k],
  );

  const reset = useCallback(() => {
    setMap((prev) => {
      if (!(k in prev)) return prev;
      const next = { ...prev };
      delete next[k];
      writeMap(next);
      return next;
    });
  }, [k]);

  const isCustomized = Boolean(entry.order || entry.active);

  return { order, active, setOrder, setActive, reset, isCustomized };
};
