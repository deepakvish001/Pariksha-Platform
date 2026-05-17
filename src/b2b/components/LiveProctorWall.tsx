import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ChevronDown, ChevronUp, Wifi, WifiOff, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LiveStreamTile } from "./LiveStreamTile";
import { useCanProctor } from "../hooks/usePermissions";

export interface LiveProctorAttempt {
  attempt_id: string;
  candidate_name: string;
}

interface Props {
  attempts: LiveProctorAttempt[];
  /**
   * Org id used to verify the viewer has a proctor-capable role
   * (owner / admin / proctor). Required for defence-in-depth — the
   * component refuses to render any live tiles otherwise, even if a
   * caller forgets to gate it.
   */
  orgId?: string | null;
  /** Default collapsed when there are many live candidates. */
  defaultCollapsed?: boolean;
}

type Kind = "webcam" | "screen" | "sideeye";

const KIND_LABEL: Record<Kind, string> = {
  webcam: "Webcam",
  screen: "Screen",
  sideeye: "Side cam",
};

/**
 * Per-attempt 3-tile row showing webcam, screen, and side-camera live feeds.
 * Tracks per-stream connection state and surfaces sonner toasts whenever a
 * stream drops or reconnects so the proctor doesn't miss outages.
 */
const MUTE_STORAGE_KEY = "pariksha:live-proctor-toasts-muted";

export function LiveProctorWall({ attempts, orgId, defaultCollapsed = true }: Props) {
  const { canProctor, isLoading: roleLoading } = useCanProctor(orgId);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [tokens, setTokens] = useState<Record<string, string | null>>({});
  // key = `${attemptId}:${kind}` → connected?
  const [status, setStatus] = useState<Record<string, boolean>>({});
  // Tracks whether the stream has ever been connected, so the first transition
  // to "true" is announced as "live" and subsequent flips as reconnect.
  const seenRef = useRef<Record<string, boolean>>({});
  // Mute toggle — persists across reloads so a proctor doesn't have to
  // re-silence on every page navigation. Counts stay visible regardless.
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  });
  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? "1" : "0");
    }
  }, [muted]);
  // Pending debounce timers per stream key so a brief flap doesn't toast.
  const pendingRef = useRef<Record<string, { timer: number; target: boolean }>>({});
  // Last toast emitted per stream key — used for hard rate-limiting and dedup.
  const lastToastRef = useRef<Record<string, { connected: boolean; at: number }>>({});

  // Cleanup pending timers on unmount.
  useEffect(() => {
    return () => {
      for (const k of Object.keys(pendingRef.current)) {
        window.clearTimeout(pendingRef.current[k].timer);
      }
      pendingRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (collapsed || attempts.length === 0) return;
    const ids = attempts.map((a) => a.attempt_id);
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("assessment_side_camera_pairings")
        .select("attempt_id, pair_token, status")
        .in("attempt_id", ids);
      if (cancelled) return;
      const map: Record<string, string | null> = {};
      for (const row of (data ?? []) as { attempt_id: string; pair_token: string; status: string }[]) {
        if (row.status === "paired") map[row.attempt_id] = row.pair_token;
      }
      setTokens(map);
    })();
    return () => { cancelled = true; };
  }, [collapsed, attempts]);

  // Debounce window before announcing a state change — absorbs WebRTC flaps
  // that resolve within a couple of seconds (~3s).
  const DEBOUNCE_MS = 3_000;
  // Hard rate limit: at most one toast of the same state per key per 30s.
  const COOLDOWN_MS = 30_000;

  const handleConn = useCallback(
    (attemptId: string, kind: Kind, candidateName: string, connected: boolean) => {
      const key = `${attemptId}:${kind}`;
      setStatus((s) => (s[key] === connected ? s : { ...s, [key]: connected }));

      // If a flap reverses a pending toast before it fires, cancel it.
      const pending = pendingRef.current[key];
      if (pending) {
        if (pending.target === connected) return; // already scheduled
        window.clearTimeout(pending.timer);
        delete pendingRef.current[key];
      }

      const emit = () => {
        delete pendingRef.current[key];
        const last = lastToastRef.current[key];
        const now = Date.now();
        // Dedup + cooldown: skip if same state was toasted within COOLDOWN_MS.
        if (last && last.connected === connected && now - last.at < COOLDOWN_MS) return;
        lastToastRef.current[key] = { connected, at: now };

        const seen = seenRef.current[key];
        // Always mark first-connect as seen so subsequent flaps fire reconnect
        // / offline toasts once the user un-mutes.
        if (connected && !seen) seenRef.current[key] = true;
        // Muted: keep counts/badges accurate but skip the visible toast.
        if (mutedRef.current) return;

        if (connected) {
          if (seen) {
            toast.success(`${candidateName} · ${KIND_LABEL[kind]} reconnected`, { id: `conn:${key}` });
          } else {
            toast(`${candidateName} · ${KIND_LABEL[kind]} live`, {
              id: `conn:${key}`,
              description: "Stream is now streaming.",
            });
          }
        } else if (seen) {
          toast.error(`${candidateName} · ${KIND_LABEL[kind]} went offline`, { id: `conn:${key}` });
        }
      };

      // Mark "first connect" immediately (no debounce on initial live so the
      // count badge becomes consistent fast), but still rate-limit toast.
      if (connected && !seenRef.current[key]) {
        emit();
        return;
      }

      const timer = window.setTimeout(emit, DEBOUNCE_MS);
      pendingRef.current[key] = { timer, target: connected };
    },
    [],
  );

  const { liveCount, expectedCount } = useMemo(() => {
    let live = 0;
    let expected = 0;
    for (const a of attempts) {
      const kinds: Kind[] = ["webcam", "screen"];
      if (tokens[a.attempt_id]) kinds.push("sideeye");
      for (const k of kinds) {
        expected += 1;
        if (status[`${a.attempt_id}:${k}`]) live += 1;
      }
    }
    return { liveCount: live, expectedCount: expected };
  }, [attempts, tokens, status]);

  if (roleLoading) return null;
  if (!canProctor) return null;

  const offlineCount = Math.max(0, expectedCount - liveCount);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          <Eye className="h-4 w-4" /> Live view · Three-eye proctoring
          <Badge variant="secondary" className="text-[10px] h-5">{attempts.length} in progress</Badge>
          {!collapsed && expectedCount > 0 && (
            <>
              <Badge className="text-[10px] h-5 gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                <Wifi className="h-3 w-3" /> {liveCount} live
              </Badge>
              {offlineCount > 0 && (
                <Badge variant="outline" className="text-[10px] h-5 gap-1 border-rose-500/40 text-rose-400">
                  <WifiOff className="h-3 w-3" /> {offlineCount} offline
                </Badge>
              )}
            </>
          )}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setMuted((m) => {
                const next = !m;
                toast(next ? "Connection alerts muted" : "Connection alerts unmuted", {
                  id: "live-proctor-mute",
                  description: next
                    ? "Counts still update, but toasts are silenced on this device."
                    : "You'll be alerted again when streams flap.",
                });
                return next;
              });
            }}
            title={muted ? "Unmute connection alerts" : "Mute connection alerts"}
            aria-pressed={muted}
          >
            {muted ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
            <span className="ml-1 text-xs">{muted ? "Muted" : "Alerts"}</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            <span className="ml-1 text-xs">{collapsed ? "Show" : "Hide"}</span>
          </Button>
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-4">
          {attempts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No candidates currently in progress.</p>
          ) : (
            attempts.map((a) => (
              <div key={a.attempt_id} className="space-y-2">
                <div className="text-xs font-medium truncate">{a.candidate_name}</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <LiveStreamTile
                    attemptId={a.attempt_id}
                    channelId={`proctor:${a.attempt_id}:webcam`}
                    kind="webcam"
                    onConnectionChange={(c) => handleConn(a.attempt_id, "webcam", a.candidate_name, c)}
                  />
                  <LiveStreamTile
                    attemptId={a.attempt_id}
                    channelId={`proctor:${a.attempt_id}:screen`}
                    kind="screen"
                    onConnectionChange={(c) => handleConn(a.attempt_id, "screen", a.candidate_name, c)}
                  />
                  <LiveStreamTile
                    attemptId={a.attempt_id}
                    channelId={tokens[a.attempt_id] ? `proctor:sidecam:${tokens[a.attempt_id]}` : null}
                    kind="sideeye"
                    onConnectionChange={(c) => handleConn(a.attempt_id, "sideeye", a.candidate_name, c)}
                  />
                </div>
              </div>
            ))
          )}
          <p className="text-[10px] text-muted-foreground">
            Streams are peer-to-peer and only active while a candidate is in progress and their stream is live.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export default LiveProctorWall;

