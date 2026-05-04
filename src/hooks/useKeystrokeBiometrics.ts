import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tier 5 behavioral biometrics: collects inter-keystroke intervals over
 * the lifetime of the secure session. The first ~PROFILE_MS of typing
 * forms the user's typing rhythm baseline (stored in
 * `contest_keystroke_profiles`). After the baseline is locked, every
 * SAMPLE_MS we compute a rolling sample and call
 * `contest_record_keystroke_sample` which compares it to the baseline
 * and auto-logs a `keystroke_drift` violation if similarity drops below
 * the server-side threshold.
 *
 * NOT a strict identity check — typing speed varies under fatigue —
 * but a reliable signal when a *different person* takes over typing.
 */
const PROFILE_MS = 60_000;            // collect 60s of typing for baseline
const SAMPLE_MS = 60_000;             // compare every 60s thereafter
const MIN_PROFILE_SAMPLES = 30;       // need ≥ 30 keystroke intervals
const MIN_ROLLING_SAMPLES = 15;

function stats(intervals: number[]) {
  const n = intervals.length;
  if (n === 0) {
    return { mean: 0, stddev: 0, median: 0, p90: 0, burstRatio: 0, n: 0 };
  }
  const sorted = [...intervals].sort((a, b) => a - b);
  const sum = intervals.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const variance = intervals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  const stddev = Math.sqrt(variance);
  const median = sorted[Math.floor(n / 2)] || 0;
  const p90 = sorted[Math.floor(n * 0.9)] || 0;
  const bursts = intervals.filter((i) => i < 50).length;
  return { mean, stddev, median, p90, burstRatio: bursts / n, n };
}

export function useKeystrokeBiometrics(opts: {
  contestId: string | undefined;
  sessionId: string | null;
  enabled: boolean;
}) {
  const { contestId, sessionId, enabled } = opts;
  const profileIntervalsRef = useRef<number[]>([]);
  const rollingIntervalsRef = useRef<number[]>([]);
  const lastKeyAtRef = useRef<number>(0);
  const profileLockedRef = useRef<boolean>(false);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !contestId || !sessionId) return;
    profileIntervalsRef.current = [];
    rollingIntervalsRef.current = [];
    lastKeyAtRef.current = 0;
    profileLockedRef.current = false;
    startedAtRef.current = performance.now();

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier-only keys
      if (
        e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta" ||
        e.key === "CapsLock" || e.key === "Tab"
      ) return;
      const now = performance.now();
      if (lastKeyAtRef.current > 0) {
        const dt = now - lastKeyAtRef.current;
        // Drop pauses > 5s (user thinking) — they pollute biometric stats
        if (dt > 0 && dt < 5000) {
          if (!profileLockedRef.current) {
            profileIntervalsRef.current.push(dt);
          } else {
            rollingIntervalsRef.current.push(dt);
          }
        }
      }
      lastKeyAtRef.current = now;
    };

    document.addEventListener("keydown", onKeyDown, true);

    // Try to lock the baseline after PROFILE_MS
    const baselineTimer = window.setTimeout(async () => {
      if (profileLockedRef.current) return;
      const s = stats(profileIntervalsRef.current);
      if (s.n < MIN_PROFILE_SAMPLES) {
        // Not enough typing yet; keep collecting and try again in 30s
        // (we just don't lock — rolling stays empty until baseline exists).
        // Re-attempt every 30s by re-arming below.
        const retry = window.setInterval(async () => {
          const s2 = stats(profileIntervalsRef.current);
          if (s2.n >= MIN_PROFILE_SAMPLES && !profileLockedRef.current) {
            window.clearInterval(retry);
            await supabase.rpc("contest_record_keystroke_profile" as never, {
              _contest_id: contestId,
              _session_id: sessionId,
              _mean: s2.mean,
              _stddev: s2.stddev,
              _median: s2.median,
              _p90: s2.p90,
              _burst_ratio: s2.burstRatio,
              _sample_size: s2.n,
            } as never);
            profileLockedRef.current = true;
          }
        }, 30_000);
        return;
      }
      await supabase.rpc("contest_record_keystroke_profile" as never, {
        _contest_id: contestId,
        _session_id: sessionId,
        _mean: s.mean,
        _stddev: s.stddev,
        _median: s.median,
        _p90: s.p90,
        _burst_ratio: s.burstRatio,
        _sample_size: s.n,
      } as never);
      profileLockedRef.current = true;
    }, PROFILE_MS);

    // Rolling samples for drift detection
    const sampleTimer = window.setInterval(async () => {
      if (!profileLockedRef.current) return;
      const s = stats(rollingIntervalsRef.current);
      rollingIntervalsRef.current = []; // reset window
      if (s.n < MIN_ROLLING_SAMPLES) return;
      await supabase.rpc("contest_record_keystroke_sample" as never, {
        _contest_id: contestId,
        _session_id: sessionId,
        _mean: s.mean,
        _stddev: s.stddev,
        _burst_ratio: s.burstRatio,
        _sample_size: s.n,
      } as never);
    }, SAMPLE_MS);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      window.clearTimeout(baselineTimer);
      window.clearInterval(sampleTimer);
    };
  }, [enabled, contestId, sessionId]);
}
