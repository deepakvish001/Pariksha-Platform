import { useEffect, useMemo, useState } from "react";
import { CODING_PROBLEMS, type CodingProblem } from "@/data/codingProblemsData";

const STORAGE_KEY = "byteskill:coding:dailyChallenge:v1";

interface DailyState {
  // ISO date strings (YYYY-MM-DD) of days the user completed the daily challenge
  completedDates: string[];
}

const todayKey = (d = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Deterministic hash from a string -> 32-bit int
const hashString = (s: string): number => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const readState = (): DailyState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completedDates: [] };
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.completedDates)) return parsed;
    return { completedDates: [] };
  } catch {
    return { completedDates: [] };
  }
};

const writeState = (s: DailyState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
};

const computeStreak = (dates: Set<string>, today: string): number => {
  let streak = 0;
  const cursor = new Date(today + "T00:00:00");
  // Allow today not yet completed: start from yesterday in that case
  if (!dates.has(todayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dates.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export interface DailyChallenge {
  problem: CodingProblem;
  dateKey: string;
  isCompletedToday: boolean;
  streak: number;
  completedTotal: number;
  markCompleted: () => void;
}

/**
 * Picks a deterministic problem-of-the-day from CODING_PROBLEMS.
 * Tracks completion locally and exposes a streak counter.
 *
 * Pass `solvedSlugs` to auto-mark today's challenge as completed when the
 * user has an accepted submission for today's problem.
 */
export const useDailyChallenge = (solvedSlugs?: Set<string>): DailyChallenge => {
  const dateKey = useMemo(() => todayKey(), []);

  const problem = useMemo(() => {
    const idx = hashString(dateKey) % CODING_PROBLEMS.length;
    return CODING_PROBLEMS[idx];
  }, [dateKey]);

  const [state, setState] = useState<DailyState>(() => readState());

  // Auto-mark when solved
  useEffect(() => {
    if (!solvedSlugs || !problem) return;
    if (!solvedSlugs.has(problem.slug)) return;
    setState((prev) => {
      if (prev.completedDates.includes(dateKey)) return prev;
      const next = { completedDates: [...prev.completedDates, dateKey] };
      writeState(next);
      return next;
    });
  }, [solvedSlugs, problem, dateKey]);

  const completedSet = useMemo(() => new Set(state.completedDates), [state.completedDates]);
  const isCompletedToday = completedSet.has(dateKey);
  const streak = useMemo(() => computeStreak(completedSet, dateKey), [completedSet, dateKey]);

  const markCompleted = () => {
    setState((prev) => {
      if (prev.completedDates.includes(dateKey)) return prev;
      const next = { completedDates: [...prev.completedDates, dateKey] };
      writeState(next);
      return next;
    });
  };

  return {
    problem,
    dateKey,
    isCompletedToday,
    streak,
    completedTotal: completedSet.size,
    markCompleted,
  };
};
