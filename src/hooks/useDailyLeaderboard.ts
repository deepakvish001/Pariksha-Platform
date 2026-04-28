import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DailyLeaderboardEntry {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  current_streak: number;
  weekly_completions: number;
  total_completions: number;
  last_completed_at: string | null;
}

export interface DailyLeaderboardOptin {
  optedIn: boolean;
  displayName: string | null;
  loading: boolean;
  setOptIn: (value: boolean, displayName?: string | null) => Promise<void>;
}

/** User's own opt-in record + setter */
export const useDailyLeaderboardOptIn = (): DailyLeaderboardOptin => {
  const { user } = useAuth();
  const [optedIn, setOptedIn] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setOptedIn(false);
      setDisplayName(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("daily_challenge_leaderboard_optin")
        .select("opted_in, display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setOptedIn(Boolean(data?.opted_in));
      setDisplayName(data?.display_name ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const setOptIn = useCallback(
    async (value: boolean, name?: string | null) => {
      if (!user) return;
      setLoading(true);
      const payload = {
        user_id: user.id,
        opted_in: value,
        display_name: name ?? displayName,
      };
      await supabase
        .from("daily_challenge_leaderboard_optin")
        .upsert(payload, { onConflict: "user_id" });
      setOptedIn(value);
      if (name !== undefined) setDisplayName(name);
      setLoading(false);
    },
    [user, displayName],
  );

  return { optedIn, displayName, loading, setOptIn };
};

/** Load the public leaderboard (auth-gated server-side) */
export const useDailyLeaderboard = (limit = 50) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DailyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setEntries([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: rpcErr } = await supabase.rpc(
      "get_daily_challenge_leaderboard" as never,
      { _limit: limit } as never,
    );
    if (rpcErr) {
      setError(rpcErr.message);
      setEntries([]);
    } else {
      setEntries((data ?? []) as DailyLeaderboardEntry[]);
    }
    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { entries, loading, error, reload };
};
