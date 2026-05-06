import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  sessionId: string;
  contestId: string;
  onComplete: () => void;
}

/**
 * Captures a 60-second pre-contest baseline (6 frames @ 10s) of the candidate's
 * side-camera view. Used by `contest-sideeye-frame-analyze` to suppress false
 * positives (e.g. static posters or family photos) by comparing live frames
 * against the candidate's own baseline face count and room fingerprint.
 */
export default function SideEyeCalibrationScreen({ sessionId, contestId, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [progress, setProgress] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStreaming(true);
        }
      } catch {
        toast.error("Camera permission required for calibration");
      }
    })();
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const grabFrame = (): string | null => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return null;
    c.width = v.videoWidth || 640;
    c.height = v.videoHeight || 480;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.7);
  };

  const startCalibration = async () => {
    if (!streaming) return;
    setCapturing(true);
    const samples: string[] = [];
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 10_000));
      const frame = grabFrame();
      if (frame) samples.push(frame);
      setProgress(((i + 1) / 6) * 100);
    }
    try {
      const { error } = await supabase.functions.invoke("contest-sideeye-calibrate", {
        body: { sessionId, contestId, samples },
      });
      if (error) throw error;
      setDone(true);
      toast.success("Baseline captured. You're calibrated.");
      setTimeout(onComplete, 1200);
    } catch (e: any) {
      toast.error(e?.message ?? "Calibration failed");
      setCapturing(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" /> Side-camera calibration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We'll record a 60-second baseline of your room. This dramatically reduces
          false alarms during the contest (static posters, family photos, decor).
          Sit normally — no extra people in frame.
        </p>
        <div className="rounded-md overflow-hidden bg-black/40 aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        </div>
        <canvas ref={canvasRef} className="hidden" />
        {capturing && (
          <div className="space-y-1">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">Capturing baseline… {Math.round(progress)}%</p>
          </div>
        )}
        {done ? (
          <div className="flex items-center gap-2 text-emerald-500 text-sm">
            <CheckCircle2 className="h-4 w-4" /> Baseline saved.
          </div>
        ) : (
          <Button onClick={startCalibration} disabled={!streaming || capturing} className="w-full">
            {capturing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calibrating…</> : "Start 60s calibration"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
