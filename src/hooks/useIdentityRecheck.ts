import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Periodically captures a selfie from the existing webcam stream and runs
 * `contest-identity-verify` against the most recent proctor snapshot.
 * Triggers every `intervalMs` (default 5 min) — far less aggressive than
 * the per-minute snapshot loop so we don't blow through Gemini quota.
 *
 * Reuses the existing `contest-proctor` snapshots as the reference image
 * (the very first verified selfie/ID is implicitly the trust anchor for
 * the session, so any subsequent snapshot should match it).
 */
export function useIdentityRecheck(opts: {
  contestId: string | undefined;
  sessionId: string | null | undefined;
  webcamStream: MediaStream | null;
  enabled: boolean;
  intervalMs?: number;
}) {
  const { contestId, sessionId, webcamStream, enabled, intervalMs = 5 * 60_000 } = opts;
  const { user } = useAuth();
  const lastRunRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !contestId || !sessionId || !webcamStream || !user) return;
    let cancelled = false;

    const captureAndVerify = async () => {
      const now = Date.now();
      if (now - lastRunRef.current < intervalMs - 1000) return;
      lastRunRef.current = now;
      try {
        const track = webcamStream.getVideoTracks()[0];
        if (!track) return;
        const video = document.createElement("video");
        video.srcObject = webcamStream;
        await video.play();
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob: Blob | null = await new Promise((r) => canvas.toBlob((b) => r(b), "image/jpeg", 0.7));
        video.pause();
        if (!blob || cancelled) return;
        const path = `${user.id}/${contestId}/${sessionId}/recheck-${now}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("contest-identity")
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (upErr) return;

        // Find the most recent verified initial check selfie as the reference.
        const { data: initial } = await supabase
          .from("contest_identity_checks" as never)
          .select("selfie_path")
          .eq("session_id", sessionId)
          .eq("kind", "initial")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const ref = (initial as { selfie_path?: string } | null)?.selfie_path;
        if (!ref) return; // nothing to compare against yet

        await supabase.functions.invoke("contest-identity-verify", {
          body: {
            contest_id: contestId,
            session_id: sessionId,
            kind: "recheck",
            selfie_path: path,
            id_document_path: ref, // server uses this as fallback ref when reference_snapshot_path absent
          },
        });
      } catch (e) {
        console.warn("identity recheck failed", e);
      }
    };

    // First run after 30s, then every intervalMs
    const t = window.setTimeout(captureAndVerify, 30_000);
    const id = window.setInterval(captureAndVerify, intervalMs);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      window.clearInterval(id);
    };
  }, [enabled, contestId, sessionId, webcamStream, user, intervalMs]);
}
