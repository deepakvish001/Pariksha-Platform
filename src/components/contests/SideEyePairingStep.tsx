import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useSideEyeSignalling } from "@/hooks/useSideEyeSignalling";

interface Props {
  sessionId: string;
  required?: boolean;
  onPaired?: () => void;
}

/**
 * Preflight step: candidate scans QR with phone to enroll a side camera.
 * Renders QR + live status. Once paired & WebRTC connected, fires onPaired.
 */
export const SideEyePairingStep = ({ sessionId, required = true, onPaired }: Props) => {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "waiting" | "paired" | "active" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useSideEyeSignalling({
    sessionId,
    role: "host",
    onRemoteStream: (s) => {
      setRemoteStream(s);
      setStatus("active");
      onPaired?.();
    },
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error: e } = await supabase.functions.invoke("contest-sideeye-pair", {
          body: { sessionId },
        });
        if (!alive) return;
        if (e || !data?.token) {
          setStatus("error");
          setError(e?.message ?? "Failed to create pairing");
          return;
        }
        setToken(data.token);
        setStatus("waiting");
      } catch (err: any) {
        if (!alive) return;
        setStatus("error");
        setError(err?.message ?? "Network error");
      }
    })();
    return () => { alive = false; };
  }, [sessionId]);

  // Listen for pairing row update (paired status) via realtime
  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase
      .channel(`sec-pair-watch:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contest_side_camera_pairings",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: any) => {
          if (payload.new?.status === "paired" || payload.new?.status === "active") {
            setStatus((s) => (s === "active" ? s : "paired"));
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sessionId]);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const url = token
    ? `${window.location.origin}/contests/sideeye/${token}`
    : "";

  return (
    <Card className="p-6 space-y-4 bg-card/50 backdrop-blur border-border/50">
      <div className="flex items-start gap-3">
        <Smartphone className="h-6 w-6 text-primary mt-0.5" />
        <div className="flex-1">
          <h3 className="text-base font-semibold">
            Pair your phone as Side Camera
            {required && <Badge variant="destructive" className="ml-2 text-[10px]">Required</Badge>}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Scan the QR with your phone. Place the phone 1-2 m away on your side so it shows you,
            your desk, and the surrounding area. Keep your phone plugged in.
          </p>
        </div>
      </div>

      {status === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Generating secure link…
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {token && status !== "active" && (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-lg shrink-0">
            <QRCodeSVG value={url} size={180} />
          </div>
          <div className="text-sm space-y-2 min-w-0">
            <p className="font-medium">Or open this link on your phone:</p>
            <code className="block text-xs p-2 bg-muted rounded break-all">{url}</code>
            <div className="flex items-center gap-2 mt-2">
              {status === "waiting" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Waiting for phone to connect…</span>
                </>
              )}
              {status === "paired" && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-amber-500" />
                  <span>Phone paired. Establishing video stream…</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {status === "active" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-medium text-emerald-500">Side camera active</span>
          </div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-w-sm rounded-lg border border-border/50 bg-black aspect-video"
          />
        </div>
      )}
    </Card>
  );
};

export default SideEyePairingStep;
