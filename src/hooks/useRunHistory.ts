import { useCallback, useEffect, useState } from "react";

export type RunHistoryKind =
  | "validate-samples"
  | "fill-expected"
  | "run-example"
  | "run-test";

export interface RunHistoryCase {
  index: number;
  pass: boolean;
  input: string;
  expected: string;
  got: string;
  /** Optional unified-style diff snippet (lines), pre-rendered for display. */
  diff?: string;
}

export interface RunHistoryEntry {
  id: string;
  kind: RunHistoryKind;
  language: string;
  label: string;
  createdAt: string;
  passed: number;
  total: number;
  cases: RunHistoryCase[];
  /** Optional notes (e.g. "Filled expected for sample #2"). */
  note?: string;
}

const KEY = (slug: string) => `admin:problem-run-history:${slug || "__new__"}`;
const MAX_ENTRIES = 25;

const read = (slug: string): RunHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(KEY(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (slug: string, entries: RunHistoryEntry[]) => {
  try {
    localStorage.setItem(KEY(slug), JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    window.dispatchEvent(new CustomEvent(`run-history-updated:${slug || "__new__"}`));
  } catch {
    // ignore quota errors
  }
};

export const buildLineDiff = (expected: string, got: string, max = 6): string => {
  if (expected === got) return "";
  const e = expected.split(/\r?\n/);
  const g = got.split(/\r?\n/);
  const len = Math.max(e.length, g.length);
  const out: string[] = [];
  let shown = 0;
  for (let i = 0; i < len && shown < max; i++) {
    const a = e[i] ?? "";
    const b = g[i] ?? "";
    if (a !== b) {
      out.push(`- ${a}`);
      out.push(`+ ${b}`);
      shown++;
    }
  }
  if (shown === 0) return "";
  if (len > max) out.push(`… (${len - max} more line${len - max === 1 ? "" : "s"})`);
  return out.join("\n");
};

export const useRunHistory = (slug: string) => {
  const [entries, setEntries] = useState<RunHistoryEntry[]>(() => read(slug));

  // Reload when slug changes or another tab/component writes new entries.
  useEffect(() => {
    setEntries(read(slug));
    const evt = `run-history-updated:${slug || "__new__"}`;
    const handler = () => setEntries(read(slug));
    window.addEventListener(evt, handler);
    return () => window.removeEventListener(evt, handler);
  }, [slug]);

  const append = useCallback(
    (entry: Omit<RunHistoryEntry, "id" | "createdAt"> & Partial<Pick<RunHistoryEntry, "id" | "createdAt">>) => {
      const full: RunHistoryEntry = {
        id: entry.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: entry.createdAt ?? new Date().toISOString(),
        ...entry,
      };
      const next = [full, ...read(slug)].slice(0, MAX_ENTRIES);
      write(slug, next);
      setEntries(next);
      return full;
    },
    [slug],
  );

  const clear = useCallback(() => {
    write(slug, []);
    setEntries([]);
  }, [slug]);

  const remove = useCallback(
    (id: string) => {
      const next = read(slug).filter((e) => e.id !== id);
      write(slug, next);
      setEntries(next);
    },
    [slug],
  );

  return { entries, append, clear, remove };
};
