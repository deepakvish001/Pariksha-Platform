import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Some RPCs were added in a recent migration and aren't yet in the generated
// types — cast supabase.rpc through `any` so we can call them.
const rpc = (name: string, args?: Record<string, unknown>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase.rpc as any)(name, args ?? {});

export interface DailyChallenge {
  challenge_id: string;
  challenge_date: string;
  problem_slug: string;
  bonus_xp: number;
  attempted: boolean;
  solved: boolean;
  solve_time_sec: number | null;
  global_solves: number;
}

export interface ArenaStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  freezes_remaining: number;
}

export interface UserDailyQuest {
  id: string;
  quest_id: string;
  quest_date: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  xp_reward: number;
  // joined catalog
  title?: string;
  description?: string;
  difficulty?: string;
  kind?: string;
}

export function useDailyChallenge() {
  const [data, setData] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await rpc("arena_get_daily_challenge");
    if (!error) setData(((rows as DailyChallenge[]) ?? [])[0] ?? null);
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

export function useArenaStreak(userId: string | undefined) {
  const [streak, setStreak] = useState<ArenaStreak | null>(null);
  useEffect(() => {
    if (!userId) return;
    (async () => {
      // Cast — table not in generated types yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from as any)("arena_streaks")
        .select("*").eq("user_id", userId).maybeSingle();
      setStreak((data as ArenaStreak) ?? null);
    })();
  }, [userId]);
  return streak;
}

export async function tickArenaStreak() {
  const { data, error } = await rpc("arena_tick_streak");
  if (error) throw error;
  return data as { current: number; longest: number; used_freeze: boolean };
}

export async function completeDailyChallenge(battleId: string, solveTimeSec: number) {
  const { data, error } = await rpc("arena_complete_daily_challenge", {
    _battle_id: battleId,
    _solve_time_sec: solveTimeSec,
  });
  if (error) throw error;
  return data as { ok: boolean; xp: number; already_solved?: boolean };
}

export function useUserDailyQuests() {
  const [quests, setQuests] = useState<UserDailyQuest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await rpc("arena_ensure_daily_quests");
    if (rows && Array.isArray(rows)) {
      const ids = (rows as UserDailyQuest[]).map((r) => r.quest_id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: catalog } = await (supabase.from as any)("arena_quests_catalog")
        .select("id,title,description,kind,difficulty").in("id", ids);
      const map = new Map<string, { title: string; description: string; kind: string; difficulty: string }>();
      (catalog ?? []).forEach((c: { id: string; title: string; description: string; kind: string; difficulty: string }) =>
        map.set(c.id, c)
      );
      setQuests((rows as UserDailyQuest[]).map((r) => ({ ...r, ...map.get(r.quest_id) })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { quests, loading, refresh };
}

export async function claimQuest(userQuestId: string) {
  const { data, error } = await rpc("arena_claim_quest", { _user_quest_id: userQuestId });
  if (error) throw error;
  return data as { ok: boolean; xp?: number; already_claimed?: boolean };
}

export interface DailyHistoryEntry {
  challenge_date: string;
  problem_slug: string;
  problem_title: string | null;
  solved: boolean;
  solve_time_sec: number | null;
  xp_awarded: number;
  attempted_at: string | null;
}

export function useDailyHistory(pageSize = 30) {
  const [history, setHistory] = useState<DailyHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = useCallback(async (offset: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    const { data, error } = await rpc("arena_get_daily_history", { _days: pageSize, _offset: offset });
    const rows = (!error && Array.isArray(data) ? (data as DailyHistoryEntry[]) : []);
    setHasMore(rows.length === pageSize);
    setHistory((prev) => append ? [...prev, ...rows] : rows);
    if (append) setLoadingMore(false); else setLoading(false);
  }, [pageSize]);

  const refresh = useCallback(() => loadPage(0, false), [loadPage]);
  const loadMore = useCallback(() => loadPage(history.length, true), [loadPage, history.length]);

  useEffect(() => { refresh(); }, [refresh]);
  return { history, loading, loadingMore, hasMore, refresh, loadMore };
}

export interface ArenaNotificationPrefs {
  user_id: string;
  daily_reminder: boolean;
  reminder_hour_utc: number;
  last_reminded_date: string | null;
}

export function useArenaNotificationPrefs(userId: string | undefined) {
  const [prefs, setPrefs] = useState<ArenaNotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from as any)("arena_notification_prefs")
      .select("*").eq("user_id", userId).maybeSingle();
    setPrefs((data as ArenaNotificationPrefs) ?? {
      user_id: userId, daily_reminder: false, reminder_hour_utc: 14, last_reminded_date: null,
    });
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (patch: Partial<ArenaNotificationPrefs>) => {
    if (!userId) return;
    const next = { ...(prefs ?? { user_id: userId, daily_reminder: false, reminder_hour_utc: 14, last_reminded_date: null }), ...patch };
    setPrefs(next);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from as any)("arena_notification_prefs").upsert({
      user_id: userId,
      daily_reminder: next.daily_reminder,
      reminder_hour_utc: next.reminder_hour_utc,
    });
  }, [userId, prefs]);

  return { prefs, loading, save };
}
