import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SETTINGS,
  type DsaPatternSettings,
  type WeekStart,
} from "./useDsaPatternSettings";

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

const startOfWeek = (d: Date, weekStart: WeekStart) => {
  const x = new Date(d);
  const day = (x.getDay() - weekStart + 7) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
};

export interface PatternHistoryStats {
  entries: PatternHistoryEntry[];
  byDay: Map<string, number>;
  thisWeekCount: number;
  lastWeekCount: number;
  currentStreak: number;
  longestStreak: number;
  last30Days: { day: string; date: Date; count: number }[];
  activeDays: number;
}

export const useDsaPatternHistory = (settings: DsaPatternSettings = DEFAULT_SETTINGS) => {
  const [entries, setEntries] = useState<PatternHistoryEntry[]>(() => load());

  useEffect(() => save(entries), [entries]);

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
    const threshold = Math.max(1, settings.dailyThreshold || 1);
    const byDay = new Map<string, number>();
    entries.forEach((e) => {
      const k = dayKey(new Date(e.ts));
      byDay.set(k, (byDay.get(k) || 0) + 1);
    });

    /** Returns true when a day's completions meet the streak threshold. */
    const isActive = (k: string) => (byDay.get(k) || 0) >= threshold;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Current streak (walk back from today; allow start at yesterday if today not yet active)
    let currentStreak = 0;
    {
      const cursor = new Date(today);
      if (!isActive(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
      while (isActive(dayKey(cursor))) {
        currentStreak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    // Longest streak across all active days
    let longestStreak = 0;
    {
      const sortedActive = [...byDay.keys()].filter(isActive).sort();
      let run = 0;
      let prev: Date | null = null;
      for (const k of sortedActive) {
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

    // Week boundaries based on configured week-start day
    const weekStart = startOfWeek(today, settings.weekStart);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    let thisWeekCount = 0;
    let lastWeekCount = 0;
    entries.forEach((e) => {
      const t = new Date(e.ts).getTime();
      if (t >= weekStart.getTime()) thisWeekCount += 1;
      else if (t >= lastWeekStart.getTime()) lastWeekCount += 1;
    });

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
  }, [entries, settings.dailyThreshold, settings.weekStart]);

  return { ...stats, logCompletion, clearHistory };
};
