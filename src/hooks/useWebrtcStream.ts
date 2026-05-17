import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type StreamRole = "publisher" | "viewer";

/**
 * Generic 1:1 WebRTC stream over a Supabase Realtime broadcast channel.
 *
 * - publisher: sends `localStream` to whichever viewer joins the channel.
 * - viewer: receives the remote stream via `onRemoteStream`.
 *
 * Channel naming is fully caller-controlled (e.g. `proctor:<attemptId>:webcam`).
 * Auto reconnects with exponential backoff. Adaptive bitrate cap (publisher).
 */
export function useWebrtcStream(opts: {
  channelId: string | null;
  role: StreamRole;
  localStream?: MediaStream | null;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionChange?: (state: RTCPeerConnectionState) => void;
  /** Cap initial video bitrate (publisher). Default 600 kbps. */
  maxBitrate?: number;
}) {
  const { channelId, role, localStream, onRemoteStream, onConnectionChange, maxBitrate = 600_000 } = opts;
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!channelId) return;
    let cancelled = false;
    let cachedIce: RTCIceServer[] | null = null;

    const fetchIce = async (): Promise<RTCIceServer[]> => {
      if (cachedIce) return cachedIce;
      const FALLBACK: RTCIceServer[] = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ];
      try {
        const { data, error } = await supabase.functions.invoke("contest-sideeye-ice");
        if (error) throw error;
        cachedIce = (data?.iceServers as RTCIceServer[]) ?? FALLBACK;
        return cachedIce;
      } catch {
        cachedIce = FALLBACK;
        return FALLBACK;
      }
    };

    const connect = async () => {
      if (cancelled) return;
      try { pcRef.current?.close(); } catch { /* noop */ }
      try { channelRef.current?.unsubscribe(); } catch { /* noop */ }

      const iceServers = await fetchIce();
      if (cancelled) return;
      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;

      pc.ontrack = (ev) => {
        const stream = ev.streams[0];
        if (stream && onRemoteStream) onRemoteStream(stream);
      };

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        setConnectionState(s);
        setConnected(s === "connected");
        onConnectionChange?.(s);
        if (s === "connected") reconnectAttemptRef.current = 0;
        else if (s === "failed" || s === "disconnected" || s === "closed") scheduleReconnect();
      };

      if (role === "publisher" && localStream) {
        localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          const params = sender.getParameters();
          params.encodings = params.encodings?.length
            ? params.encodings.map((e) => ({ ...e, maxBitrate }))
            : [{ maxBitrate }];
          sender.setParameters(params).catch(() => { /* noop */ });
        }
      } else if (role === "viewer") {
        // Recv-only transceivers so we can answer offers even with no local media.
        try {
          pc.addTransceiver("video", { direction: "recvonly" });
          pc.addTransceiver("audio", { direction: "recvonly" });
        } catch { /* noop */ }
      }

      const channel = supabase.channel(`webrtc:${channelId}`, {
        config: { broadcast: { self: false } },
      });
      channelRef.current = channel;

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          channel.send({
            type: "broadcast",
            event: "ice",
            payload: { from: role, candidate: ev.candidate.toJSON() },
          });
        }
      };

      channel
        .on("broadcast", { event: "offer" }, async ({ payload }) => {
          if (cancelled || role !== "viewer") return;
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({ type: "broadcast", event: "answer", payload: { sdp: answer } });
        })
        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          if (cancelled || role !== "publisher") return;
          try { await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp)); } catch { /* noop */ }
        })
        .on("broadcast", { event: "ice" }, async ({ payload }) => {
          if (cancelled || payload.from === role) return;
          try { await pc.addIceCandidate(payload.candidate); } catch { /* noop */ }
        })
        .on("broadcast", { event: "viewer-ready" }, async () => {
          if (cancelled || role !== "publisher" || !localStream) return;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({ type: "broadcast", event: "offer", payload: { sdp: offer } });
        })
        .subscribe(async (status) => {
          if (status !== "SUBSCRIBED") return;
          if (role === "viewer") {
            channel.send({ type: "broadcast", event: "viewer-ready", payload: {} });
          } else if (role === "publisher" && localStream) {
            // Proactively offer too in case viewer joined first.
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              channel.send({ type: "broadcast", event: "offer", payload: { sdp: offer } });
            } catch { /* noop */ }
          }
        });
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      const attempt = ++reconnectAttemptRef.current;
      const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5));
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = window.setTimeout(() => { void connect(); }, delay);
    };

    void connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      try { pcRef.current?.close(); } catch { /* noop */ }
      try { channelRef.current?.unsubscribe(); } catch { /* noop */ }
    };
  }, [channelId, role, localStream, onRemoteStream, onConnectionChange, maxBitrate]);

  return { connected, connectionState };
}
