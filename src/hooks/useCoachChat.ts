import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CoachRole = "user" | "assistant";
export type CoachActionKind =
  | "start_today"
  | "reschedule_today"
  | "reschedule_tomorrow"
  | "mark_done";

export interface CoachAction {
  task_id: string;
  task_title: string;
  kind: CoachActionKind;
  reason: string;
}

export interface CoachMessage {
  id: string;
  role: CoachRole;
  content: string;
  actions?: CoachAction[];
}

export interface CoachContext {
  goal?: string | null;
  level?: string | null;
  target_date?: string | null;
  weekday_minutes?: number | null;
  weekend_minutes?: number | null;
  streak_days?: number | null;
  totals?: { total: number; done: number; skipped: number; pending: number };
  today?: { date: string; total: number; done: number };
  upcoming_days?: Array<{
    date: string;
    tasks: Array<{ id: string; title: string; topic: string; difficulty: string; status: string; est_minutes: number }>;
  }>;
  weak_topics?: Array<{ topic: string; total: number; done: number; pct: number }>;
  recent_completions?: Array<{ date: string; title: string; topic: string }>;
  overdue?: Array<{ id: string; title: string; topic: string; day_date: string; est_minutes: number }>;
}

const COACH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plan-coach`;

export const useCoachChat = () => {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStreaming(false);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const consumeAction = useCallback((messageId: string, taskId: string) => {
    setMessages((cur) =>
      cur.map((m) =>
        m.id === messageId
          ? { ...m, actions: (m.actions ?? []).filter((a) => a.task_id !== taskId) }
          : m
      )
    );
  }, []);

  const send = useCallback(async (input: string, context: CoachContext) => {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    setError(null);

    const userMsg: CoachMessage = {
      id: crypto.randomUUID(), role: "user", content: trimmed,
    };
    const assistantId = crypto.randomUUID();
    const baseHistory = messages.map(({ role, content }) => ({ role, content }));
    setMessages((cur) => [...cur, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("You must be signed in to use the coach.");

      const resp = await fetch(COACH_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [...baseHistory, { role: "user", content: trimmed }],
          context,
        }),
      });

      const json = await resp.json().catch(() => ({} as Record<string, unknown>));
      if (!resp.ok) {
        const msg = (json as { error?: string })?.error ?? `Request failed (${resp.status})`;
        throw new Error(msg);
      }

      const summary = (json as { summary_md?: string }).summary_md ?? "";
      const actions = ((json as { actions?: CoachAction[] }).actions ?? []).filter(
        (a) => a && typeof a.task_id === "string" && typeof a.task_title === "string"
      );

      setMessages((cur) =>
        cur.map((m) =>
          m.id === assistantId
            ? { ...m, content: summary || "_(No response — please try again.)_", actions }
            : m
        )
      );
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      setMessages((cur) =>
        cur.map((m) =>
          m.id === assistantId ? { ...m, content: `_⚠️ ${msg}_` } : m
        )
      );
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [messages, streaming]);

  return { messages, streaming, error, send, reset, stop, consumeAction };
};
