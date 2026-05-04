import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TrustScore {
  score: number;
  risk: "low" | "medium" | "high";
  reasons: string[];
  computedAt: string;
}

/**
 * Subscribes to the latest trust score for the current user in a contest.
 * Realtime updates flow in as the proctor edge function writes new rows.
 */
export function useContestTrustScore(contestId: string | undefined) {
  const { user } = useAuth();
  const [latest, setLatest] = useState<TrustScore | null>(null);

  useEffect(() => {
    if (!contestId || !user) return;
    let cancelled = false;

    const refresh = async () => {
      const { data } = await supabase
        .from("contest_trust_scores" as never)
        .select("score, risk, reasons, computed_at")
        .eq("contest_id", contestId)
        .eq("user_id", user.id)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled || !data) return;
      const row = data as unknown as {
        score: number; risk: "low" | "medium" | "high"; reasons: unknown; computed_at: string;
      };
      setLatest({
        score: row.score,
        risk: row.risk,
        reasons: Array.isArray(row.reasons) ? (row.reasons as string[]) : [],
        computedAt: row.computed_at,
      });
    };
    void refresh();

    const channel = supabase
      .channel(`trust-${contestId}-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "contest_trust_scores",
          filter: `contest_id=eq.${contestId}`,
        },
        (payload) => {
          const row = payload.new as { user_id?: string };
          if (row?.user_id === user.id) void refresh();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [contestId, user]);

  return latest;
}
