import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActiveSessionState {
  loading: boolean;
  hasActive: boolean;
  sessionId: string | null;
  invalidatedJustNow: boolean;
}

/**
 * Subscribes to the user's contest_sessions row(s) for a given contest and
 * exposes whether an active session currently exists. When an active session
 * flips to inactive (e.g. another device logged in, or admin/auto-DQ), the
 * `invalidatedJustNow` flag flips true once so callers can show a dialog.
 */
export function useActiveContestSession(contestId: string | undefined) {
  const { user } = useAuth();
  const [state, setState] = useState<ActiveSessionState>({
    loading: true,
    hasActive: false,
    sessionId: null,
    invalidatedJustNow: false,
  });

  useEffect(() => {
    if (!contestId || !user) {
      setState({ loading: false, hasActive: false, sessionId: null, invalidatedJustNow: false });
      return;
    }
    let cancelled = false;

    const refresh = async () => {
      const { data } = await supabase
        .from("contest_sessions")
        .select("id, is_active")
        .eq("contest_id", contestId)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      const active = !!data?.is_active;
      setState((prev) => ({
        loading: false,
        hasActive: active,
        sessionId: active ? (data?.id ?? null) : null,
        invalidatedJustNow: prev.hasActive && !active ? true : prev.invalidatedJustNow,
      }));
    };

    void refresh();

    const channel = supabase
      .channel(`contest-sessions-${contestId}-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contest_sessions",
          filter: `contest_id=eq.${contestId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { user_id?: string } | undefined;
          if (row?.user_id !== user.id) return;
          void refresh();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [contestId, user]);

  return {
    ...state,
    acknowledgeInvalidation: () =>
      setState((s) => ({ ...s, invalidatedJustNow: false })),
  };
}
