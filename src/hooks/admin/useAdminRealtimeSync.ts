import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Keeps every admin-* React Query cache live.
 *
 * Strategy:
 *  1. Aggressive auto-refetch: every 10s invalidate all queries whose key starts
 *     with "admin", "platform-settings", "dcs", or "support-". This guarantees
 *     freshness for the dozens of admin pages without needing to enable Postgres
 *     realtime publication on every table.
 *  2. Refetch immediately when the tab regains focus.
 *  3. Listen to a lightweight broadcast channel so any admin action performed in
 *     another tab triggers an instant refresh here.
 *
 * Mount once (inside AdminShell) — covers every admin page.
 */
export const useAdminRealtimeSync = () => {
  const qc = useQueryClient();

  useEffect(() => {
    const ADMIN_PREFIXES = ["admin", "platform-settings", "dcs", "support-"];

    const refreshAll = () => {
      qc.invalidateQueries({
        predicate: (q) => {
          const k = q.queryKey?.[0];
          return typeof k === "string" && ADMIN_PREFIXES.some((p) => k.startsWith(p));
        },
      });
    };

    // 1. Poll every 10s
    const interval = window.setInterval(refreshAll, 10_000);

    // 2. Refresh on tab focus / visibility change
    const onFocus = () => refreshAll();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshAll();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    // 3. Cross-tab realtime broadcast — any admin can publish "changed" and
    //    every other admin tab refreshes instantly.
    const channel = supabase
      .channel("admin-realtime-sync", { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "changed" }, refreshAll)
      .subscribe();

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
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
