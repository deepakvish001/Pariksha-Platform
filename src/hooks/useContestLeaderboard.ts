import { useEffect } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LeaderboardRow = {
  contest_id: string;
  user_id: string;
  rank: number;
  total_points: number;
  total_penalty_seconds: number;
  problems_solved: number;
  last_solve_at: string | null;
  updated_at: string;
  display_name?: string;
  avatar_url?: string | null;
  trust_score?: number | null;
  trust_risk?: string | null;
};

export type LeaderboardPage = {
  rows: LeaderboardRow[];
  total: number;
};

export const useContestLeaderboard = (
  contestId: string | undefined,
  page: number = 1,
  pageSize: number = 50,
) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!contestId) return;
    const ch = supabase
      .channel(`contest-lb-${contestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contest_leaderboard_cache",
          filter: `contest_id=eq.${contestId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["contest-leaderboard", contestId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contest_trust_scores",
          filter: `contest_id=eq.${contestId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["contest-leaderboard", contestId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc, contestId]);

  return useQuery({
    queryKey: ["contest-leaderboard", contestId, page, pageSize],
    enabled: !!contestId,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<LeaderboardPage> => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from("contest_leaderboard_cache")
        .select("*", { count: "exact" })
        .eq("contest_id", contestId!)
        .order("rank", { ascending: true })
        .range(from, to);
      if (error) throw error;
      const rows = (data ?? []) as LeaderboardRow[];
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      let enriched = rows;
      if (ids.length > 0) {
        const [{ data: profiles }, { data: scores }] = await Promise.all([
          supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url")
            .in("user_id", ids),
          supabase
            .from("contest_trust_scores")
            .select("user_id, score, risk, computed_at")
            .eq("contest_id", contestId!)
            .in("user_id", ids)
            .order("computed_at", { ascending: false }),
        ]);
        const profileMap = new Map(
          (profiles ?? []).map((p: any) => [
            p.user_id,
            { display_name: p.full_name, avatar_url: p.avatar_url },
          ]),
        );
        // Keep only the latest score per user (rows arrive newest-first)
        const trustMap = new Map<string, { trust_score: number; trust_risk: string }>();
        for (const s of (scores ?? []) as Array<{ user_id: string; score: number; risk: string }>) {
          if (!trustMap.has(s.user_id)) {
            trustMap.set(s.user_id, { trust_score: s.score, trust_risk: s.risk });
          }
        }
        enriched = rows.map((r) => ({
          ...r,
          ...(profileMap.get(r.user_id) ?? {}),
          ...(trustMap.get(r.user_id) ?? { trust_score: null, trust_risk: null }),
        }));
      }
      return { rows: enriched, total: count ?? enriched.length };
    },
  });
};

// Lightweight hook for fetching only the current user's row (for the "Your rank" card)
export const useMyContestLeaderboardRow = (contestId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey: ["contest-leaderboard-me", contestId, userId],
    enabled: !!contestId && !!userId,
    queryFn: async (): Promise<LeaderboardRow | null> => {
      const { data, error } = await supabase
        .from("contest_leaderboard_cache")
        .select("*")
        .eq("contest_id", contestId!)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data as LeaderboardRow | null) ?? null;
    },
  });
};
