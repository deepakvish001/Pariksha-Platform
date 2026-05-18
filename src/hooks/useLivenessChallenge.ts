// Layer 3 — Active liveness challenge runner.
//
// Schedules a random liveness prompt every 4-7 minutes during a contest
// session. When a prompt fires, the consumer renders <LivenessChallengeDialog>
// which captures a webcam frame and calls the edge function for AI verdict.

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signContestFunctionCall } from "@/hooks/useContestSessionSigner";

export interface ActiveChallenge {
  challengeId: string;
  type: "fingers" | "head_turn" | "color_card";
  prompt: Record<string, unknown>;
  expiresAt: string;
}

function nextDelayMs(): number {
  // 4–7 minutes
  return 240_000 + Math.floor(Math.random() * 180_000);
}

export function useLivenessChallenge(opts: {
  sessionId: string | null | undefined;
  enabled: boolean;
}) {
  const { sessionId, enabled } = opts;
  const [active, setActive] = useState<ActiveChallenge | null>(null);
  const timerRef = useRef<number | null>(null);

  const issue = useCallback(async () => {
    if (!sessionId) return;
    try {
      const body = { mode: "issue", sessionId };
      const headers = await signContestFunctionCall("contest-liveness-challenge", body);
      const { data, error } = await supabase.functions.invoke("contest-liveness-challenge", {
        body,
        headers: headers ?? undefined,
      });
      if (error || !data?.ok || !data.challengeId) return;
      setActive({
        challengeId: data.challengeId,
        type: data.type,
        prompt: data.prompt ?? {},
        expiresAt: data.expiresAt,
      });
    } catch { /* noop */ }
  }, [sessionId]);

  const submit = useCallback(
    async (imageDataUrl: string): Promise<{ ok: boolean; reason?: string }> => {
      if (!active) return { ok: false, reason: "no_active_challenge" };
      const body = { mode: "submit", challengeId: active.challengeId, imageDataUrl };
      const headers = await signContestFunctionCall("contest-liveness-challenge", body);
      const { data, error } = await supabase.functions.invoke("contest-liveness-challenge", {
        body,
        headers: headers ?? undefined,
      });
      setActive(null);
      if (error) return { ok: false, reason: error.message };
      return { ok: !!data?.ok, reason: data?.verdict?.reason };
    },
    [active],
  );

  // Scheduler
  useEffect(() => {
    if (!enabled || !sessionId) return;
    const schedule = () => {
      timerRef.current = window.setTimeout(async () => {
        await issue();
        schedule();
      }, nextDelayMs());
    };
    schedule();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [enabled, sessionId, issue]);

  return { active, submit, dismiss: () => setActive(null) };
}
