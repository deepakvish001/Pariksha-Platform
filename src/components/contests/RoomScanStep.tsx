import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Camera, Loader2, ScanLine, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  contestId: string;
  sessionId?: string | null;
  webcamStream: MediaStream | null;
  onPassed: () => void;
}

type Phase = "idle" | "recording" | "uploading" | "analyzing" | "done" | "blocked";

const SCAN_DURATION_MS = 10_000;

/**
 * Mandatory 360° room scan. The user pans their webcam slowly for 10s
 * while we record. The clip is uploaded to `contest-room-scans` and
 * analyzed by the `contest-room-scan-analyze` edge function (Gemini
 * vision) to look for: extra people, second screens, phones, paper
 * notes, earbuds. Results are stored on `contest_room_scans`.
 */
export function RoomScanStep({ contestId, sessionId, webcamStream, onPassed }: Props) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(0);
  const [verdict, setVerdict] = useState<"clean" | "suspicious" | "blocked" | "error" | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [findings, setFindings] = useState<string[]>([]);

  // Bind preview to the live webcam stream
  useEffect(() => {
    if (videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream;
      void videoRef.current.play().catch(() => { /* autoplay blocked */ });
    }
  }, [webcamStream]);

  const start = async () => {
    if (!webcamStream || !user) {
      toast.error("Webcam not ready");
      return;
    }
    chunksRef.current = [];
    setVerdict(null);
    setSummary("");
    setFindings([]);

    let mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";
    const rec = new MediaRecorder(webcamStream, { mimeType, videoBitsPerSecond: 800_000 });
    recorderRef.current = rec;
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      await uploadAndAnalyze(blob);
    };
    rec.start(1000);
    setPhase("recording");

    const startedAt = Date.now();
    setCountdown(Math.ceil(SCAN_DURATION_MS / 1000));
    const tick = window.setInterval(() => {
      const left = Math.max(0, SCAN_DURATION_MS - (Date.now() - startedAt));
      setCountdown(Math.ceil(left / 1000));
      if (left <= 0) {
        window.clearInterval(tick);
        try { rec.stop(); } catch { /* already stopped */ }
      }
    }, 250);
  };

  const uploadAndAnalyze = async (blob: Blob) => {
    if (!user) return;
    setPhase("uploading");
    const path = `${user.id}/${contestId}/${sessionId ?? "preflight"}/${Date.now()}.webm`;
    const { error: upErr } = await supabase.storage
      .from("contest-room-scans")
      .upload(path, blob, { contentType: "video/webm", upsert: false });
    if (upErr) {
      toast.error("Upload failed", { description: upErr.message });
      setPhase("idle");
      return;
    }
    const { data: scanIdData, error: rpcErr } = await supabase.rpc(
      "contest_record_room_scan" as never,
      {
        _contest_id: contestId,
        _session_id: sessionId ?? null,
        _storage_path: path,
        _duration_ms: SCAN_DURATION_MS,
      } as never,
    );
    if (rpcErr) {
      toast.error("Could not record scan", { description: rpcErr.message });
      setPhase("idle");
      return;
    }
    const scanId = scanIdData as unknown as string;

    setPhase("analyzing");
    const { data, error } = await supabase.functions.invoke("contest-room-scan-analyze", {
      body: {
        contest_id: contestId,
        session_id: sessionId ?? null,
        scan_id: scanId,
        storage_path: path,
      },
    });
    if (error) {
      setVerdict("error");
      setSummary(error.message || "Analysis failed");
      setPhase("done");
      return;
    }
    const res = data as {
      verdict: "clean" | "suspicious" | "blocked" | "error";
      summary?: string;
      findings?: string[];
    };
    setVerdict(res.verdict);
    setSummary(res.summary || "");
    setFindings(res.findings || []);
    setPhase(res.verdict === "blocked" ? "blocked" : "done");
  };

  const verdictTone = verdict === "clean"
    ? "text-emerald-300 border-emerald-500/30"
    : verdict === "suspicious"
      ? "text-amber-300 border-amber-500/30"
      : "text-red-300 border-red-500/40";

  const VerdictIcon = verdict === "clean" ? CheckCircle2 : verdict === "suspicious" ? AlertTriangle : XCircle;

  return (
    <Card className="space-y-4 border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center gap-2">
        <ScanLine className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Room scan</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Slowly pan your webcam around the room for 10 seconds. Show your desk, behind the monitor,
        and any walls within reach. We're checking for second screens, phones, paper notes, or
        another person in the room.
      </p>

      <div className="overflow-hidden rounded-lg border border-border/40 bg-black/40">
        <video
          ref={videoRef}
          className="aspect-video w-full bg-black object-cover"
          muted
          playsInline
        />
      </div>

      {phase === "recording" && (
        <div className="flex items-center justify-center gap-2 text-sm text-amber-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          Recording — {countdown}s left
        </div>
      )}

      {(phase === "uploading" || phase === "analyzing") && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {phase === "uploading" ? "Uploading clip…" : "Analyzing with AI vision…"}
        </div>
      )}

      {(phase === "done" || phase === "blocked") && verdict && (
        <Alert className={verdictTone}>
          <VerdictIcon className="h-4 w-4" />
          <AlertTitle className="capitalize">Verdict: {verdict}</AlertTitle>
          <AlertDescription className="space-y-1">
            {summary && <div>{summary}</div>}
            {findings.length > 0 && (
              <ul className="ml-4 list-disc text-xs">
                {findings.slice(0, 6).map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="outline" className="border-border">
          <Camera className="mr-1 h-3 w-3" /> Live preview
        </Badge>
        <div className="flex gap-2">
          {(phase === "idle" || phase === "done") && verdict !== "clean" && (
            <Button onClick={start} disabled={!webcamStream}>
              {phase === "done" ? "Re-record scan" : "Start 10s scan"}
            </Button>
          )}
          {phase === "done" && verdict === "clean" && (
            <Button onClick={onPassed}>Continue</Button>
          )}
          {phase === "done" && verdict === "suspicious" && (
            <Button variant="outline" onClick={onPassed}>
              Continue (admin notified)
            </Button>
          )}
          {phase === "blocked" && (
            <Button variant="outline" onClick={start}>
              Try again
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
