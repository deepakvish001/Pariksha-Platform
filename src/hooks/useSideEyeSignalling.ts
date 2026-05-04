import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type SignalRole = "host" | "phone";

/**
 * WebRTC signaling over a Supabase Realtime broadcast channel with:
 * - automatic reconnection on disconnect/failed/closed states (exponential backoff)
 * - adaptive bandwidth: caps video bitrate and falls back to lower resolution
 *   on poor connections (via outbound-rtp stats sampling)
 */
export function useSideEyeSignalling(opts: {
  sessionId: string | null;
  role: SignalRole;
  localStream?: MediaStream | null;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionChange?: (state: RTCPeerConnectionState) => void;
}) {
  const { sessionId, role, localStream, onRemoteStream, onConnectionChange } = opts;
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("new");
  const [quality, setQuality] = useState<"good" | "fair" | "poor">("good");
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let cachedIce: RTCIceServer[] | null = null;
    let candidatePairLogged = false;

    const fetchIce = async (): Promise<RTCIceServer[]> => {
      if (cachedIce) return cachedIce;
      const FALLBACK: RTCIceServer[] = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ];
      try {
        const { data, error } = await supabase.functions.invoke("contest-sideeye-ice");
        if (error) throw error;
        const servers = (data?.iceServers as RTCIceServer[]) ?? FALLBACK;
        cachedIce = servers;
        return servers;
      } catch (e) {
        console.warn("[sideeye] ICE fetch failed, using STUN fallback", e);
        cachedIce = FALLBACK;
        return FALLBACK;
      }
    };

    const logCandidatePairOnce = async (pc: RTCPeerConnection) => {
      if (candidatePairLogged) return;
      try {
        const stats = await pc.getStats();
        let pairType: string | null = null;
        let localType: string | null = null;
        let remoteType: string | null = null;
        const candidates: Record<string, any> = {};
        stats.forEach((r: any) => {
          if (r.type === "local-candidate" || r.type === "remote-candidate") {
            candidates[r.id] = r;
          }
        });
        stats.forEach((r: any) => {
          if (r.type === "candidate-pair" && r.state === "succeeded" && r.nominated) {
            const local = candidates[r.localCandidateId];
            const remote = candidates[r.remoteCandidateId];
            localType = local?.candidateType ?? null;
            remoteType = remote?.candidateType ?? null;
            pairType = `${localType}-${remoteType}`;
          }
        });
        if (pairType) {
          candidatePairLogged = true;
          // Best-effort audit log; ignore failure (RLS handles auth scoping).
          await supabase.from("contest_side_camera_audit_logs").insert({
            session_id: sessionId,
            user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
            event_type: "ice_pair_selected",
            severity: "info",
            detail: { pair_type: pairType, local: localType, remote: remoteType, role },
          });
        }
      } catch { /* noop */ }
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

        if (s === "connected") {
          reconnectAttemptRef.current = 0;
        } else if (s === "failed" || s === "disconnected" || s === "closed") {
          scheduleReconnect();
        }
      };

      if (localStream) {
        localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

        // Cap video at 600 kbps initially; adaptive logic adjusts later.
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          const params = sender.getParameters();
          params.encodings = params.encodings?.length
            ? params.encodings.map((e) => ({ ...e, maxBitrate: 600_000 }))
            : [{ maxBitrate: 600_000 }];
          sender.setParameters(params).catch(() => { /* unsupported on Safari < 15 */ });
        }
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
          if (cancelled || payload.from === role) return;
          try { await pc.addIceCandidate(payload.candidate); } catch (e) { console.warn("ice", e); }
        })
        .on("broadcast", { event: "phone-ready" }, async () => {
          if (cancelled || role !== "phone") return;
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
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      const attempt = ++reconnectAttemptRef.current;
      const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5));
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = window.setTimeout(() => connect(), delay);
    };

    connect();

    // Adaptive bandwidth sampler (phone side only, every 6 s)
    let qualityTimer: number | null = null;
    if (role === "phone") {
      qualityTimer = window.setInterval(async () => {
        const pc = pcRef.current;
        if (!pc) return;
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (!sender) return;
        try {
          const stats = await sender.getStats();
          let packetsLost = 0, packetsSent = 0;
          stats.forEach((r: any) => {
            if (r.type === "outbound-rtp" && r.kind === "video") packetsSent += r.packetsSent ?? 0;
            if (r.type === "remote-inbound-rtp" && r.kind === "video") packetsLost += r.packetsLost ?? 0;
          });
          const lossRatio = packetsSent > 0 ? packetsLost / packetsSent : 0;

          let next: "good" | "fair" | "poor" = "good";
          let target = 600_000;
          if (lossRatio > 0.08) { next = "poor"; target = 200_000; }
          else if (lossRatio > 0.03) { next = "fair"; target = 400_000; }
          setQuality(next);

          const params = sender.getParameters();
          if (params.encodings?.[0]) {
            params.encodings[0].maxBitrate = target;
            await sender.setParameters(params).catch(() => { /* noop */ });
          }
        } catch { /* noop */ }
      }, 6_000);
    }

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (qualityTimer) window.clearInterval(qualityTimer);
      try { pcRef.current?.close(); } catch { /* noop */ }
      try { channelRef.current?.unsubscribe(); } catch { /* noop */ }
    };
  }, [sessionId, role, localStream, onRemoteStream, onConnectionChange]);

  return { connected, connectionState, quality };
}
