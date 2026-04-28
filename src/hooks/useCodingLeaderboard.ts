// Public leaderboard for coding problem submissions.
// Backed by the get_coding_leaderboard / get_coding_leaderboard_stats RPCs.
// Anonymous visitors can read this data; only users opted out via
// `user_profiles_extended.coding_leaderboard_hidden = true` are excluded.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type LeaderboardWindow = "all" | "week" | "today";
export type LeaderboardDifficulty = "easy" | "medium" | "hard" | null;

export interface CodingLeaderboardRow {
  rank: number;
  user_id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  problems_solved: number;
  total_accepted: number;
  acceptance_rate: number;
  fastest_avg_runtime: number | null;
  weighted_score: number;
  last_accepted_at: string | null;
}

export interface CodingLeaderboardStats {
  total_participants: number;
  total_accepted_today: number;
  total_accepted_week: number;
  total_problems_solved: number;
}

interface UseLeaderboardParams {
  window: LeaderboardWindow;
  page: number;
  pageSize: number;
  search?: string;
  difficulty?: LeaderboardDifficulty;
  acceptedOnly?: boolean;
}

export function useCodingLeaderboard({
  window: w,
  page,
  pageSize,
  search,
  difficulty = null,
  acceptedOnly = true,
}: UseLeaderboardParams) {
  const [rows, setRows] = useState<CodingLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc(
      "get_coding_leaderboard" as never,
      {
        _window: w,
        _limit: pageSize,
        _offset: (page - 1) * pageSize,
        _search: search?.trim() || null,
        _difficulty: difficulty,
        _accepted_only: acceptedOnly,
      } as never,
    );
    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as CodingLeaderboardRow[]);
    }
    setLoading(false);
  }, [w, page, pageSize, search, difficulty, acceptedOnly]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return { rows, loading, error, refetch: fetchRows };
}

export function useCodingLeaderboardStats() {
  const [stats, setStats] = useState<CodingLeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_coding_leaderboard_stats");
      if (cancelled) return;
      if (!error && data && data.length > 0) {
        setStats(data[0] as CodingLeaderboardStats);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading };
}

export interface CodingLeaderboardUserRank {
  rank: number;
  user_id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  problems_solved: number;
  total_accepted: number;
  acceptance_rate: number;
  fastest_avg_runtime: number | null;
  weighted_score: number;
  last_accepted_at: string | null;
  total_ranked: number;
}

// Returns the current user's rank for the given window — even when the
// user is off the visible page. Used by the "Your current rank" card.
export function useCodingLeaderboardUserRank(
  userId: string | null | undefined,
  w: LeaderboardWindow,
) {
  const [data, setData] = useState<CodingLeaderboardUserRank | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: rows, error } = await supabase.rpc(
        "get_coding_leaderboard_user_rank" as never,
        { _user_id: userId, _window: w } as never,
      );
      if (cancelled) return;
      if (!error && rows && (rows as CodingLeaderboardUserRank[]).length > 0) {
        setData((rows as CodingLeaderboardUserRank[])[0]);
      } else {
        setData(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, w]);

  return { data, loading };
}

// ─── Rank delta tracking ───────────────────────────────────────────────
export interface CodingLeaderboardRankDelta {
  current_rank: number | null;
  yesterday_rank: number | null;
  week_ago_rank: number | null;
  delta_day: number | null;
  delta_week: number | null;
}

/**
 * Snapshot the caller's current rank for today (idempotent server-side).
 * Fire-and-forget on page mount so deltas have a baseline tomorrow.
 */
export async function snapshotMyCodingLeaderboardRank(): Promise<void> {
  try {
    await supabase.rpc("snapshot_my_coding_leaderboard_rank" as never);
  } catch {
    // Non-critical: ignore failures (anonymous users, hidden profiles, etc.)
  }
}

export function useCodingLeaderboardRankDelta(
  userId: string | null | undefined,
  w: LeaderboardWindow,
) {
  const [data, setData] = useState<CodingLeaderboardRankDelta | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: rows, error } = await supabase.rpc(
        "get_coding_leaderboard_rank_delta" as never,
        { _user_id: userId, _window: w } as never,
      );
      if (cancelled) return;
      if (!error && rows && (rows as CodingLeaderboardRankDelta[]).length > 0) {
        setData((rows as CodingLeaderboardRankDelta[])[0]);
      } else {
        setData(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, w]);

  return { data, loading };
}
