import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Tier 5 in-contest sensor: samples the participant's screen-share
 * stream every ~SAMPLE_MS, uploads a JPEG frame to the private
 * `contest-screen-frames` bucket, and triggers
 * `contest-screen-frame-analyze` for AI inspection.
 *
 * Also enforces the **monitor-only** display surface invariant: if the
 * track settings show `displaySurface` flipped to `window` or `browser`
 * (i.e. participant re-shared a single window/tab to hide other apps),
 * we instantly log a `flag` violation. The existing 5-strike system
 * will auto-DQ on accumulation.
 */
const SAMPLE_MS = 90_000;             // 90s between frame samples
const FRAME_W = 1280;
const FRAME_H = 800;

interface Opts {
  contestId: string | undefined;
  sessionId: string | null;
  stream: MediaStream | null;
  enabled: boolean;
}

export function useScreenFrameSampler({ contestId, sessionId, stream, enabled }: Opts) {
  const { user } = useAuth();
  const intervalRef = useRef<number | null>(null);
  const lastSurfaceRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !stream || !contestId || !sessionId || !user) return;
    let cancelled = false;

    // ---- Surface guard: detect non-monitor share ----
    const track = stream.getVideoTracks()[0];
    const checkSurface = () => {
      if (!track) return;
      const settings = track.getSettings() as MediaTrackSettings & { displaySurface?: string };
      const surface = settings.displaySurface ?? "unknown";
      if (lastSurfaceRef.current && lastSurfaceRef.current !== surface) {
        // changed mid-session
        if (surface === "window" || surface === "browser") {
          toast.error("You re-shared a window/tab — full screen is required", {
            description: "This action has been flagged.",
          });
          void supabase.rpc("contest_log_violation" as never, {
            _contest_id: contestId,
            _session_id: sessionId,
            _type: "screen_surface_changed",
            _severity: "flag",
            _meta: { from: lastSurfaceRef.current, to: surface },
          } as never);
        }
      }
      lastSurfaceRef.current = surface;
    };
    checkSurface();
    const surfaceInterval = window.setInterval(checkSurface, 5_000);

    // ---- Frame sampler ----
    const captureAndUpload = async () => {
      if (cancelled || !stream.active) return;
      const t = stream.getVideoTracks()[0];
      if (!t) return;
      try {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        await video.play().catch(() => { /* autoplay blocked */ });
        // Wait one frame so dimensions populate
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const w = Math.min(video.videoWidth || FRAME_W, FRAME_W);
        const h = Math.min(video.videoHeight || FRAME_H, FRAME_H);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, w, h);
        const blob: Blob | null = await new Promise((r) => canvas.toBlob((b) => r(b), "image/jpeg", 0.65));
        video.pause();
        if (!blob || cancelled) return;
        const path = `${user.id}/${contestId}/${sessionId}/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("contest-screen-frames")
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (upErr) {
          console.warn("screen frame upload failed", upErr.message);
          return;
        }
        const settings = (t.getSettings() as MediaTrackSettings & { displaySurface?: string });
        await supabase.functions.invoke("contest-screen-frame-analyze", {
          body: {
            contest_id: contestId,
            session_id: sessionId,
            storage_path: path,
            surface_kind: settings.displaySurface ?? "unknown",
          },
        });
      } catch (e) {
        console.warn("screen frame capture failed", e);
      }
    };

    // First sample after 30s, then every SAMPLE_MS
    const firstTimer = window.setTimeout(captureAndUpload, 30_000);
    intervalRef.current = window.setInterval(captureAndUpload, SAMPLE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(firstTimer);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      window.clearInterval(surfaceInterval);
    };
  }, [enabled, stream, contestId, sessionId, user]);
}
