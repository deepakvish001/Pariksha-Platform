import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CODING_PROBLEMS, type CodingProblem } from "@/data/codingProblemsData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  mergeCompletions,
  type CompletionRecord,
} from "@/lib/dailyChallengeMerge";

const STORAGE_KEY = "byteskill:coding:dailyChallenge:v2";

interface DailyState {
  completions: CompletionRecord[];
}

/** YYYY-MM-DD in local time */
const toDateKey = (d = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

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
    if (!raw) return { completions: [] };
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.completions)) return parsed;
    // migrate v1 (string[] of dates) if present
    const legacy = localStorage.getItem("byteskill:coding:dailyChallenge:v1");
    if (legacy) {
      try {
        const legacyParsed = JSON.parse(legacy);
        if (Array.isArray(legacyParsed.completedDates)) {
          return {
            completions: legacyParsed.completedDates.map((d: string) => ({
              date: d,
              problemSlug: "",
              completedAt: new Date(d + "T12:00:00").toISOString(),
            })),
          };
        }
      } catch {
        /* noop */
      }
    }
    return { completions: [] };
  } catch {
    return { completions: [] };
  }
};

const writeState = (s: DailyState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
};

const computeStreak = (completedDates: Set<string>, today: string): number => {
  let streak = 0;
  const cursor = new Date(today + "T00:00:00");
  if (!completedDates.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (completedDates.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

/** Pick deterministic problem-of-the-day from a date key */
const pickProblemForDate = (dateKey: string): CodingProblem => {
  const idx = hashString(dateKey) % CODING_PROBLEMS.length;
  return CODING_PROBLEMS[idx];
};

export interface DailyChallenge {
  problem: CodingProblem;
  dateKey: string;
  isCompletedToday: boolean;
  streak: number;
  completedTotal: number;
  /** Last 30 days of completions (date YYYY-MM-DD + slug + ts). Newest first. */
  recentCompletions: CompletionRecord[];
  /** True while a cloud pull/push is in flight */
  syncing: boolean;
  /** True when a successful mark-completed event just happened (for celebration) */
  justCompleted: boolean;
  acknowledgeCelebration: () => void;
  markCompleted: () => Promise<void>;
  pickProblemForDate: (dateKey: string) => CodingProblem;
}

/**
 * Daily challenge hook with:
 * - Deterministic local-day problem-of-the-day
 * - Live local-midnight rollover (re-renders the consumer at next 00:00:00 local)
 * - Timezone-change safety (re-evaluates today on focus/visibility/storage)
 * - Cloud sync via daily_challenge_completions for signed-in users
 */
export const useDailyChallenge = (solvedSlugs?: Set<string>): DailyChallenge => {
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());

  const dateKey = useMemo(() => toDateKey(now), [now]);
  const problem = useMemo(() => pickProblemForDate(dateKey), [dateKey]);

  const [state, setState] = useState<DailyState>(() => readState());
  const [syncing, setSyncing] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const lastSyncedUserRef = useRef<string | null>(null);
  // ---- Midnight + timezone refresh ------------------------------------------
  useEffect(() => {
    let timer: number | undefined;

    const scheduleNext = () => {
      const cur = new Date();
      const tomorrow = new Date(cur);
      tomorrow.setDate(cur.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const ms = Math.max(1000, tomorrow.getTime() - cur.getTime());
      // Cap the timeout — some browsers throttle long timers; this also helps if
      // the system clock or timezone changes mid-wait.
      const capped = Math.min(ms, 60 * 1000); // re-check at least every minute
      timer = window.setTimeout(() => {
        const next = new Date();
        // Only commit a re-render if the date key actually changed, to avoid
        // re-rendering every minute. The render is what consumers depend on.
        setNow((prev) => (toDateKey(prev) === toDateKey(next) ? prev : next));
        scheduleNext();
      }, capped);
    };

    scheduleNext();

    const onVisible = () => {
      if (document.visibilityState === "visible") setNow(new Date());
    };
    const onFocus = () => setNow(new Date());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(readState());
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);

    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // ---- Cloud sync: pull on login, push on local change ---------------------
  useEffect(() => {
    if (!user) {
      lastSyncedUserRef.current = null;
      return;
    }
    if (lastSyncedUserRef.current === user.id) return;
    lastSyncedUserRef.current = user.id;

    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        // Pull last ~365 days
        const { data, error: pullErr } = await supabase
          .from("daily_challenge_completions")
          .select("challenge_date, problem_slug, completed_at")
          .eq("user_id", user.id)
          .gte(
            "challenge_date",
            toDateKey(new Date(Date.now() - 365 * 24 * 3600 * 1000)),
          )
          .order("challenge_date", { ascending: false });

        if (cancelled) return;
        if (pullErr) throw pullErr;

        const remote: CompletionRecord[] = (data ?? []).map((r) => ({
          date: r.challenge_date as string,
          problemSlug: (r.problem_slug as string) ?? "",
          completedAt: (r.completed_at as string) ?? new Date().toISOString(),
        }));

        // Conflict-safe merge using shared pure helper.
        setState((prev) => {
          const merged = mergeCompletions(prev.completions, remote);
          const next = { completions: merged };
          writeState(next);
          return next;
        });

        // Push any local-only rows back to cloud. The DB has a UNIQUE
        // (user_id, challenge_date) constraint, so upsert with
        // ignoreDuplicates ensures we never overwrite an earlier
        // cloud completion timestamp from another device.
        const remoteDates = new Set(remote.map((r) => r.date));
        const local = readState().completions;
        const toUpload = local.filter((c) => !remoteDates.has(c.date));
        if (toUpload.length > 0) {
          const { error: pushErr } = await supabase
            .from("daily_challenge_completions")
            .upsert(
              toUpload.map((c) => ({
                user_id: user.id,
                challenge_date: c.date,
                problem_slug: c.problemSlug || pickProblemForDate(c.date).slug,
                completed_at: c.completedAt,
              })),
              { onConflict: "user_id,challenge_date", ignoreDuplicates: true },
            );
          if (pushErr) throw pushErr;
        }

        // Client-side self-heal audit: removes any leftover duplicates that
        // bypassed the unique constraint historically. Best-effort, never
        // fabricates completions.
        try {
          await supabase.rpc("audit_daily_completions" as never);
        } catch {
          /* non-fatal */
        }

        if (!cancelled) {
          /* synced silently */
        }
      } catch (err) {
        if (cancelled) return;
        // Swallow — UI loads from local state; next session will retry.
        console.warn("Daily challenge sync failed:", err);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // ---- Auto-mark when user has an accepted submission for today's slug -----
  useEffect(() => {
    if (!solvedSlugs || !problem) return;
    if (!solvedSlugs.has(problem.slug)) return;
    setState((prev) => {
      if (prev.completions.some((c) => c.date === dateKey)) return prev;
      const rec: CompletionRecord = {
        date: dateKey,
        problemSlug: problem.slug,
        completedAt: new Date().toISOString(),
      };
      const next = { completions: [rec, ...prev.completions] };
      writeState(next);
      // Push to cloud (best-effort). ignoreDuplicates protects an
      // earlier cloud row written from another device.
      if (user) {
        void supabase.from("daily_challenge_completions").upsert(
          {
            user_id: user.id,
            challenge_date: rec.date,
            problem_slug: rec.problemSlug,
            completed_at: rec.completedAt,
          },
          { onConflict: "user_id,challenge_date", ignoreDuplicates: true },
        );
      }
      setJustCompleted(true);
      return next;
    });
  }, [solvedSlugs, problem, dateKey, user]);

  const completedDateSet = useMemo(
    () => new Set(state.completions.map((c) => c.date)),
    [state.completions],
  );
  const isCompletedToday = completedDateSet.has(dateKey);
  const streak = useMemo(
    () => computeStreak(completedDateSet, dateKey),
    [completedDateSet, dateKey],
  );

  const recentCompletions = useMemo(() => {
    return state.completions.slice(0, 30);
  }, [state.completions]);

  const markCompleted = useCallback(async () => {
    setState((prev) => {
      if (prev.completions.some((c) => c.date === dateKey)) return prev;
      const rec: CompletionRecord = {
        date: dateKey,
        problemSlug: problem.slug,
        completedAt: new Date().toISOString(),
      };
      const next = { completions: [rec, ...prev.completions] };
      writeState(next);
      setJustCompleted(true);
      return next;
    });
    if (user) {
      try {
        setSyncing(true);
        // ignoreDuplicates: if another device already marked this date,
        // do not overwrite the earlier completion timestamp.
        const { error: upErr } = await supabase
          .from("daily_challenge_completions")
          .upsert(
            {
              user_id: user.id,
              challenge_date: dateKey,
              problem_slug: problem.slug,
              completed_at: new Date().toISOString(),
            },
            { onConflict: "user_id,challenge_date", ignoreDuplicates: true },
          );
        if (upErr) throw upErr;
      } catch (err) {
        console.warn("Daily challenge mark-completed sync failed:", err);
      } finally {
        setSyncing(false);
      }
    }
  }, [dateKey, problem, user]);

  const acknowledgeCelebration = useCallback(() => setJustCompleted(false), []);

  return {
    problem,
    dateKey,
    isCompletedToday,
    streak,
    completedTotal: state.completions.length,
    recentCompletions,
    syncing,
    justCompleted,
    acknowledgeCelebration,
    markCompleted,
    pickProblemForDate,
  };
};

export { toDateKey, pickProblemForDate };
