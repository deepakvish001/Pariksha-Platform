import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SupportedPlatform =
  | "leetcode"
  | "codeforces"
  | "codechef"
  | "geeksforgeeks"
  | "hackerrank"
  | "hackerearth";

export interface PlatformStat {
  id: string;
  user_id: string;
  platform: SupportedPlatform;
  handle: string;
  rating: number | null;
  solved_easy: number;
  solved_medium: number;
  solved_hard: number;
  solved_total: number;
  sync_status: string;
  sync_error: string | null;
  last_synced_at: string;
}

export const PLATFORM_LABELS: Record<SupportedPlatform, string> = {
  leetcode: "LeetCode",
  codeforces: "Codeforces",
  codechef: "CodeChef",
  geeksforgeeks: "GeeksforGeeks",
  hackerrank: "HackerRank",
  hackerearth: "HackerEarth",
};

export const usePlatformStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<SupportedPlatform | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setStats([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("user_platform_stats")
      .select("*")
      .eq("user_id", user.id)
      .order("platform");
    setStats((data as PlatformStat[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const syncPlatform = useCallback(
    async (platform: SupportedPlatform, handle: string) => {
      if (!user) throw new Error("Not signed in");
      setSyncing(platform);
      try {
        const { data, error } = await supabase.functions.invoke("fetch-coding-profiles", {
          body: { platform, handle },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        const row = {
          user_id: user.id,
          platform,
          handle,
          rating: data.rating,
          solved_easy: data.solved.easy,
          solved_medium: data.solved.medium,
          solved_hard: data.solved.hard,
          solved_total: data.solved.total,
          raw: data.raw ?? {},
          sync_status: data.sync_status ?? "ok",
          sync_error: data.sync_error ?? null,
          last_synced_at: new Date().toISOString(),
        };
        const { error: upErr } = await supabase
          .from("user_platform_stats")
          .upsert(row, { onConflict: "user_id,platform" });
        if (upErr) throw upErr;
        await refresh();
        return data;
      } finally {
        setSyncing(null);
      }
    },
    [user, refresh]
  );

  const removePlatform = useCallback(
    async (platform: SupportedPlatform) => {
      if (!user) return;
      await supabase
        .from("user_platform_stats")
        .delete()
        .eq("user_id", user.id)
        .eq("platform", platform);
      await refresh();
    },
    [user, refresh]
  );

  return { stats, loading, syncing, syncPlatform, removePlatform, refresh };
};
