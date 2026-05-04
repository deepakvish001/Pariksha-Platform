import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CHUNK_MS = 30_000;
const BITRATE = 500_000;

interface RecorderState {
  sharing: boolean;
  recording: boolean;
  error: string | null;
  stream: MediaStream | null;
}

/**
 * Captures the participant's screen via getDisplayMedia and uploads ~30s
 * webm chunks to the private `contest-screen-recordings` bucket while
 * inserting a row into `contest_screen_recordings` per chunk. The recency
 * of these chunks is used by `validate_contest_submission` server-side.
 */
export function useScreenRecorder(opts: {
  contestId: string | undefined;
  sessionId: string | null;
  enabled: boolean;
  onScreenShareStopped?: () => void;
}) {
  const { contestId, sessionId, enabled, onScreenShareStopped } = opts;
  const { user } = useAuth();
  const [state, setState] = useState<RecorderState>({
    sharing: false,
    recording: false,
    error: null,
    stream: null,
  });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    try { recorderRef.current?.stop(); } catch { /* ignore */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    streamRef.current = null;
    setState({ sharing: false, recording: false, error: null, stream: null });
  }, []);

  const requestShare = useCallback(async () => {
    if (!enabled) return;
    try {
      const stream: MediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 5, max: 10 } },
        audio: false,
      });
      streamRef.current = stream;
      setState((s) => ({ ...s, sharing: true, stream, error: null }));

      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        onScreenShareStopped?.();
        stop();
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Screen share denied";
      setState((s) => ({ ...s, sharing: false, error: msg }));
    }
  }, [enabled, onScreenShareStopped, stop]);

  // Start chunked recorder once we have a stream + session
  useEffect(() => {
    if (!enabled || !state.stream || !sessionId || !contestId || !user) return;
    let cancelled = false;

    const startChunkLoop = () => {
      if (cancelled || !streamRef.current) return;
      let mr: MediaRecorder;
      try {
        mr = new MediaRecorder(streamRef.current, {
          mimeType: "video/webm;codecs=vp9",
          videoBitsPerSecond: BITRATE,
        });
      } catch {
        try {
          mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
        } catch (e) {
          setState((s) => ({ ...s, error: "MediaRecorder unsupported" }));
          return;
        }
      }
      recorderRef.current = mr;
      const chunks: Blob[] = [];
      const startedAt = new Date();

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = async () => {
        if (cancelled) return;
        const blob = new Blob(chunks, { type: "video/webm" });
        if (blob.size > 0) {
          const path = `${user.id}/${contestId}/${sessionId}/${startedAt.getTime()}.webm`;
          try {
            const { error: upErr } = await supabase.storage
              .from("contest-screen-recordings")
              .upload(path, blob, { contentType: "video/webm", upsert: false });
            if (!upErr) {
              await supabase.from("contest_screen_recordings" as never).insert({
                contest_id: contestId,
                user_id: user.id,
                session_id: sessionId,
                storage_path: path,
                started_at: startedAt.toISOString(),
                duration_sec: Math.round(CHUNK_MS / 1000),
              } as never);
            }
          } catch { /* swallow */ }
        }
        // Loop next chunk if still sharing
        if (!cancelled && streamRef.current && streamRef.current.active) {
          startChunkLoop();
        }
      };

      mr.start();
      setState((s) => ({ ...s, recording: true }));
      window.setTimeout(() => {
        try { mr.state !== "inactive" && mr.stop(); } catch { /* ignore */ }
      }, CHUNK_MS);
    };

    startChunkLoop();
    return () => {
      cancelled = true;
      try { recorderRef.current?.stop(); } catch { /* ignore */ }
    };
  }, [enabled, state.stream, sessionId, contestId, user]);

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return { ...state, requestShare, stop };
}
