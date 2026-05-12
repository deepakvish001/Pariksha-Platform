import { useCallback, useEffect, useMemo, useState } from "react";

const LS_HISTORY = "dsaPatterns:history:v1";

export interface PatternHistoryEntry {
  id: string;        // pattern id
  ts: string;        // ISO timestamp
}

const load = (): PatternHistoryEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((e) => e && typeof e.id === "string" && typeof e.ts === "string") : [];
  } catch {
    return [];
  }
};

const save = (entries: PatternHistoryEntry[]) => {
  try {
    localStorage.setItem(LS_HISTORY, JSON.stringify(entries.slice(-1000)));
  } catch {
    /* ignore quota */
  }
};

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const startOfWeek = (d: Date) => {
  // Monday-based week
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0 = Mon
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
};

export interface PatternHistoryStats {
  entries: PatternHistoryEntry[];
  /** Map of "yyyy-mm-dd" -> count of patterns logged that day */
  byDay: Map<string, number>;
  /** Patterns logged this calendar week (Mon–Sun) */
  thisWeekCount: number;
  /** Patterns logged previous week */
  lastWeekCount: number;
  /** Consecutive days ending today (or yesterday if nothing today yet) */
  currentStreak: number;
  /** Best consecutive-day streak ever */
  longestStreak: number;
  /** Last 30 calendar days, oldest first */
  last30Days: { day: string; date: Date; count: number }[];
  /** Total distinct days with activity */
  activeDays: number;
}

export const useDsaPatternHistory = () => {
  const [entries, setEntries] = useState<PatternHistoryEntry[]>(() => load());

  useEffect(() => save(entries), [entries]);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_HISTORY) setEntries(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const logCompletion = useCallback((id: string) => {
    setEntries((prev) => [...prev, { id, ts: new Date().toISOString() }]);
  }, []);

  const clearHistory = useCallback(() => setEntries([]), []);

  const stats: PatternHistoryStats = useMemo(() => {
    const byDay = new Map<string, number>();
    entries.forEach((e) => {
      const k = dayKey(new Date(e.ts));
      byDay.set(k, (byDay.get(k) || 0) + 1);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Streaks: walk back from today
    let currentStreak = 0;
    {
      const cursor = new Date(today);
      // Allow streak to count if today has no activity yet but yesterday did
      if (!byDay.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
      while (byDay.has(dayKey(cursor))) {
        currentStreak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    // Longest: scan all keys sorted ascending
    let longestStreak = 0;
    {
      const sortedKeys = [...byDay.keys()].sort();
      let run = 0;
      let prev: Date | null = null;
      for (const k of sortedKeys) {
        const [y, m, d] = k.split("-").map(Number);
        const cur = new Date(y, m - 1, d);
        if (prev) {
          const diff = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
          run = diff === 1 ? run + 1 : 1;
        } else {
          run = 1;
        }
        if (run > longestStreak) longestStreak = run;
        prev = cur;
      }
    }

    // This/last week counts
    const weekStart = startOfWeek(today);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    let thisWeekCount = 0;
    let lastWeekCount = 0;
    entries.forEach((e) => {
      const t = new Date(e.ts).getTime();
      if (t >= weekStart.getTime()) thisWeekCount += 1;
      else if (t >= lastWeekStart.getTime()) lastWeekCount += 1;
    });

    // Last 30 days (oldest first)
    const last30Days: PatternHistoryStats["last30Days"] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      last30Days.push({ day: k, date: d, count: byDay.get(k) || 0 });
    }

    return {
      entries,
      byDay,
      thisWeekCount,
      lastWeekCount,
      currentStreak,
      longestStreak,
      last30Days,
      activeDays: byDay.size,
    };
  }, [entries]);

  return { ...stats, logCompletion, clearHistory };
};
