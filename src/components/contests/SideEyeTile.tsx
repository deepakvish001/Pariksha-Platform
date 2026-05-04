import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, CircleSlash } from "lucide-react";
import { useSideEyeSignalling } from "@/hooks/useSideEyeSignalling";

interface Props {
  sessionId: string;
  candidateName?: string;
}

/**
 * Admin-side tile that displays a candidate's live side-camera stream.
 */
export const SideEyeTile = ({ sessionId, candidateName }: Props) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { connected } = useSideEyeSignalling({
    sessionId,
    role: "host",
    onRemoteStream: setStream,
  });

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <Card className="overflow-hidden bg-black/50 border-border/40">
      <div className="aspect-video bg-black relative">
        {stream ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs gap-2">
            <CircleSlash className="h-4 w-4" /> No side stream
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <Smartphone className="h-3 w-3 text-white/80" />
          <Badge variant={connected ? "default" : "secondary"} className="text-[10px] h-5">
            {connected ? "LIVE" : "WAITING"}
          </Badge>
        </div>
      </div>
      {candidateName && (
        <div className="p-2 text-xs truncate">{candidateName}</div>
      )}
    </Card>
  );
};

export default SideEyeTile;
