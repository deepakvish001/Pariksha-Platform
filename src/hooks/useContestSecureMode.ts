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
  online: boolean;
  reconnecting: boolean;
  lastReconnectAt: number | null;
  /** Epoch ms timestamp of the next scheduled heartbeat retry (null when idle). */
  nextRetryAt: number | null;
}

const SNAPSHOT_INTERVAL_MS = 60_000;
const HEARTBEAT_INTERVAL_MS = 20_000;
const FLAG_THRESHOLD = 3;
const DQ_THRESHOLD = 5;

const LS_PREFIX = "byteskill:secure-session:";
const lsKey = (contestId: string) => `${LS_PREFIX}${contestId}`;

interface PersistedSession {
  sessionId: string;
  contestId: string;
  savedAt: number;
}

function loadPersisted(contestId: string | undefined): PersistedSession | null {
  if (!contestId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(lsKey(contestId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    if (parsed?.sessionId && parsed.contestId === contestId) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function savePersisted(contestId: string, sessionId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      lsKey(contestId),
      JSON.stringify({ sessionId, contestId, savedAt: Date.now() } satisfies PersistedSession),
    );
  } catch {
    /* ignore */
  }
}

function clearPersisted(contestId: string | undefined) {
  if (!contestId || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(lsKey(contestId));
  } catch {
    /* ignore */
  }
}

export function useContestSecureMode(contestId: string | undefined, enabled: boolean) {
  const { user } = useAuth();
  const persisted = loadPersisted(contestId);
  const [state, setState] = useState<SecureModeState>({
    sessionId: persisted?.sessionId ?? null,
    starting: false,
    startError: null,
    violationCount: 0,
    flagged: false,
    disqualified: false,
    fullscreen: false,
    webcamReady: false,
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    reconnecting: false,
    lastReconnectAt: null,
    nextRetryAt: null,
  });
  const sessionRef = useRef<string | null>(persisted?.sessionId ?? null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const snapshotTimerRef = useRef<number | null>(null);
  const wasReconnectingRef = useRef(false);

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
    const newId = data as unknown as string;
    sessionRef.current = newId;
    savePersisted(contestId, newId);
    setState((s) => ({ ...s, starting: false, sessionId: newId }));
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

  // Heartbeat with reconnect + persistence-aware. On a fresh page load with
  // a persisted sessionId, the first ping confirms whether the server still
  // considers us alive. If yes, heartbeat resumes seamlessly. If no, we
  // clear local state without forcing a relogin — the user can press
  // "Start Secure Session" again.
  const pingFnRef = useRef<(() => Promise<void>) | null>(null);
  useEffect(() => {
    if (!enabled || !state.sessionId || state.disqualified) return;
    let cancelled = false;
    let intervalId: number | null = null;
    let retryTimer: number | null = null;
    let backoff = 2_000;

    const scheduleRetry = () => {
      if (cancelled) return;
      if (retryTimer) window.clearTimeout(retryTimer);
      const delay = backoff;
      const eta = Date.now() + delay;
      setState((s) => ({ ...s, nextRetryAt: eta }));
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        void ping();
      }, delay);
      backoff = Math.min(backoff * 2, 30_000);
    };

    const ping = async () => {
      if (cancelled) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setState((s) => (s.online && !s.reconnecting ? { ...s, online: false, reconnecting: true } : s));
        scheduleRetry();
        return;
      }
      try {
        const { data, error } = await supabase.rpc("contest_session_heartbeat" as never, {
          _session_id: sessionRef.current,
        } as never);
        if (cancelled) return;
        const res = data as { ok: boolean; code?: string } | null;
        if (error) {
          setState((s) => ({ ...s, online: false, reconnecting: true }));
          scheduleRetry();
          return;
        }
        if (res && !res.ok) {
          // Server says session is gone — clear localStorage so we don't
          // keep trying a dead id on next refresh.
          clearPersisted(contestId);
          sessionRef.current = null;
          setState((s) => ({
            ...s,
            sessionId: null,
            online: true,
            reconnecting: false,
            nextRetryAt: null,
          }));
          return;
        }
        // Success — clear reconnect state, surface a toast if we just recovered.
        backoff = 2_000;
        if (wasReconnectingRef.current) {
          toast.success("Heartbeat resumed", {
            description: "Your secure session is active again.",
          });
          wasReconnectingRef.current = false;
        }
        setState((s) =>
          s.reconnecting || !s.online || s.nextRetryAt
            ? { ...s, online: true, reconnecting: false, lastReconnectAt: Date.now(), nextRetryAt: null }
            : s,
        );
      } catch {
        if (cancelled) return;
        setState((s) => ({ ...s, online: false, reconnecting: true }));
        scheduleRetry();
      }
    };
    pingFnRef.current = ping;

    void ping();
    intervalId = window.setInterval(ping, HEARTBEAT_INTERVAL_MS);

    const onOnline = () => {
      backoff = 2_000;
      void ping();
    };
    const onOffline = () => {
      setState((s) => ({ ...s, online: false, reconnecting: true }));
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      cancelled = true;
      pingFnRef.current = null;
      if (intervalId) window.clearInterval(intervalId);
      if (retryTimer) window.clearTimeout(retryTimer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [enabled, state.sessionId, state.disqualified, contestId]);

  // Track reconnecting transitions so we can fire the resume toast exactly once.
  useEffect(() => {
    if (state.reconnecting) wasReconnectingRef.current = true;
  }, [state.reconnecting]);

  // Manual reconnect (HUD button) — kicks the heartbeat immediately.
  const reconnect = useCallback(async () => {
    setState((s) => ({ ...s, reconnecting: true }));
    if (pingFnRef.current) await pingFnRef.current();
  }, []);

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      videoStreamRef.current?.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    };
  }, []);

  /**
   * True only when the heartbeat is healthy and the session is live. UI
   * surfaces (Submit button) should gate on this so users can't fire off
   * submissions during a known network gap. The server enforces the same
   * rule via `validate_contest_submission`.
   */
  const submissionAllowed =
    !!state.sessionId && state.online && !state.reconnecting && !state.disqualified;

  return {
    ...state,
    submissionAllowed,
    start,
    enterFullscreen,
    requestWebcam,
    logViolation,
    reconnect,
  };
}
