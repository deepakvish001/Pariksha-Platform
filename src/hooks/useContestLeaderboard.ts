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
};

export const useContestLeaderboard = (contestId: string | undefined) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!contestId) return;
    const ch = supabase
      .channel(`contest-lb-${contestId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "contest_leaderboard_cache",
        filter: `contest_id=eq.${contestId}`,
      }, () => {
        qc.invalidateQueries({ queryKey: ["contest-leaderboard", contestId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc, contestId]);

  return useQuery({
    queryKey: ["contest-leaderboard", contestId],
    enabled: !!contestId,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<LeaderboardRow[]> => {
      const { data, error } = await supabase
        .from("contest_leaderboard_cache")
        .select("*")
        .eq("contest_id", contestId!)
        .order("rank", { ascending: true })
        .limit(500);
      if (error) throw error;
      const rows = (data ?? []) as LeaderboardRow[];
      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      if (ids.length === 0) return rows;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", ids);
      const map = new Map(
        (profiles ?? []).map((p: any) => [p.user_id, { display_name: p.full_name, avatar_url: p.avatar_url }]),
      );
      return rows.map((r) => ({ ...r, ...(map.get(r.user_id) ?? {}) }));
    },
  });
};
