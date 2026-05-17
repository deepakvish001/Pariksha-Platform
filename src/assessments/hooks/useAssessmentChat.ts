import { useEffect, useMemo, useRef, useState } from "react";
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

export function useUnreadCount(
  messages: AssessmentChatMessage[] | undefined,
  viewerRole: "candidate" | "proctor",
  isOpen: boolean
) {
  const [seenAt, setSeenAt] = useState<number>(() => Date.now());
  useEffect(() => {
    if (isOpen) setSeenAt(Date.now());
  }, [isOpen]);
  return useMemo(() => {
    if (!messages) return 0;
    return messages.filter(
      (m) => m.sender_role !== viewerRole && new Date(m.created_at).getTime() > seenAt
    ).length;
  }, [messages, viewerRole, seenAt]);
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
