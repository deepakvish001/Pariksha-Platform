import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Optional, opt-in audio proctoring. Captures a short (~6s) microphone
 * snippet every 2 minutes, uploads it to the private `contest-audio`
 * bucket, and triggers `contest-audio-analyze` to run STT + multi-voice
 * detection. The hook is no-op until `consented = true` AND `enabled = true`.
 *
 * UX rules:
 *  - Never starts without explicit user consent (passed in via `consented`).
 *  - Surfaces stream errors via `error` so the gate UI can show them.
 *  - Cleans up the MediaStream on unmount or when consent is revoked.
 */
const SNIPPET_MS = 6_000;
const INTERVAL_MS = 120_000;

export function useAudioMonitor(opts: {
  contestId: string | undefined;
  sessionId: string | null | undefined;
  enabled: boolean;
  consented: boolean;
}) {
  const { contestId, sessionId, enabled, consented } = opts;
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const captureAndUpload = useCallback(async () => {
    if (!streamRef.current || !contestId || !sessionId || !user) return;
    try {
      const mr = new MediaRecorder(streamRef.current, { mimeType: "audio/webm" });
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      const stopped = new Promise<void>((resolve) => { mr.onstop = () => resolve(); });
      mr.start();
      await new Promise((r) => setTimeout(r, SNIPPET_MS));
      mr.stop();
      await stopped;
      const blob = new Blob(chunks, { type: "audio/webm" });
      if (blob.size === 0) return;
      const path = `${user.id}/${contestId}/${sessionId}/${Date.now()}.webm`;
      const { error: upErr } = await supabase.storage
        .from("contest-audio")
        .upload(path, blob, { contentType: "audio/webm", upsert: false });
      if (upErr) {
        console.warn("audio upload failed", upErr.message);
        return;
      }
      // Fire and forget — analysis is async.
      void supabase.functions.invoke("contest-audio-analyze", {
        body: {
          contest_id: contestId,
          session_id: sessionId,
          storage_path: path,
          duration_sec: SNIPPET_MS / 1000,
        },
      });
    } catch (e) {
      console.warn("audio capture error", e);
    }
  }, [contestId, sessionId, user]);

  useEffect(() => {
    if (!enabled || !consented || !contestId || !sessionId || !user) {
      stop();
      return;
    }
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setActive(true);
        setError(null);
        // First sample immediately, then every INTERVAL_MS
        void captureAndUpload();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Microphone access denied";
        setError(msg);
        setActive(false);
      }
    };
    void start();

    const id = window.setInterval(() => { void captureAndUpload(); }, INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      stop();
    };
  }, [enabled, consented, contestId, sessionId, user, captureAndUpload, stop]);

  return { active, error, stop };
}
