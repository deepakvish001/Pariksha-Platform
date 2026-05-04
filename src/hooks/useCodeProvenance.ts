import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Code provenance ledger — captures keystroke counts, paste/cut events,
 * delete bursts, and periodic snapshots while a contestant is editing
 * code inside a secure contest session.
 *
 * The ledger lets admins replay typing patterns and prove that a
 * submitted solution was actually composed by the contestant rather
 * than pasted in from an external source (LLM, IDE, friend, etc).
 *
 * Events are batched and flushed every ~3s to keep DB load low while
 * still preserving sub-second resolution on the timeline.
 */
export interface ProvenanceContext {
  sessionId: string | null;
  contestId: string | null;
  userId: string | null;
  problemId: string | null;
  /** Editor DOM target (textarea/contenteditable). When null, the hook is a no-op. */
  target: HTMLElement | null;
  /** Optional snapshot of the current code, taken every ~30s. */
  getSnapshot?: () => string;
}

type Event = {
  event_type:
    | "keystroke"
    | "paste"
    | "cut"
    | "delete_block"
    | "ai_suggest"
    | "undo"
    | "redo"
    | "snapshot";
  char_count?: number;
  paste_size?: number;
  diff_summary?: Record<string, unknown>;
  client_ts: string;
  suspicious?: boolean;
  reason?: string;
};

const FLUSH_MS = 3_000;
const SNAPSHOT_MS = 30_000;
const LARGE_PASTE_THRESHOLD = 80; // chars

export function useCodeProvenance(ctx: ProvenanceContext) {
  const buffer = useRef<Event[]>([]);
  const flushTimer = useRef<number | null>(null);
  const snapshotTimer = useRef<number | null>(null);

  useEffect(() => {
    const { target, sessionId, contestId, userId, problemId } = ctx;
    if (!target || !sessionId || !contestId || !userId || !problemId) return;

    let keystrokesInWindow = 0;
    let lastDeleteBurst = 0;

    const flush = async () => {
      if (buffer.current.length === 0) return;
      const batch = buffer.current.splice(0, buffer.current.length);
      try {
        await supabase.from("contest_code_provenance").insert(
          batch.map((e) => ({
            session_id: sessionId,
            contest_id: contestId,
            user_id: userId,
            problem_id: problemId,
            ...e,
          })),
        );
      } catch {
        // best-effort, do not crash the editor
      }
    };

    const push = (e: Event) => {
      buffer.current.push(e);
      if (buffer.current.length > 200) void flush();
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      keystrokesInWindow++;
      if (ev.key === "Backspace" || ev.key === "Delete") {
        lastDeleteBurst++;
        if (lastDeleteBurst > 25) {
          push({
            event_type: "delete_block",
            char_count: lastDeleteBurst,
            client_ts: new Date().toISOString(),
            suspicious: true,
            reason: "rapid_delete_burst",
          });
          lastDeleteBurst = 0;
        }
      } else {
        lastDeleteBurst = 0;
      }
      // Detect undo/redo
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "z") {
        push({
          event_type: ev.shiftKey ? "redo" : "undo",
          client_ts: new Date().toISOString(),
        });
      }
    };

    const onPaste = (ev: ClipboardEvent) => {
      const text = ev.clipboardData?.getData("text") ?? "";
      const size = text.length;
      const suspicious = size >= LARGE_PASTE_THRESHOLD;
      push({
        event_type: "paste",
        paste_size: size,
        client_ts: new Date().toISOString(),
        suspicious,
        reason: suspicious ? "large_paste" : undefined,
        diff_summary: {
          first_chars: text.slice(0, 40),
          line_count: text.split("\n").length,
        },
      });
    };

    const onCut = (ev: ClipboardEvent) => {
      push({
        event_type: "cut",
        paste_size: (ev.clipboardData?.getData("text") ?? "").length,
        client_ts: new Date().toISOString(),
      });
    };

    target.addEventListener("keydown", onKeyDown);
    target.addEventListener("paste", onPaste);
    target.addEventListener("cut", onCut);

    flushTimer.current = window.setInterval(() => {
      if (keystrokesInWindow > 0) {
        push({
          event_type: "keystroke",
          char_count: keystrokesInWindow,
          client_ts: new Date().toISOString(),
        });
        keystrokesInWindow = 0;
      }
      void flush();
    }, FLUSH_MS);

    if (ctx.getSnapshot) {
      snapshotTimer.current = window.setInterval(() => {
        const code = ctx.getSnapshot?.() ?? "";
        push({
          event_type: "snapshot",
          char_count: code.length,
          client_ts: new Date().toISOString(),
          diff_summary: {
            line_count: code.split("\n").length,
            hash: simpleHash(code),
          },
        });
      }, SNAPSHOT_MS);
    }

    return () => {
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("paste", onPaste);
      target.removeEventListener("cut", onCut);
      if (flushTimer.current) window.clearInterval(flushTimer.current);
      if (snapshotTimer.current) window.clearInterval(snapshotTimer.current);
      void flush();
    };
  }, [ctx.target, ctx.sessionId, ctx.contestId, ctx.userId, ctx.problemId]);
}

function simpleHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16);
}
