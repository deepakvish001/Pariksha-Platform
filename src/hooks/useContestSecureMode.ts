import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ViolationType =
  | "tab_blur"
  | "paste"
  | "copy"
  | "context_menu"
  | "fullscreen_exit"
  | "webcam_denied"
  | "session_invalidated";

export interface SecureModeState {
  sessionId: string | null;
  starting: boolean;
  startError: string | null;
  violationCount: number;
  flagged: boolean;
  disqualified: boolean;
  fullscreen: boolean;
  webcamReady: boolean;
}

const SNAPSHOT_INTERVAL_MS = 60_000;
const HEARTBEAT_INTERVAL_MS = 20_000;
const FLAG_THRESHOLD = 3;
const DQ_THRESHOLD = 5;

export function useContestSecureMode(contestId: string | undefined, enabled: boolean) {
  const { user } = useAuth();
  const [state, setState] = useState<SecureModeState>({
    sessionId: null,
    starting: false,
    startError: null,
    violationCount: 0,
    flagged: false,
    disqualified: false,
    fullscreen: false,
    webcamReady: false,
  });
  const sessionRef = useRef<string | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const snapshotTimerRef = useRef<number | null>(null);

  // Start the secure session
  const start = useCallback(async () => {
    if (!user || !contestId) return;
    setState((s) => ({ ...s, starting: true, startError: null }));
    const { data, error } = await supabase.rpc("contest_start_secure_session" as never, {
      _contest_id: contestId,
      _user_agent: navigator.userAgent,
    } as never);
    if (error) {
      setState((s) => ({ ...s, starting: false, startError: error.message }));
      return;
    }
    sessionRef.current = data as unknown as string;
    setState((s) => ({ ...s, starting: false, sessionId: data as unknown as string }));
  }, [user, contestId]);

  // Log a violation
  const logViolation = useCallback(
    async (type: ViolationType, severity: "warn" | "flag" | "fatal" = "warn", meta: Record<string, unknown> = {}) => {
      if (!contestId || !sessionRef.current) return;
      const { data, error } = await supabase.rpc("contest_log_violation" as never, {
        _contest_id: contestId,
        _session_id: sessionRef.current,
        _type: type,
        _severity: severity,
        _meta: meta,
      } as never);
      if (error) return;
      const res = data as { violation_count: number; flagged: boolean; disqualified: boolean };
      setState((s) => ({
        ...s,
        violationCount: res.violation_count,
        flagged: res.flagged,
        disqualified: res.disqualified,
      }));
      if (res.disqualified) {
        toast.error("You have been disqualified from this contest", {
          description: "Too many violations were recorded.",
        });
      } else if (res.violation_count >= FLAG_THRESHOLD) {
        toast.warning(`Warning ${res.violation_count}/${DQ_THRESHOLD}: action flagged`, {
          description: "Repeated violations will disqualify you.",
        });
      } else {
        toast.warning(`Violation ${res.violation_count}/${DQ_THRESHOLD}: ${type.replace("_", " ")}`);
      }
    },
    [contestId],
  );

  // Tab blur, copy/paste, context menu, fullscreen exit
  useEffect(() => {
    if (!enabled || !state.sessionId || state.disqualified) return;
    const onBlur = () => {
      if (document.hidden) logViolation("tab_blur");
    };
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation("paste");
    };
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation("copy");
    };
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logViolation("context_menu");
    };
    const onFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setState((s) => ({ ...s, fullscreen: isFs }));
      if (!isFs) logViolation("fullscreen_exit");
    };
    document.addEventListener("visibilitychange", onBlur);
    document.addEventListener("paste", onPaste);
    document.addEventListener("copy", onCopy);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("visibilitychange", onBlur);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, [enabled, state.sessionId, state.disqualified, logViolation]);

  // Request fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setState((s) => ({ ...s, fullscreen: true }));
    } catch (e) {
      // user gesture required — surfaced via UI
    }
  }, []);

  // Webcam: request and snapshot every minute
  const requestWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
      videoStreamRef.current = stream;
      setState((s) => ({ ...s, webcamReady: true }));
    } catch {
      setState((s) => ({ ...s, webcamReady: false }));
      logViolation("webcam_denied", "flag");
    }
  }, [logViolation]);

  // Periodic snapshot
  useEffect(() => {
    if (!enabled || !state.webcamReady || !state.sessionId || !user || !contestId) return;
    const captureAndUpload = async () => {
      const stream = videoStreamRef.current;
      if (!stream) return;
      const track = stream.getVideoTracks()[0];
      if (!track) return;
      try {
        const video = document.createElement("video");
        video.srcObject = stream;
        await video.play();
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.6),
        );
        video.pause();
        if (!blob) return;
        const path = `${user.id}/${contestId}/${Date.now()}.jpg`;
        const { error } = await supabase.storage.from("contest-proctor").upload(path, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });
        if (!error) {
          await supabase.from("contest_proctor_snapshots" as never).insert({
            contest_id: contestId,
            user_id: user.id,
            session_id: sessionRef.current,
            storage_path: path,
          } as never);
        }
      } catch {
        /* swallow snapshot errors */
      }
    };
    void captureAndUpload();
    snapshotTimerRef.current = window.setInterval(captureAndUpload, SNAPSHOT_INTERVAL_MS);
    return () => {
      if (snapshotTimerRef.current) window.clearInterval(snapshotTimerRef.current);
    };
  }, [enabled, state.webcamReady, state.sessionId, user, contestId]);

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      videoStreamRef.current?.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    };
  }, []);

  return {
    ...state,
    start,
    enterFullscreen,
    requestWebcam,
    logViolation,
  };
}
