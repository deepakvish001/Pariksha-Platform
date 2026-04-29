import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CoachRole = "user" | "assistant";
export interface CoachMessage {
  id: string;
  role: CoachRole;
  content: string;
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
    tasks: Array<{ title: string; topic: string; difficulty: string; status: string; est_minutes: number }>;
  }>;
  weak_topics?: Array<{ topic: string; total: number; done: number; pct: number }>;
  recent_completions?: Array<{ date: string; title: string; topic: string }>;
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

    let assistantSoFar = "";
    const pushDelta = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((cur) =>
        cur.map((m) => (m.id === assistantId ? { ...m, content: assistantSoFar } : m))
      );
    };

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

      if (!resp.ok || !resp.body) {
        let msg = `Request failed (${resp.status})`;
        try {
          const j = await resp.json();
          if (j?.error) msg = j.error;
        } catch { /* ignore */ }
        throw new Error(msg);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nl);
          textBuffer = textBuffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) pushDelta(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "" || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) pushDelta(content);
          } catch { /* ignore partials */ }
        }
      }

      if (!assistantSoFar) {
        setMessages((cur) =>
          cur.map((m) =>
            m.id === assistantId
              ? { ...m, content: "_(No response — please try again.)_" }
              : m
          )
        );
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        // user-cancelled, leave whatever has streamed so far
      } else {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setError(msg);
        setMessages((cur) =>
          cur.map((m) =>
            m.id === assistantId
              ? { ...m, content: `_⚠️ ${msg}_` }
              : m
          )
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [messages, streaming]);

  return { messages, streaming, error, send, reset, stop };
};
