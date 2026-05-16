import { useEffect, useRef } from "react";

/**
 * Lightweight typing analytics: records keystroke rate and flags sustained
 * super-human bursts (cpm > `cpmCap` for >= `windowSec`). Emits a
 * `typing_burst` callback that the proctoring hook turns into a strike.
 *
 * Designed to attach to ANY <input>/<textarea>/Monaco container via a single
 * `onChange(prevLength, nextLength)` invocation per keystroke. Keeps a rolling
 * 10s window in memory.
 */
export function useTypingAnalytics(opts: {
  cpmCap?: number;
  windowSec?: number;
  onBurst: (cpm: number) => void;
}) {
  const { cpmCap = 800, windowSec = 10, onBurst } = opts;
  const eventsRef = useRef<{ t: number; chars: number }[]>([]);
  const lastBurstRef = useRef(0);
  const onBurstRef = useRef(onBurst);
  onBurstRef.current = onBurst;

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = performance.now();
      const cutoff = now - windowSec * 1000;
      const arr = eventsRef.current.filter((e) => e.t > cutoff);
      eventsRef.current = arr;
      const totalChars = arr.reduce((s, e) => s + e.chars, 0);
      const cpm = (totalChars / windowSec) * 60;
      if (cpm > cpmCap && now - lastBurstRef.current > 15_000) {
        lastBurstRef.current = now;
        onBurstRef.current(Math.round(cpm));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [windowSec, cpmCap]);

  const record = (chars: number) => {
    if (chars <= 0) return;
    eventsRef.current.push({ t: performance.now(), chars });
  };

  return { record };
}
