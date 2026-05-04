import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tier 5 behavioral biometrics: tracks mouse movement entropy over
 * sliding windows to flag bot-like input. Real human cursors have
 * micro-jitter and curved paths; scripted/simulated cursors tend to
 * move in straight lines with no idle time.
 *
 * Every WINDOW_MS we flush metrics to `contest_record_mouse_metrics`
 * which stores them and auto-logs a `mouse_bot_like` violation if
 * the heuristic in the RPC fires. The RPC is conservative: it only
 * warns (doesn't flag) so legitimate-but-fast users don't get DQ'd.
 */
const WINDOW_MS = 30_000;
const ENTROPY_BUCKETS = 16;          // direction histogram

interface Sample {
  t: number;
  x: number;
  y: number;
}

function shannonEntropyNormalized(angles: number[]): number {
  // Bucketize angles into ENTROPY_BUCKETS, return Shannon entropy / log2(N).
  if (angles.length === 0) return 0;
  const counts = new Array(ENTROPY_BUCKETS).fill(0);
  for (const a of angles) {
    const bucket = Math.min(
      ENTROPY_BUCKETS - 1,
      Math.floor(((a + Math.PI) / (2 * Math.PI)) * ENTROPY_BUCKETS),
    );
    counts[bucket]++;
  }
  const n = angles.length;
  let H = 0;
  for (const c of counts) {
    if (c > 0) {
      const p = c / n;
      H -= p * Math.log2(p);
    }
  }
  return H / Math.log2(ENTROPY_BUCKETS);
}

export function useMouseEntropy(opts: {
  contestId: string | undefined;
  sessionId: string | null;
  enabled: boolean;
}) {
  const { contestId, sessionId, enabled } = opts;
  const samplesRef = useRef<Sample[]>([]);
  const clicksRef = useRef<number>(0);
  const lastSampleAtRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !contestId || !sessionId) return;
    samplesRef.current = [];
    clicksRef.current = 0;
    lastSampleAtRef.current = 0;

    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      // Throttle to ~50ms — we don't need every browser event
      if (now - lastSampleAtRef.current < 50) return;
      lastSampleAtRef.current = now;
      samplesRef.current.push({ t: now, x: e.clientX, y: e.clientY });
      // Cap memory at ~5000 samples per window
      if (samplesRef.current.length > 5000) samplesRef.current.shift();
    };
    const onClick = () => { clicksRef.current++; };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mousedown", onClick, true);

    const flush = window.setInterval(async () => {
      const samples = samplesRef.current;
      const clicks = clicksRef.current;
      samplesRef.current = [];
      clicksRef.current = 0;
      if (samples.length < 5) {
        // Idle window — still record so admins see the gap
        await supabase.rpc("contest_record_mouse_metrics" as never, {
          _contest_id: contestId,
          _session_id: sessionId,
          _window_ms: WINDOW_MS,
          _move_count: samples.length,
          _click_count: clicks,
          _total_distance_px: 0,
          _path_entropy: 0,
          _idle_ratio: 1,
        } as never);
        return;
      }
      let totalDist = 0;
      const angles: number[] = [];
      let activeMs = 0;
      for (let i = 1; i < samples.length; i++) {
        const dx = samples[i].x - samples[i - 1].x;
        const dy = samples[i].y - samples[i - 1].y;
        const dist = Math.hypot(dx, dy);
        totalDist += dist;
        if (dist > 1) angles.push(Math.atan2(dy, dx));
        activeMs += Math.min(WINDOW_MS, samples[i].t - samples[i - 1].t);
      }
      const entropy = shannonEntropyNormalized(angles);
      const idleRatio = Math.max(0, 1 - activeMs / WINDOW_MS);
      await supabase.rpc("contest_record_mouse_metrics" as never, {
        _contest_id: contestId,
        _session_id: sessionId,
        _window_ms: WINDOW_MS,
        _move_count: samples.length,
        _click_count: clicks,
        _total_distance_px: totalDist,
        _path_entropy: entropy,
        _idle_ratio: idleRatio,
      } as never);
    }, WINDOW_MS);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onClick, true);
      window.clearInterval(flush);
    };
  }, [enabled, contestId, sessionId]);
}
