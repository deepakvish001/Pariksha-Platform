import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Single-tab / single-device guard for an active contest. Combines a same-
 * origin BroadcastChannel (instant detection of a sibling tab) with a
 * server-side `contest_claim_tab_lock` heartbeat (catches tabs that the
 * BroadcastChannel couldn't see, e.g. a different browser profile).
 *
 * When this tab is displaced, `displaced` flips true. Callers should show
 * a blocking dialog and stop interacting with the contest.
 */
const CLAIM_INTERVAL_MS = 15_000;

export function useContestTabLock(contestId: string | undefined, enabled: boolean) {
  const { user } = useAuth();
  const [displaced, setDisplaced] = useState(false);
  const tabIdRef = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  );

  useEffect(() => {
    if (!enabled || !contestId || !user) return;
    const tabId = tabIdRef.current;
    let cancelled = false;
    let intervalId: number | null = null;
    let bc: BroadcastChannel | null = null;

    const claim = async () => {
      if (cancelled) return;
      const { data } = await supabase.rpc("contest_claim_tab_lock" as never, {
        _contest_id: contestId,
        _tab_id: tabId,
      } as never);
      if (cancelled) return;
      const res = data as { ok: boolean; displaced_tab_id?: string | null } | null;
      if (res?.displaced_tab_id && res.displaced_tab_id !== tabId) {
        // Notify the displaced tab so it shows the dialog instantly
        bc?.postMessage({ type: "displaced", tabId: res.displaced_tab_id, by: tabId });
      }
    };

    try {
      bc = new BroadcastChannel(`byteskill:contest:${contestId}`);
      bc.onmessage = (ev) => {
        if (!ev.data) return;
        if (ev.data.type === "claim" && ev.data.tabId && ev.data.tabId !== tabId) {
          // Another tab just claimed — older tab steps down.
          setDisplaced(true);
        }
        if (ev.data.type === "displaced" && ev.data.tabId === tabId) {
          setDisplaced(true);
        }
      };
      bc.postMessage({ type: "claim", tabId });
    } catch {
      // BroadcastChannel unsupported — server-side lock still applies.
    }

    void claim();
    intervalId = window.setInterval(claim, CLAIM_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      try { bc?.close(); } catch { /* ignore */ }
    };
  }, [enabled, contestId, user]);

  return { displaced, tabId: tabIdRef.current };
}
