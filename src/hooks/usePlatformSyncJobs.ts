import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { SupportedPlatform } from "./usePlatformStats";

export interface SyncJob {
  user_id: string;
  platform: SupportedPlatform;
  handle: string;
  interval_hours: number;
  next_run_at: string;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
  enabled: boolean;
}

export const usePlatformSyncJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setJobs([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("user_platform_sync_jobs")
      .select("*").eq("user_id", user.id);
    setJobs((data as SyncJob[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const upsertJob = useCallback(
    async (platform: SupportedPlatform, handle: string, interval_hours: number, enabled: boolean) => {
      if (!user) return;
      const next = new Date(Date.now() + interval_hours * 3600 * 1000).toISOString();
      await supabase.from("user_platform_sync_jobs").upsert({
        user_id: user.id, platform, handle, interval_hours,
        enabled, next_run_at: next,
      }, { onConflict: "user_id,platform" });
      await refresh();
    },
    [user, refresh]
  );

  const removeJob = useCallback(async (platform: SupportedPlatform) => {
    if (!user) return;
    await supabase.from("user_platform_sync_jobs").delete()
      .eq("user_id", user.id).eq("platform", platform);
    await refresh();
  }, [user, refresh]);

  return { jobs, loading, upsertJob, removeJob, refresh };
};
