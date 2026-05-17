import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, CheckCircle2, ShieldCheck, RotateCcw, WifiOff } from "lucide-react";
import { useWebrtcStream } from "@/hooks/useWebrtcStream";
import { SideEyeReadyCheck } from "@/assessments/components/SideEyeReadyCheck";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assessment-sidecam`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const FRAME_INTERVAL_MS = 6000;
const FRAME_WIDTH = 480;
const FRAME_HEIGHT = 360;
const JPEG_QUALITY = 0.55;

/**
 * Mobile "Third Eye" page. Opened by scanning the QR shown to the candidate
 * during lockdown. The phone keeps the rear camera open and uploads a small
 * JPEG every few seconds for the duration of the assessment.
 */
export default function SideCameraPage() {
  const { token = "" } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "streaming" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [framesSent, setFramesSent] = useState(0);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);

  // Publish the rear-camera feed live to proctors via WebRTC, keyed by the
  // pairing token (same token already authenticates snapshot uploads).
  useWebrtcStream({
    channelId: status === "streaming" && token ? `proctor:sidecam:${token}` : null,
    role: "publisher",
    localStream: liveStream,
  });

  const call = async (action: string, init?: RequestInit) => {
    const res = await fetch(`${FN_URL}?action=${action}&token=${encodeURIComponent(token)}`, {
      ...init,
      headers: {
        apikey: ANON,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    return res.json().catch(() => ({}));
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLiveStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const captureAndUpload = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    try {
      const r = await fetch(`${FN_URL}?action=upload`, {
        method: "POST",
        headers: {
          apikey: ANON,
          "Content-Type": "application/json",
          "x-pair-token": token,
        },
        body: JSON.stringify({ dataUrl }),
      });
      if (r.ok) setFramesSent((n) => n + 1);
    } catch {
      /* keep streaming */
    }
  };

  const start = async () => {
    setStatus("connecting");
    setError(null);
    try {
      // Probe the pairing first so we can show the pair-code
      const meta = await call("status");
      if (meta?.error) throw new Error("Invalid or expired pairing link.");
      setPairCode(meta.pairCode ?? null);

      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = s;
      setLiveStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => {});
      }
      await call("connect", { method: "POST" });
      setStatus("streaming");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Camera access failed.");
    }
  };

  useEffect(() => {
    if (status !== "streaming") return;
    const id = window.setInterval(captureAndUpload, FRAME_INTERVAL_MS);
    captureAndUpload();
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Continuous side-cam recording — uploads ~165s WebM chunks via the
  // pair-token-authenticated `chunk-upload` action so the phone stream can
  // be replayed alongside the candidate's webcam + screen later.
  useEffect(() => {
    if (status !== "streaming" || !streamRef.current) return;
    const stream = streamRef.current;
    let seq = 0;
    let stopped = false;
    const sessionId = (crypto as { randomUUID?: () => string })?.randomUUID?.()
      ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const mimeCandidates = ["video/webm;codecs=vp8,opus", "video/webm"];
    const mime = mimeCandidates.find((m) =>
      typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m),
    ) ?? "video/webm";

    let rec: MediaRecorder | null = null;
    let timer: number | null = null;

    const startCycle = () => {
      if (stopped) return;
      const chunks: BlobPart[] = [];
      const startedAt = new Date();
      try {
        rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 600_000 });
      } catch {
        return;
      }
      const mySeq = seq++;
      rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunks, { type: mime });
        const endedAt = new Date();
        try {
          const qs = new URLSearchParams({
            action: "chunk-upload",
            token,
            sessionId,
            seq: String(mySeq),
            startedAt: startedAt.toISOString(),
            endedAt: endedAt.toISOString(),
            durationMs: String(endedAt.getTime() - startedAt.getTime()),
            mime,
          });
          await fetch(`${FN_URL}?${qs}`, {
            method: "POST",
            headers: { apikey: ANON, "Content-Type": "application/octet-stream" },
            body: blob,
          });
        } catch { /* drop on phone; live frames still cover */ }
        if (!stopped) startCycle();
      };
      try { rec.start(); } catch { return; }
      timer = window.setTimeout(() => {
        try { rec?.state === "recording" && rec.stop(); } catch { /* noop */ }
      }, 165_000);
    };

    startCycle();
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      try { rec?.state === "recording" && rec.stop(); } catch { /* noop */ }
    };
  }, [status, token]);

  useEffect(() => {
    const onUnload = () => {
      navigator.sendBeacon?.(
        `${FN_URL}?action=disconnect&token=${encodeURIComponent(token)}`
      );
    };
    window.addEventListener("pagehide", onUnload);
    return () => {
      window.removeEventListener("pagehide", onUnload);
      stop();
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 flex flex-col items-center justify-center">
      <Card className="w-full max-w-md shadow-xl border-primary/30">
        <div className="bg-gradient-to-br from-primary/15 to-transparent border-b px-5 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 grid place-items-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold">Third Eye Side Camera</h1>
            <p className="text-[11px] text-muted-foreground">
              Keep your phone propped beside you facing your desk for the entire test.
            </p>
          </div>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border bg-black">
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            {status !== "streaming" && (
              <div className="absolute inset-0 grid place-items-center text-white/80 text-xs">
                {status === "connecting" ? "Connecting…" : "Camera idle"}
              </div>
            )}
            {status === "streaming" && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 text-emerald-400 text-[10px] px-2 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </div>
            )}
          </div>

          {pairCode && (
            <div className="rounded-md bg-muted/40 border px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Pair code
              </div>
              <div className="font-mono text-lg tracking-[0.3em]">{pairCode}</div>
            </div>
          )}

          {status !== "streaming" ? (
            <Button onClick={start} className="w-full" disabled={status === "connecting"}>
              <Camera className="h-4 w-4 mr-2" />
              {status === "connecting" ? "Starting camera…" : "Start side camera"}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Streaming to proctor
                </span>
                <span>{framesSent} frames sent</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={async () => {
                  stop();
                  setFacing((f) => (f === "environment" ? "user" : "environment"));
                  setStatus("idle");
                  setTimeout(start, 200);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Switch camera
              </Button>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-start gap-2">
              <WifiOff className="h-3.5 w-3.5 mt-0.5" /> {error}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Do not lock your phone, switch apps, or close this tab while the assessment is in
            progress. Disconnecting may flag your attempt for review.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
