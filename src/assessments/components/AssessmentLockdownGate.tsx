import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Camera, Maximize2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  attemptId: string;
  /** Called once camera is granted and fullscreen requested. Receives the live stream. */
  onReady: (stream: MediaStream) => void;
}

/**
 * Blocks the assessment until the candidate grants webcam + enters fullscreen
 * and acknowledges the rules. Same UX in preview to mirror candidate reality.
 */
export function AssessmentLockdownGate({ attemptId, onReady }: Props) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  const log = (kind: string, payload: Record<string, unknown> = {}) => {
    supabase
      .from("attempt_events")
      .insert({ attempt_id: attemptId, kind, payload: payload as never })
      .then(() => {});
  };

  const requestCamera = async () => {
    setBusy(true);
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      setStream(s);
      log("webcam_grant");
    } catch (e) {
      setError(
        e instanceof Error
          ? `Camera blocked: ${e.message}. Allow camera in your browser to continue.`
          : "Camera permission required."
      );
      log("webcam_deny", { error: String(e) });
    } finally {
      setBusy(false);
    }
  };

  const enterSecure = async () => {
    if (!stream || !acknowledged) return;
    setBusy(true);
    try {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // some browsers (Safari iOS) reject — we proceed anyway
      }
      log("lockdown_enter");
      onReady(stream);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to enter secure mode.");
      log("lockdown_fail", { error: String(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="theme-b2b min-h-screen grid place-items-center bg-gradient-to-b from-background via-background to-muted/30 p-4">
      <Card className="max-w-2xl w-full overflow-hidden shadow-xl border-primary/20">
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-b border-border px-6 py-5 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/15 grid place-items-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Secure Assessment Mode</h1>
            <p className="text-xs text-muted-foreground">
              This assessment is proctored. Follow the steps below to begin.
            </p>
          </div>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* Step 1: camera */}
          <Step
            n={1}
            title="Enable your camera"
            done={!!stream}
            icon={<Camera className="h-4 w-4" />}
          >
            {stream ? (
              <div className="flex items-center gap-3">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className="w-32 h-24 rounded-md border border-emerald-500/40 object-cover bg-black"
                />
                <span className="text-xs text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Camera active
                </span>
              </div>
            ) : (
              <Button size="sm" onClick={requestCamera} disabled={busy}>
                <Camera className="h-4 w-4 mr-2" />
                Allow camera access
              </Button>
            )}
          </Step>

          {/* Step 2: rules */}
          <Step
            n={2}
            title="Acknowledge the rules"
            done={acknowledged}
            icon={<AlertTriangle className="h-4 w-4" />}
          >
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
              <li>Stay in fullscreen for the entire attempt.</li>
              <li>Do not switch tabs, windows, or apps.</li>
              <li>Copy, paste, right-click, printing and developer tools are blocked.</li>
              <li>Your webcam will be sampled periodically for review.</li>
              <li>
                <strong>3 violations auto-submit</strong> your attempt immediately.
              </li>
            </ul>
            <label className="flex items-start gap-2 mt-3 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              />
              <span>I understand and agree to the rules above.</span>
            </label>
          </Step>

          {/* Step 3: enter */}
          <Step
            n={3}
            title="Enter secure fullscreen"
            done={false}
            icon={<Maximize2 className="h-4 w-4" />}
          >
            <Button
              onClick={enterSecure}
              disabled={!stream || !acknowledged || busy}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Enter secure mode & start
            </Button>
          </Step>

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

function Step({
  n,
  title,
  done,
  icon,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={
          "h-7 w-7 shrink-0 rounded-full grid place-items-center text-xs font-bold border " +
          (done
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "border-border bg-muted text-muted-foreground")
        }
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : n}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          <span>{title}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
