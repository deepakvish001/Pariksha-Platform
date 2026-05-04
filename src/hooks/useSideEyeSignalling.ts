import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type SignalRole = "host" | "phone";

/**
 * Tiny WebRTC signaling over a Supabase Realtime broadcast channel.
 * Each side joins channel `sideeye:{sessionId}` and exchanges SDP/ICE.
 */
export function useSideEyeSignalling(opts: {
  sessionId: string | null;
  role: SignalRole;
  localStream?: MediaStream | null;
  onRemoteStream?: (stream: MediaStream) => void;
}) {
  const { sessionId, role, localStream, onRemoteStream } = opts;
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    pc.ontrack = (ev) => {
      const stream = ev.streams[0];
      if (stream && onRemoteStream) onRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      setConnected(pc.connectionState === "connected");
    };

    if (localStream) {
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    }

    const channel = supabase.channel(`sideeye:${sessionId}`, {
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
        if (cancelled || role !== "host") return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.send({ type: "broadcast", event: "answer", payload: { sdp: answer } });
      })
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        if (cancelled || role !== "phone") return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      })
      .on("broadcast", { event: "ice" }, async ({ payload }) => {
        if (cancelled) return;
        if (payload.from === role) return;
        try { await pc.addIceCandidate(payload.candidate); } catch (e) { console.warn("ice", e); }
      })
      .on("broadcast", { event: "phone-ready" }, async () => {
        if (cancelled || role !== "phone") return;
        // host signals readiness; phone (re)offers
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel.send({ type: "broadcast", event: "offer", payload: { sdp: offer } });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          if (role === "phone" && localStream) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            channel.send({ type: "broadcast", event: "offer", payload: { sdp: offer } });
          } else if (role === "host") {
            channel.send({ type: "broadcast", event: "phone-ready", payload: {} });
          }
        }
      });

    return () => {
      cancelled = true;
      try { pc.close(); } catch {}
      try { channel.unsubscribe(); } catch {}
    };
  }, [sessionId, role, localStream, onRemoteStream]);

  return { connected };
}
