import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ChatRole = "candidate" | "proctor" | "system";

export interface AssessmentChatMessage {
  id: string;
  attempt_id: string;
  sender_user_id: string;
  sender_role: ChatRole;
  body: string;
  read_by_recipient: boolean;
  read_at: string | null;
  created_at: string;
}

const KEY = (attemptId: string) => ["assessment-chat", attemptId];

export function useAssessmentChat(attemptId: string | null | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: KEY(attemptId ?? ""),
    enabled: !!attemptId,
    queryFn: async (): Promise<AssessmentChatMessage[]> => {
      const { data, error } = await supabase
        .from("assessment_chat_messages")
        .select("*")
        .eq("attempt_id", attemptId!)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AssessmentChatMessage[];
    },
  });

  useEffect(() => {
    if (!attemptId) return;
    const channel = supabase
      .channel(`chat:${attemptId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "assessment_chat_messages",
          filter: `attempt_id=eq.${attemptId}`,
        },
        (payload) => {
          const msg = payload.new as AssessmentChatMessage;
          // Defensive: ignore stray events from other attempts/threads
          if (!msg || msg.attempt_id !== attemptId) return;
          qc.setQueryData<AssessmentChatMessage[]>(KEY(attemptId), (prev) => {
            const list = prev ?? [];
            if (list.some((m) => m.id === msg.id)) return list;
            return [...list, msg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "assessment_chat_messages",
          filter: `attempt_id=eq.${attemptId}`,
        },
        (payload) => {
          const msg = payload.new as AssessmentChatMessage;
          if (!msg || msg.attempt_id !== attemptId) return;
          qc.setQueryData<AssessmentChatMessage[]>(KEY(attemptId), (prev) => {
            const list = prev ?? [];
            // Only patch rows that belong to this thread
            return list.map((m) =>
              m.id === msg.id && m.attempt_id === attemptId ? { ...m, ...msg } : m
            );
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [attemptId, qc]);

  return query;
}

export async function sendChatMessage(opts: {
  attemptId: string;
  role: Extract<ChatRole, "candidate" | "proctor">;
  body: string;
}) {
  const trimmed = opts.body.trim();
  if (!trimmed) throw new Error("Empty message");
  if (trimmed.length > 2000) throw new Error("Message too long (max 2000 chars)");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("assessment_chat_messages").insert({
    attempt_id: opts.attemptId,
    sender_user_id: user.id,
    sender_role: opts.role,
    body: trimmed,
  });
  if (error) throw error;
}

export async function markMessagesRead(
  ids: string[],
  opts: { attemptId: string; viewerRole: "candidate" | "proctor" }
) {
  if (!ids.length) return;
  if (!opts?.attemptId || !opts?.viewerRole) {
    throw new Error("markMessagesRead requires attemptId and viewerRole");
  }
  const { error } = await supabase
    .from("assessment_chat_messages")
    .update({ read_by_recipient: true, read_at: new Date().toISOString() })
    .in("id", ids)
    .eq("attempt_id", opts.attemptId)
    .eq("read_by_recipient", false)
    // Never mark your own messages or system messages as read
    .neq("sender_role", opts.viewerRole)
    .neq("sender_role", "system");
  if (error) throw error;
}

export function useUnreadCount(
  messages: AssessmentChatMessage[] | undefined,
  viewerRole: "candidate" | "proctor"
) {
  return useMemo(() => {
    if (!messages) return 0;
    return messages.filter(
      (m) => m.sender_role !== viewerRole && m.sender_role !== "system" && !m.read_by_recipient
    ).length;
  }, [messages, viewerRole]);
}

/** Auto-marks incoming messages as read while the panel is open/visible. */
export function useAutoMarkRead(
  attemptId: string | null | undefined,
  messages: AssessmentChatMessage[] | undefined,
  viewerRole: "candidate" | "proctor",
  isOpen: boolean
) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!attemptId || !isOpen || !messages?.length) return;
    // Only consider messages that belong to this attempt thread
    const unread = messages.filter(
      (m) =>
        m.attempt_id === attemptId &&
        m.sender_role !== viewerRole &&
        m.sender_role !== "system" &&
        !m.read_by_recipient
    );
    if (!unread.length) return;
    const ids = unread.map((m) => m.id);
    const nowIso = new Date().toISOString();
    // optimistic update
    qc.setQueryData<AssessmentChatMessage[]>(KEY(attemptId), (prev) =>
      (prev ?? []).map((m) =>
        ids.includes(m.id) ? { ...m, read_by_recipient: true, read_at: nowIso } : m
      )
    );
    markMessagesRead(ids, { attemptId, viewerRole }).catch(() => {
      // revert silently on failure; realtime/refetch will reconcile
    });
  }, [attemptId, messages, viewerRole, isOpen, qc]);
}

export function useAutoScrollRef<T extends HTMLElement>(
  dep: unknown
): React.RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [dep]);
  return ref;
}

export interface ChatPresenceState {
  online: boolean;
  lastSeen: number | null;
  typing: boolean;
}

interface PresencePayload {
  role: "candidate" | "proctor";
  user_id: string;
  online_at: string;
}

interface TypingPayload {
  role: "candidate" | "proctor";
  user_id: string;
  typing: boolean;
  at: number;
}

const TYPING_TIMEOUT_MS = 4000;
// Throttle "typing=true" broadcasts so fast typing doesn't spam the channel.
const TYPING_BROADCAST_THROTTLE_MS = 1500;
// Debounce "typing=false" so brief pauses between keystrokes don't flicker
// the peer's typing indicator off/on.
const TYPING_STOP_DEBOUNCE_MS = 600;

// Presence heartbeat defaults. The heartbeat re-tracks the peer's presence
// payload at a steady interval; if we miss `staleAfterMs` without an update,
// we treat the peer as offline so "Last seen" advances when the tab closes
// without a clean unmount (browser kill, OS sleep, network drop, etc.).
const DEFAULT_PRESENCE_HEARTBEAT_MS = 15_000;
const DEFAULT_PRESENCE_STALE_MS = 45_000; // ~3 missed beats

export interface ChatPresenceOptions {
  /** How often to re-broadcast our presence. Defaults to 15s. */
  heartbeatMs?: number;
  /** Mark peer offline if no heartbeat is seen within this window. Defaults to 45s. */
  staleAfterMs?: number;
}

/**
 * Presence + typing indicators for an attempt's chat.
 * Uses Supabase Realtime presence (online/last-seen) and broadcast (typing).
 */
export function useChatPresence(
  attemptId: string | null | undefined,
  viewerRole: "candidate" | "proctor",
  viewerUserId: string | null | undefined,
  options: ChatPresenceOptions = {}
) {
  const heartbeatMs = Math.max(2_000, options.heartbeatMs ?? DEFAULT_PRESENCE_HEARTBEAT_MS);
  const staleAfterMs = Math.max(
    heartbeatMs * 2,
    options.staleAfterMs ?? DEFAULT_PRESENCE_STALE_MS
  );

  const [peer, setPeer] = useState<ChatPresenceState>({
    online: false,
    lastSeen: null,
    typing: false,
  });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const lastBroadcastRef = useRef<number>(0);
  // Last typing value we actually broadcast — used to dedupe.
  const lastSentTypingRef = useRef<boolean>(false);
  // Pending trailing-broadcast timers, so the final state isn't dropped.
  const trailingTrueTimerRef = useRef<number | null>(null);
  const stopDebounceTimerRef = useRef<number | null>(null);
  // Heartbeat + staleness bookkeeping.
  const heartbeatTimerRef = useRef<number | null>(null);
  const staleCheckTimerRef = useRef<number | null>(null);
  const peerLastBeatRef = useRef<number | null>(null);
  const peerRole = viewerRole === "candidate" ? "proctor" : "candidate";

  useEffect(() => {
    if (!attemptId || !viewerUserId) return;
    const channel = supabase.channel(`chat-presence:${attemptId}`, {
      config: { presence: { key: viewerUserId } },
    });
    channelRef.current = channel;

    const updateFromPresence = () => {
      const state = channel.presenceState() as Record<string, PresencePayload[]>;
      let online = false;
      let lastSeen: number | null = null;
      for (const entries of Object.values(state)) {
        for (const entry of entries) {
          if (entry.role === peerRole && entry.user_id !== viewerUserId) {
            online = true;
            const t = Date.parse(entry.online_at);
            if (!Number.isNaN(t) && (lastSeen === null || t > lastSeen)) lastSeen = t;
          }
        }
      }
      setPeer((prev) => ({
        ...prev,
        online,
        lastSeen: online ? Date.now() : prev.lastSeen,
        typing: online ? prev.typing : false,
      }));
    };

    channel
      .on("presence", { event: "sync" }, updateFromPresence)
      .on("presence", { event: "join" }, updateFromPresence)
      .on("presence", { event: "leave" }, () => {
        updateFromPresence();
        setPeer((prev) => ({ ...prev, lastSeen: Date.now() }));
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const p = payload as TypingPayload;
        if (!p || p.role !== peerRole || p.user_id === viewerUserId) return;
        if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
        if (p.typing) {
          setPeer((prev) => ({ ...prev, typing: true }));
          typingTimerRef.current = window.setTimeout(() => {
            setPeer((prev) => ({ ...prev, typing: false }));
          }, TYPING_TIMEOUT_MS);
        } else {
          setPeer((prev) => ({ ...prev, typing: false }));
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            role: viewerRole,
            user_id: viewerUserId,
            online_at: new Date().toISOString(),
          } satisfies PresencePayload);
        }
      });

    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      if (trailingTrueTimerRef.current) window.clearTimeout(trailingTrueTimerRef.current);
      if (stopDebounceTimerRef.current) window.clearTimeout(stopDebounceTimerRef.current);
      trailingTrueTimerRef.current = null;
      stopDebounceTimerRef.current = null;
      lastSentTypingRef.current = false;
      lastBroadcastRef.current = 0;
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [attemptId, viewerRole, viewerUserId, peerRole]);

  const sendTyping = useCallback(
    (typing: boolean) => {
      const channel = channelRef.current;
      if (!channel || !viewerUserId) return;

      // Emit raw payload to the channel + record state.
      const emit = (value: boolean) => {
        const now = Date.now();
        lastBroadcastRef.current = now;
        lastSentTypingRef.current = value;
        channel.send({
          type: "broadcast",
          event: "typing",
          payload: {
            role: viewerRole,
            user_id: viewerUserId,
            typing: value,
            at: now,
          } satisfies TypingPayload,
        });
      };

      if (typing) {
        // A new "typing" intent cancels any pending stop broadcast.
        if (stopDebounceTimerRef.current) {
          window.clearTimeout(stopDebounceTimerRef.current);
          stopDebounceTimerRef.current = null;
        }
        const now = Date.now();
        const elapsed = now - lastBroadcastRef.current;
        const canSendNow = !lastSentTypingRef.current || elapsed >= TYPING_BROADCAST_THROTTLE_MS;
        if (canSendNow) {
          if (trailingTrueTimerRef.current) {
            window.clearTimeout(trailingTrueTimerRef.current);
            trailingTrueTimerRef.current = null;
          }
          emit(true);
        } else if (!trailingTrueTimerRef.current) {
          // Schedule a trailing "still typing" ping so the indicator stays alive.
          const wait = TYPING_BROADCAST_THROTTLE_MS - elapsed;
          trailingTrueTimerRef.current = window.setTimeout(() => {
            trailingTrueTimerRef.current = null;
            // Only re-broadcast if no stop was queued in the meantime.
            if (!stopDebounceTimerRef.current) emit(true);
          }, wait);
        }
        return;
      }

      // typing === false: debounce so brief keystroke gaps don't flicker.
      if (trailingTrueTimerRef.current) {
        window.clearTimeout(trailingTrueTimerRef.current);
        trailingTrueTimerRef.current = null;
      }
      if (stopDebounceTimerRef.current) {
        window.clearTimeout(stopDebounceTimerRef.current);
      }
      // If we never broadcast "true", no need to broadcast "false".
      if (!lastSentTypingRef.current) return;
      stopDebounceTimerRef.current = window.setTimeout(() => {
        stopDebounceTimerRef.current = null;
        emit(false);
      }, TYPING_STOP_DEBOUNCE_MS);
    },
    [viewerRole, viewerUserId]
  );

  return { peer, sendTyping };
}
