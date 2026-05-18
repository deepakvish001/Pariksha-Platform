// Layer 3 — UI for active liveness prompts.
//
// Renders a modal dialog that captures a webcam frame and submits it to the
// liveness-challenge edge function for AI verification. On timeout the dialog
// auto-submits a blank frame which the server will reject as a fail.

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, ShieldAlert } from "lucide-react";
import type { ActiveChallenge } from "@/hooks/useLivenessChallenge";

interface Props {
  challenge: ActiveChallenge | null;
  onSubmit: (imageDataUrl: string) => Promise<{ ok: boolean; reason?: string }>;
}

export function LivenessChallengeDialog({ challenge, onSubmit }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start camera + countdown when a challenge is active.
  useEffect(() => {
    if (!challenge) return;
    let cancelled = false;
    setError(null);
    setSecondsLeft(Math.max(5, Math.floor((new Date(challenge.expiresAt).getTime() - Date.now()) / 1000)));

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setError("Camera access denied. The challenge will fail.");
      }
    })();

    const interval = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [challenge]);

  // Auto-submit when timer hits 0.
  useEffect(() => {
    if (!challenge || secondsLeft > 0 || busy) return;
    void handleCapture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const handleCapture = async () => {
    if (!challenge || busy) return;
    setBusy(true);
    let dataUrl = "data:image/png;base64,";
    const video = videoRef.current;
    if (video && video.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        dataUrl = canvas.toDataURL("image/jpeg", 0.75);
      }
    }
    const result = await onSubmit(dataUrl);
    setBusy(false);
    if (!result.ok) {
      setError(result.reason ?? "Verification failed. Your session has been flagged.");
    }
  };

  if (!challenge) return null;

  const promptText = (challenge.prompt as { hint?: string })?.hint ?? "Verify your presence.";

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Identity check
          </DialogTitle>
          <DialogDescription>{promptText}</DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          <div className="absolute right-2 top-2 rounded bg-background/80 px-2 py-1 text-xs font-mono">
            {secondsLeft}s
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button onClick={handleCapture} disabled={busy} className="w-full">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
          {busy ? "Verifying…" : "Capture & verify"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
