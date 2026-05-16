import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type EventKind =
  | "attempt_start"
  | "visibility_hidden"
  | "visibility_visible"
  | "window_blur"
  | "window_focus"
  | "fullscreen_enter"
  | "fullscreen_exit"
  | "copy"
  | "paste"
  | "cut"
  | "context_menu"
  | "right_click"
  | "submit"
  | "lockdown_enter"
  | "lockdown_fail"
  | "webcam_grant"
  | "webcam_deny"
  | "webcam_snapshot"
  | "webcam_lost"
  | "devtools_attempt"
  | "print_blocked"
  | "auto_submitted"
  | "violation_strike";

const PENALTY: Partial<Record<EventKind, number>> = {
  visibility_hidden: 5,
  window_blur: 3,
  fullscreen_exit: 8,
  copy: 2,
  cut: 2,
  paste: 4,
  context_menu: 1,
  right_click: 1,
  devtools_attempt: 10,
  print_blocked: 5,
  webcam_lost: 10,
};

/** Counts as a "strike" toward auto-submit. */
const STRIKE_KINDS: ReadonlySet<EventKind> = new Set<EventKind>([
  "visibility_hidden",
  "window_blur",
  "fullscreen_exit",
  "devtools_attempt",
  "webcam_lost",
]);

export const MAX_VIOLATIONS = 3;

export interface ProctoringOptions {
  /** Called when violations reach MAX_VIOLATIONS — host should auto-submit. */
  onAutoSubmit?: () => void;
  /** Called every time a strike is recorded (with new total). */
  onStrike?: (total: number, kind: EventKind) => void;
}

/**
 * Hardened proctoring listeners. Active while an attempt is in_progress.
 * - Blocks copy/cut/paste/contextmenu/print/devtools/view-source.
 * - Counts strikes for tab-switch / fullscreen-exit / devtools / webcam-loss.
 * - Triggers auto-submit at MAX_VIOLATIONS.
 */
export function useProctoring(
  attemptId: string | undefined,
  enabled: boolean,
  opts: ProctoringOptions = {}
) {
  const integrityRef = useRef<number>(100);
  const violationsRef = useRef<number>(0);
  const [violations, setViolations] = useState(0);
  const [fullscreenLost, setFullscreenLost] = useState(false);
  const submittedRef = useRef(false);
  const optsRef = useRef(opts);
  useEffect(() => { optsRef.current = opts; }, [opts]);

  const log = useCallback(async (kind: EventKind, payload: Record<string, unknown> = {}) => {
    if (!attemptId) return;
    try {
      await supabase.from("attempt_events").insert({
        attempt_id: attemptId,
        kind,
        payload: payload as never,
      });
      const penalty = PENALTY[kind] ?? 0;
      if (penalty > 0) {
        integrityRef.current = Math.max(0, integrityRef.current - penalty);
      }
      if (STRIKE_KINDS.has(kind)) {
        violationsRef.current += 1;
        const total = violationsRef.current;
        setViolations(total);
        await supabase
          .from("assessment_attempts")
          .update({
            integrity_score: integrityRef.current,
            violations: total,
          })
          .eq("id", attemptId);
        await supabase.from("attempt_events").insert({
          attempt_id: attemptId,
          kind: "violation_strike",
          payload: { total, trigger: kind } as never,
        });
        optsRef.current.onStrike?.(total, kind);
        if (total >= MAX_VIOLATIONS && !submittedRef.current) {
          submittedRef.current = true;
          await supabase.from("attempt_events").insert({
            attempt_id: attemptId,
            kind: "auto_submitted",
            payload: { reason: "max_violations" } as never,
          });
          optsRef.current.onAutoSubmit?.();
        }
      } else if (penalty > 0) {
        await supabase
          .from("assessment_attempts")
          .update({ integrity_score: integrityRef.current })
          .eq("id", attemptId);
      }
    } catch {
      /* swallow — proctoring should never break the player */
    }
  }, [attemptId]);

  useEffect(() => {
    if (!enabled || !attemptId) return;
    log("attempt_start");

    const onVisibility = () =>
      log(document.hidden ? "visibility_hidden" : "visibility_visible");
    const onBlur = () => log("window_blur");
    const onFocus = () => log("window_focus");
    const onFs = () => {
      const inFs = !!document.fullscreenElement;
      if (inFs) {
        setFullscreenLost(false);
        log("fullscreen_enter");
      } else {
        setFullscreenLost(true);
        log("fullscreen_exit");
      }
    };

    const blockClipboard = (kind: "copy" | "cut" | "paste") => (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      // Allow paste/copy INSIDE form inputs so candidates can edit their own answers
      const inEditor =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable ||
        !!target?.closest(".monaco-editor");
      if (!inEditor) {
        e.preventDefault();
        log(kind);
      }
    };
    const onCopy = blockClipboard("copy");
    const onCut = blockClipboard("cut");
    const onPaste = blockClipboard("paste");

    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      log("context_menu");
    };
    const onDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName !== "INPUT" && target?.tagName !== "TEXTAREA") {
        e.preventDefault();
      }
    };
    const onSelectStart = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const inEditor =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable ||
        !!target?.closest(".monaco-editor") ||
        !!target?.closest("[data-allow-select]");
      if (!inEditor) e.preventDefault();
    };

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const cmd = e.metaKey || e.ctrlKey;
      // Block print + save shortcuts globally
      if (cmd && (k === "p" || k === "s")) {
        e.preventDefault();
        log("print_blocked");
        return;
      }
      // Block view-source
      if (cmd && k === "u") {
        e.preventDefault();
        log("devtools_attempt");
        return;
      }
      // Block devtools (F12, Ctrl+Shift+I/J/C)
      if (e.key === "F12" || (cmd && e.shiftKey && (k === "i" || k === "j" || k === "c"))) {
        e.preventDefault();
        log("devtools_attempt");
        return;
      }
    };

    const onBeforePrint = () => log("print_blocked");

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("selectstart", onSelectStart);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("beforeprint", onBeforePrint);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("selectstart", onSelectStart);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("beforeprint", onBeforePrint);
    };
  }, [attemptId, enabled, log]);

  const requestFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreenLost(false);
    } catch {
      /* user denied */
    }
  }, []);

  return {
    logEvent: log,
    requestFullscreen,
    violations,
    maxViolations: MAX_VIOLATIONS,
    fullscreenLost,
  };
}
