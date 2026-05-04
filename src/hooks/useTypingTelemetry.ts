import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Records keystroke batches to `contest_typing_events` for the active
 * contest session. Used by `validate_contest_submission` to detect
 * paste-only submissions and by admins to audit suspicious bursts.
 *
 * The hook returns a `record(charsAdded)` callback that the editor
 * change handler should call on every change. Internally we batch
 * events every 2 seconds and detect bursts (>= 80 chars in < 300ms)
 * which are likely paste actions even if the clipboard API was bypassed.
 */
const BURST_CHARS = 80;
const BURST_MS = 300;
const FLUSH_MS = 2000;

interface PendingEvent {
  chars: number;
  startedAt: number;
  lastAt: number;
  burst: boolean;
}

export function useTypingTelemetry(opts: {
  contestId: string | undefined;
  sessionId: string | null;
  problemSlug: string | undefined;
  enabled: boolean;
  onBurst?: (chars: number, dtMs: number) => void;
}) {
  const { contestId, sessionId, problemSlug, enabled, onBurst } = opts;
  const { user } = useAuth();
  const pendingRef = useRef<PendingEvent | null>(null);
  const lastKeystrokeRef = useRef<number>(0);
  const onBurstRef = useRef(onBurst);
  onBurstRef.current = onBurst;

  // Periodic flusher
  useEffect(() => {
    if (!enabled || !contestId || !sessionId || !problemSlug || !user) return;
    const id = window.setInterval(() => {
      const ev = pendingRef.current;
      if (!ev || ev.chars <= 0) return;
      pendingRef.current = null;
      const dt = Math.max(1, ev.lastAt - ev.startedAt);
      void supabase
        .from("contest_typing_events" as never)
        .insert({
          contest_id: contestId,
          user_id: user.id,
          session_id: sessionId,
          problem_slug: problemSlug,
          char_count: ev.chars,
          dt_ms: dt,
          is_burst: ev.burst,
        } as never);
      if (ev.burst) {
        onBurstRef.current?.(ev.chars, dt);
      }
    }, FLUSH_MS);
    return () => window.clearInterval(id);
  }, [enabled, contestId, sessionId, problemSlug, user]);

  const record = (charsAdded: number) => {
    if (!enabled || charsAdded <= 0) return;
    const now = performance.now();
    const dt = now - (lastKeystrokeRef.current || now);
    lastKeystrokeRef.current = now;
    const burstNow = charsAdded >= BURST_CHARS && dt < BURST_MS;
    const cur = pendingRef.current;
    if (!cur) {
      pendingRef.current = { chars: charsAdded, startedAt: now, lastAt: now, burst: burstNow };
    } else {
      cur.chars += charsAdded;
      cur.lastAt = now;
      cur.burst = cur.burst || burstNow;
    }
  };

  return { record };
}
