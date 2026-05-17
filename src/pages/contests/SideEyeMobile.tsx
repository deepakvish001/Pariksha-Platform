import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Camera, AlertCircle, CheckCircle2, BatteryLow, EyeOff, RefreshCw } from "lucide-react";
import { useSideEyeSignalling } from "@/hooks/useSideEyeSignalling";
import { SideEyeReadyCheck } from "@/assessments/components/SideEyeReadyCheck";
import { toast } from "sonner";

/**
 * Phone-side page. Candidate opens this from QR scan on their phone.
 * Requires login. Asks for camera permission, claims the pairing token,
 * starts WebRTC stream + chunked recording uploads + heartbeat.
 */
const SideEyeMobile = () => {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<"login" | "permission" | "claiming" | "streaming" | "error">("login");
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pairingId, setPairingId] = useState<string | null>(null);
  const [batteryLow, setBatteryLow] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const wakeLockRef = useRef<any>(null);
  const flushIntervalRef = useRef<number | null>(null);

  const { quality, connectionState } = useSideEyeSignalling({
    sessionId,
    role: "phone",
    localStream: stream,
  });

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setStep("permission");
      else setStep("login");
    });
  }, []);

  // Battery monitoring
  useEffect(() => {
    (navigator as any).getBattery?.().then((b: any) => {
      const update = () => {
        const low = b.level < 0.2 && !b.charging;
        setBatteryLow(low);
        if (low) {
          try { (navigator as any).vibrate?.([200, 100, 200]); } catch {}
        }
      };
      update();
      b.addEventListener("levelchange", update);
      b.addEventListener("chargingchange", update);
    });
  }, []);

  // Background / tab-hidden detection — vibrate + flag so admin sees it
  useEffect(() => {
    const onVis = () => {
      const isHidden = document.visibilityState === "hidden";
      setHidden(isHidden);
      if (isHidden) {
        try { (navigator as any).vibrate?.([400, 200, 400, 200, 400]); } catch {}
        toast.warning("Side camera tab moved to background. Return immediately.");
      } else {
        // Re-acquire wake lock when user returns
        (async () => {
          try {
            wakeLockRef.current = await (navigator as any).wakeLock?.request("screen");
          } catch {}
        })();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Auto re-pair after 3 failed reconnections
  useEffect(() => {
    if (connectionState === "failed" || connectionState === "disconnected") {
      setReconnectAttempts((n) => {
        const next = n + 1;
        if (next >= 3) {
          toast.error("Connection lost — attempting full repair…");
          // Hard reload preserves token in URL and re-runs the full pairing flow
          setTimeout(() => window.location.reload(), 1500);
        }
        return next;
      });
    } else if (connectionState === "connected") {
      setReconnectAttempts(0);
    }
  }, [connectionState]);

  const requestCamera = async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: 1280, height: 720 },
        audio: true,
      });
      setStream(s);
      setStep("claiming");

      // Claim pairing
      const { data, error: e } = await supabase.functions.invoke("contest-sideeye-claim", {
        body: {
          token,
          deviceUserAgent: navigator.userAgent,
          deviceFingerprint: `${screen.width}x${screen.height}_${navigator.language}`,
        },
      });
      if (e || !data?.ok) throw new Error(e?.message ?? "Pairing failed");
      setSessionId(data.sessionId);
      setPairingId(data.pairingId);
      setStep("streaming");

      // Wake lock
      try { wakeLockRef.current = await (navigator as any).wakeLock?.request("screen"); } catch {}
    } catch (err: any) {
      setError(err?.message ?? "Camera permission denied");
      setStep("error");
    }
  };

  // Attach stream to preview
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  // Heartbeat loop
  useEffect(() => {
    if (!pairingId) return;
    const tick = () => {
      supabase.functions.invoke("contest-sideeye-heartbeat", { body: { pairingId } });
    };
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, [pairingId]);

  // Chunked recording uploads
  useEffect(() => {
    if (!stream || !sessionId) return;
    const { data: { user } } = { data: { user: null as any } };
    let userId: string | null = null;
    supabase.auth.getUser().then((u) => { userId = u.data.user?.id ?? null; });

    let mr: MediaRecorder;
    try {
      mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus", videoBitsPerSecond: 600_000 });
    } catch {
      mr = new MediaRecorder(stream);
    }
    recorderRef.current = mr;
    let chunkIdx = 0;

    mr.ondataavailable = async (ev) => {
      if (!ev.data || ev.data.size === 0 || !userId) return;
      const path = `${userId}/${sessionId}/rec_${Date.now()}_${chunkIdx++}.webm`;
      try {
        const { error: upErr } = await supabase.storage
          .from("contest-side-camera")
          .upload(path, ev.data, { contentType: "video/webm", upsert: false });
        if (!upErr) {
          await supabase.from("contest_side_camera_recordings").insert({
            session_id: sessionId,
            user_id: userId,
            storage_path: path,
            byte_size: ev.data.size,
            ended_at: new Date().toISOString(),
          });
        }
      } catch (e) { console.warn("rec upload", e); }
    };
    mr.start(10_000); // 10 s chunks
    // Force a flush every 10 s in case the timeslice arg is ignored on some mobile browsers
    flushIntervalRef.current = window.setInterval(() => {
      try { if (mr.state === "recording") mr.requestData(); } catch {}
    }, 10_000);

    // AI frame sampling every 15 s
    const canvas = document.createElement("canvas");
    const sampleFrame = async () => {
      if (!videoRef.current || !userId) return;
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${userId}/${sessionId}/frame_${Date.now()}.jpg`;
      try {
        await supabase.storage
          .from("contest-side-camera")
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        await supabase.functions.invoke("contest-sideeye-frame-analyze", {
          body: { sessionId, storagePath: path, dataUrl },
        });
      } catch (e) { console.warn("frame", e); }
    };
    const frameId = setInterval(sampleFrame, 15_000);

    return () => {
      clearInterval(frameId);
      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
      try { mr.stop(); } catch {}
      try { wakeLockRef.current?.release(); } catch {}
    };
  }, [stream, sessionId]);

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center">
      <Card className="w-full max-w-md p-6 space-y-4 mt-8">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Side Camera Pairing</h1>
        </div>

        {batteryLow && (
          <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 p-2 rounded">
            <BatteryLow className="h-4 w-4" /> Battery is low — please plug in your phone.
          </div>
        )}

        {hidden && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
            <EyeOff className="h-4 w-4" /> Tab is in background — return now or your contest will be paused.
          </div>
        )}

        {reconnectAttempts > 0 && reconnectAttempts < 3 && (
          <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 p-2 rounded">
            <RefreshCw className="h-4 w-4 animate-spin" /> Reconnecting… (attempt {reconnectAttempts}/3)
          </div>
        )}

        {step === "login" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sign in with the same account you're using for the contest.
            </p>
            <Button asChild className="w-full">
              <a href={`/auth?redirect=${encodeURIComponent(window.location.pathname)}`}>Sign in</a>
            </Button>
          </div>
        )}

        {step === "permission" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You'll use the rear camera as a side view of you and your desk.
              Confirm the settings below, then tap to start.
            </p>
            <SideEyeReadyCheck onReady={requestCamera} buttonLabel="Start Side Camera" />
          </div>
        )}

        {step === "claiming" && (
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
          </div>
        )}

        {step === "error" && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {(step === "streaming" || stream) && (
          <div className="space-y-3">
            <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black aspect-video" />
            {step === "streaming" && (
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-emerald-500">Streaming to proctor</span>
                <Badge
                  variant="outline"
                  className={
                    quality === "good"
                      ? "border-emerald-500/40 text-emerald-300"
                      : quality === "fair"
                      ? "border-amber-500/40 text-amber-300"
                      : "border-red-500/50 text-red-300"
                  }
                >
                  {quality === "good" ? "Good network" : quality === "fair" ? "Fair network" : "Poor — reduced quality"}
                </Badge>
                {(connectionState === "disconnected" || connectionState === "failed") && (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                    Reconnecting…
                  </Badge>
                )}
                <Badge variant="secondary" className="ml-auto">Keep this tab open</Badge>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Do NOT lock your screen or switch apps. Keep the phone plugged in.
              Closing this tab will pause your contest.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SideEyeMobile;
