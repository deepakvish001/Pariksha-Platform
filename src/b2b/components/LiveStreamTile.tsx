import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Monitor, Smartphone, CircleSlash, Circle, Square, Loader2 } from "lucide-react";
import { useWebrtcStream } from "@/hooks/useWebrtcStream";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Kind = "webcam" | "screen" | "sideeye";

const ICONS: Record<Kind, typeof Camera> = {
  webcam: Camera,
  screen: Monitor,
  sideeye: Smartphone,
};

const LABELS: Record<Kind, string> = {
  webcam: "First eye · Webcam",
  screen: "Second eye · Screen",
  sideeye: "Third eye · Side cam",
};

interface Props {
  channelId: string | null;
  kind: Kind;
  className?: string;
  /** When set, shows a Record/Stop button that uploads to storage and inserts a row. */
  attemptId?: string;
  /** Notified whenever the WebRTC connection flips between connected and disconnected. */
  onConnectionChange?: (connected: boolean, state: string) => void;
}

function pickMime(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  }
  return "video/webm";
}

/**
 * Single viewer tile that subscribes to a publisher on the given channel and
 * optionally records the remote MediaStream to storage on demand.
 */
export function LiveStreamTile({ channelId, kind, className, attemptId, onConnectionChange }: Props) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recStartRef = useRef<number>(0);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { connected, connectionState } = useWebrtcStream({
    channelId,
    role: "viewer",
    onRemoteStream: setStream,
  });

  const prevConnRef = useRef<boolean>(false);
  useEffect(() => {
    if (prevConnRef.current !== connected) {
      prevConnRef.current = connected;
      onConnectionChange?.(connected, connectionState);
    }
  }, [connected, connectionState, onConnectionChange]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    if (!channelId) setStream(null);
  }, [channelId]);

  // Auto-stop recording if the stream drops or the tile unmounts.
  useEffect(() => {
    return () => {
      try { recRef.current?.state === "recording" && recRef.current.stop(); } catch { /* noop */ }
    };
  }, []);

  const startRec = () => {
    if (!stream || !attemptId) return;
    try {
      const mime = pickMime();
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 800_000 });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => void finalizeUpload(mime);
      rec.start(1000);
      recRef.current = rec;
      recStartRef.current = Date.now();
      setRecording(true);
    } catch (e) {
      toast.error(`Recording not supported: ${(e as Error).message}`);
    }
  };

  const stopRec = () => {
    try { recRef.current?.state === "recording" && recRef.current.stop(); } catch { /* noop */ }
    setRecording(false);
  };

  const finalizeUpload = async (mime: string) => {
    if (!attemptId || chunksRef.current.length === 0) return;
    setUploading(true);
    try {
      const blob = new Blob(chunksRef.current, { type: mime });
      chunksRef.current = [];
      const ext = mime.includes("mp4") ? "mp4" : "webm";
      const ts = Date.now();
      const path = `${attemptId}/recordings/${kind}-${ts}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("assessment-proctor")
        .upload(path, blob, { contentType: mime, upsert: false });
      if (upErr) throw upErr;
      const user = (await supabase.auth.getUser()).data.user;
      const { error: insErr } = await supabase.from("assessment_proctor_recordings").insert({
        attempt_id: attemptId,
        kind,
        storage_path: path,
        recorded_by: user?.id,
        started_at: new Date(recStartRef.current).toISOString(),
        ended_at: new Date().toISOString(),
        duration_ms: Date.now() - recStartRef.current,
        size_bytes: blob.size,
      });
      if (insErr) throw insErr;
      toast.success("Recording saved to evidence");
    } catch (e) {
      toast.error(`Upload failed: ${(e as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const Icon = ICONS[kind];
  const showRecBtn = !!attemptId && connected;

  return (
    <div className={`relative aspect-video rounded-md overflow-hidden border border-[hsl(var(--border))] bg-black/60 ${className ?? ""}`}>
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground text-[11px] gap-1.5 px-2 text-center">
          <CircleSlash className="h-4 w-4 mx-auto" />
          {channelId ? "Waiting for stream…" : "Not available"}
        </div>
      )}
      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
        <Badge variant="secondary" className="text-[10px] h-5 gap-1">
          <Icon className="h-3 w-3" /> {LABELS[kind]}
        </Badge>
        {channelId && (() => {
          const connecting = !connected && (connectionState === "connecting" || connectionState === "new");
          return (
            <Badge
              className={`text-[10px] h-5 gap-1 border ${
                connected
                  ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/50"
                  : connecting
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-rose-500/25 text-rose-300 border-rose-500/50"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connected ? "bg-emerald-400 animate-pulse" : connecting ? "bg-amber-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              {connected ? "LIVE" : connecting ? "CONNECTING" : "OFFLINE"}
            </Badge>
          );
        })()}
        {recording && (
          <Badge className="text-[10px] h-5 bg-red-500/20 text-red-400 border-red-500/40 gap-1">
            <Circle className="h-2 w-2 fill-current animate-pulse" /> REC
          </Badge>
        )}
      </div>
      {showRecBtn && (
        <div className="absolute bottom-1.5 right-1.5">
          {recording ? (
            <Button size="sm" variant="destructive" className="h-6 px-2 text-[10px]" onClick={stopRec} disabled={uploading}>
              <Square className="h-3 w-3 mr-1" /> Stop
            </Button>
          ) : (
            <Button size="sm" variant="secondary" className="h-6 px-2 text-[10px]" onClick={startRec} disabled={uploading}>
              {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Circle className="h-3 w-3 mr-1 text-red-500 fill-current" />}
              {uploading ? "Saving…" : "Record"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default LiveStreamTile;
