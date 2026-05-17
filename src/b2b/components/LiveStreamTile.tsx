import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Camera, Monitor, Smartphone, CircleSlash } from "lucide-react";
import { useWebrtcStream } from "@/hooks/useWebrtcStream";

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
  /** Pre-computed WebRTC channel id, or null to disable this tile. */
  channelId: string | null;
  kind: Kind;
  className?: string;
}

/**
 * Single viewer tile that subscribes to a publisher on the given channel.
 * Renders a `<video>` for the remote stream or a placeholder when idle.
 */
export function LiveStreamTile({ channelId, kind, className }: Props) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { connected, connectionState } = useWebrtcStream({
    channelId,
    role: "viewer",
    onRemoteStream: setStream,
  });

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  // Clear stream when channel is disabled
  useEffect(() => {
    if (!channelId) setStream(null);
  }, [channelId]);

  const Icon = ICONS[kind];

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
        {channelId && (
          <Badge
            variant={connected ? "default" : "secondary"}
            className={`text-[10px] h-5 ${connected ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : ""}`}
          >
            {connected ? "LIVE" : connectionState === "connecting" || connectionState === "new" ? "…" : "OFFLINE"}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default LiveStreamTile;
