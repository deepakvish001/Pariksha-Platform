import { useCallback, useEffect, useState } from "react";

export type PlanActivityKind =
  | "bulk_mark_done"
  | "bulk_mark_pending"
  | "bulk_undo_status"
  | "bulk_move"
  | "bulk_undo_move"
  | "coach_action";

export interface PlanActivityEntry {
  id: string;
  kind: PlanActivityKind;
  summary: string;
  detail?: string;
  count: number;
  at: string; // ISO
}

const STORAGE_KEY = "myplan:activityLog:v1";
const MAX_ENTRIES = 30;

const read = (): PlanActivityEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
};

export const usePlanActivityLog = () => {
  const [entries, setEntries] = useState<PlanActivityEntry[]>(() => read());

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setEntries(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const log = useCallback(
    (entry: Omit<PlanActivityEntry, "id" | "at">) => {
      const next: PlanActivityEntry = {
        ...entry,
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
      };
      setEntries((cur) => {
        const updated = [next, ...cur].slice(0, MAX_ENTRIES);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      });
    },
    []
  );

  const clear = useCallback(() => {
    setEntries([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  return { entries, log, clear };
};
