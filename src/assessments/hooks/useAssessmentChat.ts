import { useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
          qc.setQueryData<AssessmentChatMessage[]>(KEY(attemptId), (prev) => {
            const list = prev ?? [];
            return list.map((m) => (m.id === msg.id ? { ...m, ...msg } : m));
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

export async function markMessagesRead(ids: string[]) {
  if (!ids.length) return;
  const { error } = await supabase
    .from("assessment_chat_messages")
    .update({ read_by_recipient: true, read_at: new Date().toISOString() })
    .in("id", ids)
    .eq("read_by_recipient", false);
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
    const unread = messages.filter(
      (m) => m.sender_role !== viewerRole && m.sender_role !== "system" && !m.read_by_recipient
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
    markMessagesRead(ids).catch(() => {
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
