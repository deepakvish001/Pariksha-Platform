import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signContestFunctionCall } from "@/hooks/useContestSessionSigner";

/**
 * Layer 4 — Behavioral baselining.
 *
 * Phase 1 (first 60s of active session): collect a calibration profile of
 * the candidate's keystroke inter-arrival times and mouse-movement speed,
 * then submit it once.
 *
 * Phase 2 (every 60s thereafter): collect a rolling window and POST it to
 * the `evaluate` endpoint. The server compares against the locked baseline
 * via z-scores and self-reports `behavioral_drift` violations when the
 * profile drifts beyond expected bounds (suggests a candidate swap).
 *
 * All metrics are aggregates — no raw keystrokes leave the browser.
 */
export function useBehavioralBaseline(sessionId: string | null, enabled: boolean) {
  const keyTimesRef = useRef<number[]>([]);
  const mouseSpeedsRef = useRef<number[]>([]);
  const lastKeyRef = useRef<number>(0);
  const lastMouseRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const calibratedRef = useRef(false);

  // ---- Collectors ----
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const onKey = () => {
      const now = performance.now();
      if (lastKeyRef.current) {
        const dt = now - lastKeyRef.current;
        // Drop unrealistic gaps (held-key autorepeats / paused-away spans).
        if (dt > 25 && dt < 2000) keyTimesRef.current.push(dt);
      }
      lastKeyRef.current = now;
      // Cap buffer to avoid memory growth.
      if (keyTimesRef.current.length > 400) keyTimesRef.current.splice(0, 200);
    };

    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      const prev = lastMouseRef.current;
      lastMouseRef.current = { x: e.clientX, y: e.clientY, t: now };
      if (!prev) return;
      const dt = now - prev.t;
      if (dt <= 0 || dt > 500) return;
      const d = Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
      const speed = d / dt; // px per ms
      if (speed > 0 && speed < 10) mouseSpeedsRef.current.push(speed);
      if (mouseSpeedsRef.current.length > 600) mouseSpeedsRef.current.splice(0, 300);
    };

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("mousemove", onMove, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("mousemove", onMove, true);
    };
  }, [enabled, sessionId]);

  // ---- Scheduler: 60s calibrate, then evaluate every 60s ----
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const summarize = () => {
      const keys = keyTimesRef.current.slice();
      const mice = mouseSpeedsRef.current.slice();
      const meanK = mean(keys);
      const stdK = std(keys, meanK);
      const meanM = mean(mice);
      const stdM = std(mice, meanM);
      return {
        mean_inter_key_ms: round(meanK),
        std_inter_key_ms: round(stdK),
        mean_mouse_speed: round(meanM, 4),
        std_mouse_speed: round(stdM, 4),
        sample_n: keys.length,
      };
    };

    const send = async (mode: "submit_baseline" | "evaluate") => {
      const metrics = summarize();
      if (metrics.sample_n < 8) return; // insufficient data this window
      try {
        const body = { mode, sessionId, metrics };
        const headers = await signContestFunctionCall("contest-behavioral-baseline", body);
        const { data } = await supabase.functions.invoke("contest-behavioral-baseline", {
          body,
          ...(headers ? { headers } : {}),
        });
        if (mode === "submit_baseline" && data?.ok) calibratedRef.current = true;
      } catch { /* silent — engine has other signals */ }
    };

    const calibrateAt = window.setTimeout(() => {
      void send("submit_baseline");
      // Reset window so evaluations measure post-calibration behavior.
      keyTimesRef.current = [];
      mouseSpeedsRef.current = [];
    }, 60_000);

    const evalInterval = window.setInterval(() => {
      if (!calibratedRef.current) return;
      void send("evaluate");
      // Rolling window — keep last ~30% for continuity.
      const k = keyTimesRef.current;
      const m = mouseSpeedsRef.current;
      keyTimesRef.current = k.slice(Math.floor(k.length * 0.7));
      mouseSpeedsRef.current = m.slice(Math.floor(m.length * 0.7));
    }, 60_000);

    return () => {
      window.clearTimeout(calibrateAt);
      window.clearInterval(evalInterval);
    };
  }, [enabled, sessionId]);
}

function mean(xs: number[]) {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}
function std(xs: number[], mu: number) {
  if (xs.length < 2) return 0;
  let s = 0;
  for (const x of xs) s += (x - mu) ** 2;
  return Math.sqrt(s / (xs.length - 1));
}
function round(x: number, places = 2) {
  const f = 10 ** places;
  return Math.round(x * f) / f;
}
