import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Maximize2, MonitorUp, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ProctoringConfig } from "../lib/proctoringConfig";
import { CameraPermissionHelp } from "./CameraPermissionHelp";

interface Props {
  attemptId: string;
  config?: ProctoringConfig;
  /** Called once camera (and screen-share, if required) are granted. */
  onReady: (stream: MediaStream, screen: MediaStream | null) => void;
}

/**
 * Final hand-off into the proctored player. By the time we get here the
 * candidate has already cleared the full Preflight flow (identity, camera
 * permission, mic test, Third Eye pairing, rules acknowledgment), so this
 * gate's only job is to:
 *   1. Re-acquire a fresh camera stream for the player
 *   2. Acquire screen-share if required (must be triggered by a user gesture)
 *   3. Enter fullscreen and hand off
 *
 * No duplicate identity/rules/Third Eye steps here — those belong to Preflight.
 */
export function AssessmentLockdownGate({ attemptId, config, onReady }: Props) {
  const requireScreen = !!config?.require_screen_share;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screen, setScreen] = useState<MediaStream | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [camError, setCamError] = useState<unknown | null>(null);
  const [preferredDeviceId, setPreferredDeviceId] = useState<string>("");
  const handedOffRef = useRef(false);

  const log = (kind: string, payload: Record<string, unknown> = {}) => {
    supabase
      .from("attempt_events")
      .insert({ attempt_id: attemptId, kind, payload: payload as never })
      .then(() => {});
  };

  const requestCamera = async (deviceId?: string) => {
    setBusy(true);
    setCamError(null);
    try {
      const id = deviceId ?? preferredDeviceId;
      const s = await navigator.mediaDevices.getUserMedia({
        video: id
          ? { deviceId: { exact: id }, width: 320, height: 240 }
          : { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      setStream(s);
      log("webcam_grant");
    } catch (e) {
      setCamError(e);
      log("webcam_deny", { error: String(e) });
    } finally {
      setBusy(false);
    }
  };

  // Auto-acquire camera on mount — permission was already granted in Preflight.
  useEffect(() => {
    void requestCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestScreen = async () => {
    setBusy(true);
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
        return;
      }
      setScreen(s);
    } catch (e) {
      setError(
        e instanceof Error ? `Screen share blocked: ${e.message}` : "Screen share required.",
      );
    } finally {
      setBusy(false);
    }
  };

  const canStart = !!stream && (!requireScreen || !!screen);

  const enterSecure = async () => {
    if (!canStart || !stream || handedOffRef.current) return;
    handedOffRef.current = true;
    setBusy(true);
    try {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // some browsers (Safari iOS) reject — proceed anyway
      }
      log("lockdown_enter");
      onReady(stream, screen);
    } catch (e) {
      handedOffRef.current = false;
      setError(e instanceof Error ? e.message : "Failed to enter secure mode.");
      log("lockdown_fail", { error: String(e) });
    } finally {
      setBusy(false);
    }
  };

  // Auto-hand-off as soon as we're ready AND no screen-share gesture is needed.
  // If screen-share IS required, the user must click the button (browsers
  // require a user gesture for getDisplayMedia + fullscreen).
  useEffect(() => {
    if (canStart && !requireScreen && !handedOffRef.current) {
      void enterSecure();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canStart, requireScreen]);

  return (
    <div className="theme-b2b min-h-screen grid place-items-center bg-gradient-to-b from-background via-background to-muted/30 p-4">
      <Card className="max-w-md w-full overflow-hidden shadow-xl border-primary/20">
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-b border-border px-6 py-5 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/15 grid place-items-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Entering secure mode…</h1>
            <p className="text-xs text-muted-foreground">
              Final hand-off before your test begins.
            </p>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          {camError ? (
            <CameraPermissionHelp
              error={camError}
              busy={busy}
              onRetry={() => requestCamera(preferredDeviceId)}
              onDeviceChange={(id) => {
                setPreferredDeviceId(id);
                return requestCamera(id);
              }}
            />
          ) : !stream ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Re-connecting your camera…
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Camera ready
            </div>
          )}

          {requireScreen && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Share your <b>entire screen</b> so the proctor can monitor for unauthorized
                tools. Your browser will pop up a picker — choose your monitor and click Share.
              </p>
              {screen ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" /> Screen sharing active
                </div>
              ) : (
                <Button
                  onClick={requestScreen}
                  disabled={busy || !stream}
                  className="w-full"
                >
                  <MonitorUp className="h-4 w-4 mr-2" />
                  Share entire screen & start
                </Button>
              )}
            </div>
          )}

          {canStart && requireScreen && (
            <Button
              onClick={enterSecure}
              disabled={busy}
              className="w-full bg-gradient-to-r from-primary to-primary/80"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Enter secure mode & start
            </Button>
          )}

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
