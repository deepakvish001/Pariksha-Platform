import { useEffect, useRef, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, CheckCircle2, AlertCircle, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useSideEyeSignalling } from "@/hooks/useSideEyeSignalling";

interface Props {
  sessionId: string;
  required?: boolean;
  onPaired?: () => void;
  /** Seconds before we surface a "still waiting" timeout retry button. Defaults to 90. */
  pairingTimeoutSec?: number;
}

type PhoneStatus = "loading" | "waiting" | "phone_paired" | "stream_connecting" | "stream_active" | "stream_lost" | "error" | "expired";

const STATUS_LABEL: Record<PhoneStatus, string> = {
  loading: "Generating secure link…",
  waiting: "Waiting for phone to scan QR…",
  phone_paired: "Phone paired — establishing video stream…",
  stream_connecting: "Connecting video stream…",
  stream_active: "Side camera live",
  stream_lost: "Stream temporarily lost — reconnecting…",
  error: "Pairing failed",
  expired: "QR code expired",
};

/**
 * Preflight step: candidate scans QR with phone to enroll a side camera.
 * Includes retry, timeout warning, and expiry handling.
 */
export const SideEyePairingStep = ({ sessionId, required = true, onPaired, pairingTimeoutSec = 90 }: Props) => {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [showTimeoutHint, setShowTimeoutHint] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startedAtRef = useRef<number>(Date.now());

  const { connectionState } = useSideEyeSignalling({
    sessionId,
    role: "host",
    onRemoteStream: (s) => {
      setRemoteStream(s);
      setPhoneStatus("stream_active");
      onPaired?.();
    },
    onConnectionChange: (state) => {
      if (state === "disconnected" || state === "failed") setPhoneStatus("stream_lost");
      else if (state === "connecting") setPhoneStatus((p) => p === "stream_active" ? p : "stream_connecting");
    },
  });

  const requestToken = useCallback(async () => {
    setPhoneStatus("loading");
    setError(null);
    setShowTimeoutHint(false);
    startedAtRef.current = Date.now();
    try {
      const { data, error: e } = await supabase.functions.invoke("contest-sideeye-pair", {
        body: { sessionId },
      });
      if (e || !data?.token) {
        setPhoneStatus("error");
        setError(e?.message ?? "Failed to create pairing");
        return;
      }
      setToken(data.token);
      setExpiresAt(data.expiresAt ? new Date(data.expiresAt).getTime() : null);
      setPhoneStatus("waiting");
    } catch (err: any) {
      setPhoneStatus("error");
      setError(err?.message ?? "Network error");
    }
  }, [sessionId]);

  useEffect(() => { requestToken(); }, [requestToken]);

  // Realtime: pairing row updates
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
          const status = payload.new?.status;
          if (status === "paired") setPhoneStatus((p) => p === "stream_active" ? p : "phone_paired");
          if (status === "active") setPhoneStatus((p) => p === "stream_active" ? p : "stream_connecting");
          if (status === "lost") setPhoneStatus("stream_lost");
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sessionId]);

  // Timeout hint + expiry watcher
  useEffect(() => {
    const id = window.setInterval(() => {
      if (phoneStatus === "stream_active") return;
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      if (elapsed > pairingTimeoutSec && phoneStatus === "waiting") setShowTimeoutHint(true);
      if (expiresAt && Date.now() > expiresAt && (phoneStatus === "waiting" || phoneStatus === "loading")) {
        setPhoneStatus("expired");
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [phoneStatus, expiresAt, pairingTimeoutSec]);

  useEffect(() => {
    if (videoRef.current && remoteStream) videoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const url = token ? `${window.location.origin}/contests/sideeye/${token}` : "";

  const isLive = phoneStatus === "stream_active";
  const showQR = !!token && !isLive && phoneStatus !== "expired";

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
            Scan the QR with your phone. Place it 1-2 m on your side, showing you, your desk and surroundings.
            Keep the phone plugged in.
          </p>
        </div>
        <StatusPill status={phoneStatus} connectionState={connectionState} />
      </div>

      {phoneStatus === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {STATUS_LABEL.loading}
        </div>
      )}

      {phoneStatus === "error" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> {error ?? STATUS_LABEL.error}
          </div>
          <Button size="sm" variant="outline" onClick={requestToken}>
            <RefreshCw className="mr-1 h-3 w-3" /> Try again
          </Button>
        </div>
      )}

      {phoneStatus === "expired" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <AlertCircle className="h-4 w-4" /> The pairing link expired before your phone connected.
          </div>
          <Button size="sm" onClick={requestToken}>
            <RefreshCw className="mr-1 h-3 w-3" /> Generate a new QR
          </Button>
        </div>
      )}

      {showQR && (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-lg shrink-0">
            <QRCodeSVG value={url} size={180} />
          </div>
          <div className="text-sm space-y-2 min-w-0 flex-1">
            <p className="font-medium">Or open this link on your phone:</p>
            <code className="block text-xs p-2 bg-muted rounded break-all">{url}</code>
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">{STATUS_LABEL[phoneStatus]}</span>
            </div>
            {showTimeoutHint && phoneStatus === "waiting" && (
              <div className="flex flex-col gap-2 pt-1">
                <p className="text-xs text-amber-400">
                  Still nothing? Make sure your phone is on Wi-Fi or mobile data, and that you signed in
                  with the same account on the phone.
                </p>
                <Button size="sm" variant="outline" onClick={requestToken} className="w-fit">
                  <RefreshCw className="mr-1 h-3 w-3" /> Generate a new QR
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {(isLive || phoneStatus === "stream_lost") && (
        <div className="space-y-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-w-sm rounded-lg border border-border/50 bg-black aspect-video"
          />
          {phoneStatus === "stream_lost" && (
            <p className="text-xs text-amber-400 flex items-center gap-1">
              <WifiOff className="h-3 w-3" /> Reconnecting automatically… keep your phone unlocked.
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

const StatusPill = ({ status, connectionState }: { status: PhoneStatus; connectionState: RTCPeerConnectionState }) => {
  if (status === "stream_active") {
    return (
      <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 gap-1">
        <Wifi className="h-3 w-3" /> Live
      </Badge>
    );
  }
  if (status === "stream_lost" || connectionState === "failed" || connectionState === "disconnected") {
    return (
      <Badge variant="outline" className="border-amber-500/40 text-amber-300 gap-1">
        <WifiOff className="h-3 w-3" /> Reconnecting
      </Badge>
    );
  }
  if (status === "phone_paired" || status === "stream_connecting") {
    return (
      <Badge variant="outline" className="border-primary/50 text-primary gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Connecting
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground gap-1">
      <Loader2 className="h-3 w-3 animate-spin" /> Waiting
    </Badge>
  );
};

export default SideEyePairingStep;
