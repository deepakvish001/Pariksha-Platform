import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Detects developer-tools usage during a contest using two complementary
 * heuristics:
 *  1) The classic `debugger`/console-getter timing trap — when devtools
 *     are open, evaluating a `debugger` statement (or accessing a custom
 *     getter via `console.log`) takes measurably longer.
 *  2) Window-vs-viewport size delta — docked devtools shrinks the
 *     viewport relative to outer window; popped-out devtools doesn't,
 *     so the timing trap covers that case.
 *
 * On detection, logs a `devtools_open` violation with severity 'warn'
 * (per project policy: counts toward the DQ threshold, but does not
 * auto-DQ on its own — there are too many legitimate reasons devtools
 * may be open at session start).
 *
 * The hook re-checks every 1.5s and only logs once every 60s to avoid
 * spamming `contest_violations` if the user keeps devtools open.
 */
const CHECK_INTERVAL_MS = 1500;
const REPORT_COOLDOWN_MS = 60_000;
const TIMING_THRESHOLD_MS = 100;

export function useDevtoolsDetector(opts: {
  contestId: string | undefined;
  sessionId: string | null | undefined;
  enabled: boolean;
  onDetected?: () => void;
}) {
  const { contestId, sessionId, enabled, onDetected } = opts;
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled || !contestId || !sessionId || !user) return;
    let cancelled = false;
    let lastReportAt = 0;

    const report = async (reason: string) => {
      const now = Date.now();
      if (now - lastReportAt < REPORT_COOLDOWN_MS) return;
      lastReportAt = now;
      onDetected?.();
      try {
        await supabase.rpc("contest_log_violation" as never, {
          _contest_id: contestId,
          _session_id: sessionId,
          _type: "devtools_open",
          _severity: "warn",
          _meta: { reason },
        } as never);
      } catch { /* ignore */ }
    };

    // Heuristic 1: timing trap via console.log getter
    const probe = {} as { id?: number };
    Object.defineProperty(probe, "id", {
      get() {
        // If devtools is rendering this object's properties, this getter
        // is invoked synchronously and we can flag.
        // The flag is captured by a closure variable below.
        (probe as unknown as { __triggered: boolean }).__triggered = true;
        return "devtools";
      },
    });

    const checkTiming = (): boolean => {
      const start = performance.now();
      // eslint-disable-next-line no-console
      console.log(probe);
      // eslint-disable-next-line no-console
      console.clear();
      const dt = performance.now() - start;
      return dt > TIMING_THRESHOLD_MS || !!(probe as unknown as { __triggered: boolean }).__triggered;
    };

    // Heuristic 2: viewport delta
    const checkSize = (): boolean => {
      const wDiff = window.outerWidth - window.innerWidth;
      const hDiff = window.outerHeight - window.innerHeight;
      // Browsers reserve ~16px for scrollbars + chrome; >160 strongly
      // suggests a docked devtools panel.
      return wDiff > 200 || hDiff > 200;
    };

    const tick = () => {
      if (cancelled) return;
      try {
        if (checkSize()) void report("viewport_delta");
        else if (checkTiming()) void report("timing_trap");
      } catch { /* ignore */ }
    };

    // First check after a short delay so the page can settle.
    const t = window.setTimeout(tick, 1000);
    const id = window.setInterval(tick, CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      window.clearInterval(id);
    };
  }, [enabled, contestId, sessionId, user, onDetected]);
}
