import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight admin sync — event-driven, NOT polling.
 *
 * Strategy:
 *  - React Query cache (staleTime 60s) serves pages instantly from memory; no
 *    refetch on navigation, mount, or window focus. Pages feel instant.
 *  - When ANOTHER admin tab performs a write, it calls `broadcastAdminChange()`
 *    which sends a Supabase broadcast. All other tabs receive it and refetch
 *    ONLY the currently-mounted (active) admin queries — not every cached
 *    query in memory. This avoids the loading-flicker storm.
 *
 * Mounted once in AdminShell.
 */
export const useAdminRealtimeSync = () => {
  const qc = useQueryClient();

  useEffect(() => {
    const ADMIN_PREFIXES = ["admin", "platform-settings", "dcs", "support-"];

    const refreshActive = () => {
      qc.invalidateQueries({
        // Only invalidate queries that have active observers (mounted components).
        // Everything else stays cached and serves instantly when revisited.
        type: "active",
        predicate: (q) => {
          const k = q.queryKey?.[0];
          return typeof k === "string" && ADMIN_PREFIXES.some((p) => k.startsWith(p));
        },
      });
    };

    const channel = supabase
      .channel("admin-realtime-sync", { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "changed" }, refreshActive)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
};

/** Call after any admin write to push an instant refresh to all other admin tabs. */
export const broadcastAdminChange = () => {
  try {
    supabase.channel("admin-realtime-sync").send({
      type: "broadcast",
      event: "changed",
      payload: { ts: Date.now() },
    });
  } catch {
    // best-effort
  }
};
