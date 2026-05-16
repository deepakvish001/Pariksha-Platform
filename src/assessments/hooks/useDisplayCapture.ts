import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Wraps `getDisplayMedia` to require a full-screen share and watch for
 * second-monitor extensions. Polls every 5s. Samples a single frame every
 * `frameIntervalSec` (default 20s) and uploads it to the `assessment-proctor`
 * bucket, enqueuing a snapshot for AI review.
 *
 * Emits two callbacks: `onSecondMonitor` (one-shot) and `onShareLost`.
 */
export function useDisplayCapture(opts: {
  attemptId: string | undefined;
  enabled: boolean;
  frameIntervalSec?: number;
  onSecondMonitor?: () => void;
  onShareLost?: () => void;
}) {
  const { attemptId, enabled, frameIntervalSec = 20, onSecondMonitor, onShareLost } = opts;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onSecondRef = useRef(onSecondMonitor);
  const onLostRef = useRef(onShareLost);
  onSecondRef.current = onSecondMonitor;
  onLostRef.current = onShareLost;

  const request = useCallback(async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        video: { displaySurface: "monitor" } as any,
        audio: false,
      });
      const track = s.getVideoTracks()[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const surface = (track?.getSettings() as any)?.displaySurface;
      if (surface && surface !== "monitor") {
        s.getTracks().forEach((t) => t.stop());
        setError("Please share your ENTIRE screen, not just a window or tab.");
        return null;
      }
      setStream(s);
      return s;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Screen share denied");
      return null;
    }
  }, []);

  // Track loss
  useEffect(() => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    const onEnd = () => {
      setStream(null);
      onLostRef.current?.();
    };
    track.addEventListener("ended", onEnd);
    return () => track.removeEventListener("ended", onEnd);
  }, [stream]);

  // Second-monitor poll
  useEffect(() => {
    if (!enabled) return;
    const check = () => {
      const ext = (window.screen as Screen & { isExtended?: boolean }).isExtended;
      if (ext) onSecondRef.current?.();
    };
    check();
    const id = window.setInterval(check, 5000);
    return () => window.clearInterval(id);
  }, [enabled]);

  // Frame sampling → storage + snapshots table
  useEffect(() => {
    if (!enabled || !attemptId || !stream) return;
    let cancelled = false;
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.srcObject = stream;
    videoRef.current = v;
    void v.play().catch(() => { /* noop */ });

    const c = document.createElement("canvas");

    const snap = async () => {
      if (cancelled || v.readyState < 2) return;
      c.width = 640;
      c.height = Math.round((v.videoHeight / v.videoWidth) * 640) || 360;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(v, 0, 0, c.width, c.height);
      const blob: Blob | null = await new Promise((res) =>
        c.toBlob((b) => res(b), "image/jpeg", 0.5)
      );
      if (!blob || cancelled) return;
      const ts = Date.now();
      const path = `${attemptId}/screen-${ts}.jpg`;
      const { error } = await supabase.storage
        .from("assessment-proctor")
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (!error) {
        await supabase
          .from("assessment_proctor_snapshots")
          .insert({ attempt_id: attemptId, source: "screen", storage_path: path });
      }
    };

    const initial = window.setTimeout(snap, 3000);
    const id = window.setInterval(snap, frameIntervalSec * 1000);
    return () => {
      cancelled = true;
      window.clearTimeout(initial);
      window.clearInterval(id);
    };
  }, [enabled, attemptId, stream, frameIntervalSec]);

  return { stream, request, error };
}
