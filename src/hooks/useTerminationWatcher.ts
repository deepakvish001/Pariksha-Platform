import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TerminationState {
  terminated: boolean;
  reason: string | null;
  severity: string | null;
  at: number | null;
}

/**
 * Listens for a hard-mode auto-terminate kill-signal on the
 * `session:<id>` Realtime channel emitted by `contest-violation-engine`.
 *
 * Also polls `contest_sessions.terminated_at` once on mount so a candidate
 * who reloads the page after termination still sees the lockout — the
 * Realtime broadcast is fire-and-forget and won't replay.
 */
export function useTerminationWatcher(sessionId: string | null): TerminationState {
  const [state, setState] = useState<TerminationState>({
    terminated: false, reason: null, severity: null, at: null,
  });

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    // Reload guard
    (async () => {
      const { data } = await supabase
        .from("contest_sessions")
        .select("terminated_at, terminated_reason")
        .eq("id", sessionId)
        .maybeSingle();
      if (cancelled || !data?.terminated_at) return;
      const [reason, severity] = String(data.terminated_reason ?? ":").split(":");
      setState({
        terminated: true,
        reason: reason || "terminated",
        severity: severity || "critical",
        at: new Date(data.terminated_at).getTime(),
      });
    })();

    const ch = supabase
      .channel(`session:${sessionId}`)
      .on("broadcast", { event: "terminated" }, (msg) => {
        const p = (msg.payload ?? {}) as { reason?: string; severity?: string; at?: number };
        setState({
          terminated: true,
          reason: p.reason ?? "terminated",
          severity: p.severity ?? "critical",
          at: p.at ?? Date.now(),
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(ch);
    };
  }, [sessionId]);

  return state;
}
