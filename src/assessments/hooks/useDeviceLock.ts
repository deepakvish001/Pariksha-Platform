import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Computes a stable browser fingerprint and pins it to the attempt on first
 * call. Subsequent calls compare and emit `device_change` when it differs —
 * the proctoring config typically auto-submits on this event.
 *
 * Lightweight, dependency-free fingerprint based on UA, platform, language,
 * screen geometry, timezone and a canvas hash. Not bullet-proof against a
 * determined attacker, but defeats casual session-handoff.
 */
function computeFingerprint(): string {
  const parts: string[] = [
    navigator.userAgent,
    navigator.language,
    // @ts-expect-error: not in all lib.dom versions
    navigator.userAgentData?.platform || navigator.platform,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? ""),
    String((navigator as { deviceMemory?: number }).deviceMemory ?? ""),
  ];
  try {
    const c = document.createElement("canvas");
    c.width = 200; c.height = 40;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(0, 0, 200, 40);
      ctx.fillStyle = "#069";
      ctx.fillText("byteskill-fp", 2, 2);
      parts.push(c.toDataURL().slice(-64));
    }
  } catch { /* canvas blocked */ }
  // djb2 hash → hex
  let h = 5381;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function useDeviceLock(opts: {
  attemptId: string | undefined;
  enabled: boolean;
  onMismatch: (current: string, stored: string) => void;
}) {
  const { attemptId, enabled, onMismatch } = opts;
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !attemptId || checkedRef.current) return;
    checkedRef.current = true;
    let cancelled = false;

    (async () => {
      const fp = computeFingerprint();
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select("device_fingerprint")
        .eq("id", attemptId)
        .maybeSingle();
      if (cancelled || error) return;

      const stored = data?.device_fingerprint ?? null;
      if (!stored) {
        await supabase
          .from("assessment_attempts")
          .update({ device_fingerprint: fp })
          .eq("id", attemptId);
        return;
      }
      if (stored !== fp) onMismatch(fp, stored);
    })();

    return () => { cancelled = true; };
  }, [attemptId, enabled, onMismatch]);
}
