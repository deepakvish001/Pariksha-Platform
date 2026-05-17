import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProctoringConfig, ProctoringEventKey } from "../lib/proctoringConfig";
import { getPreset } from "../lib/proctoringConfig";

/** Stable event-kind strings written to `attempt_events.kind`. */
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
  | "paste_large"
  | "typing_burst"
  | "context_menu"
  | "right_click"
  | "submit"
  | "lockdown_enter"
  | "lockdown_fail"
  | "webcam_grant"
  | "webcam_deny"
  | "webcam_snapshot"
  | "webcam_lost"
  | "no_face"
  | "multi_face"
  | "second_monitor"
  | "screenshare_lost"
  | "device_change"
  | "side_eye_lost"
  | "devtools_attempt"
  | "print_blocked"
  | "auto_submitted"
  | "violation_strike";

/** Map a raw event-kind to the config rule key. */
const EVENT_TO_RULE: Partial<Record<EventKind, ProctoringEventKey>> = {
  visibility_hidden: "tab_switch",
  window_blur: "window_blur",
  fullscreen_exit: "fullscreen_exit",
  copy: "copy",
  cut: "copy",
  paste: "paste",
  paste_large: "paste_large",
  typing_burst: "typing_burst",
  devtools_attempt: "devtools_attempt",
  print_blocked: "print_blocked",
  webcam_lost: "webcam_lost",
  no_face: "no_face",
  multi_face: "multi_face",
  second_monitor: "second_monitor",
  screenshare_lost: "screenshare_lost",
  device_change: "device_change",
  side_eye_lost: "side_eye_lost",
};

export interface ProctoringOptions {
  config?: ProctoringConfig;
  /** Called when violations reach max_violations OR an event with autosubmit_after fires. */
  onAutoSubmit?: (reason: string) => void;
  /** Called every time a strike is recorded (with new total). */
  onStrike?: (total: number, kind: EventKind, reason: string) => void;
}

/**
 * Config-driven proctoring listeners. Active while an attempt is in_progress.
 * Blocks copy/cut/paste/contextmenu/print/devtools/view-source globally.
 * Strikes, weights, and auto-submit thresholds come from `config`.
 */
export function useProctoring(
  attemptId: string | undefined,
  enabled: boolean,
  opts: ProctoringOptions = {}
) {
  const cfg = opts.config ?? getPreset("balanced");
  const cfgRef = useRef(cfg);
  useEffect(() => {
    cfgRef.current = cfg;
  }, [cfg]);

  const integrityRef = useRef<number>(100);
  const violationsRef = useRef<number>(0);
  const eventCountsRef = useRef<Record<string, number>>({});
  const [violations, setViolations] = useState(0);
  const [fullscreenLost, setFullscreenLost] = useState(false);
  const submittedRef = useRef(false);
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  }, [opts]);

  const log = useCallback(
    async (kind: EventKind, payload: Record<string, unknown> = {}) => {
      if (!attemptId) return;
      try {
        await supabase.from("attempt_events").insert({
          attempt_id: attemptId,
          kind,
          payload: payload as never,
        });

        const ruleKey = EVENT_TO_RULE[kind];
        const rule = ruleKey ? cfgRef.current.events[ruleKey] : undefined;
        if (!rule) return;

        // Integrity penalty
        if (rule.weight && rule.weight < 100) {
          integrityRef.current = Math.max(0, integrityRef.current - rule.weight);
        }

        // Strike accounting
        if (rule.strike) {
          violationsRef.current += 1;
          const total = violationsRef.current;
          setViolations(total);
          await supabase
            .from("assessment_attempts")
            .update({ integrity_score: integrityRef.current, violations: total })
            .eq("id", attemptId);
          await supabase.from("attempt_events").insert({
            attempt_id: attemptId,
            kind: "violation_strike",
            payload: { total, trigger: kind } as never,
          });
          optsRef.current.onStrike?.(total, kind, kind.replace(/_/g, " "));
        } else if (rule.weight) {
          await supabase
            .from("assessment_attempts")
            .update({ integrity_score: integrityRef.current })
            .eq("id", attemptId);
        }

        // Per-event auto-submit threshold
        eventCountsRef.current[kind] = (eventCountsRef.current[kind] ?? 0) + 1;
        const perEventCap = rule.autosubmit_after;
        const hitPerEvent =
          typeof perEventCap === "number" && eventCountsRef.current[kind] >= perEventCap;
        const hitTotal =
          rule.strike && violationsRef.current >= cfgRef.current.max_violations;
        if ((hitPerEvent || hitTotal) && !submittedRef.current) {
          submittedRef.current = true;
          const reason = hitPerEvent ? `${kind}_threshold` : "max_violations";
          await supabase.from("attempt_events").insert({
            attempt_id: attemptId,
            kind: "auto_submitted",
            payload: { reason, trigger: kind } as never,
          });
          optsRef.current.onAutoSubmit?.(reason);
        }
      } catch {
        /* swallow — proctoring should never break the player */
      }
    },
    [attemptId]
  );

  useEffect(() => {
    if (!enabled || !attemptId) return;
    log("attempt_start");

    // Capture coarse geolocation at session start (best-effort, consent-gated by browser).
    // Stored on assessment_attempts.start_geo for proctoring playback.
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await supabase
              .from("assessment_attempts")
              .update({
                start_geo: {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                  accuracy_m: pos.coords.accuracy,
                  ts: new Date().toISOString(),
                } as never,
              })
              .eq("id", attemptId);
          } catch {
            /* ignore */
          }
        },
        () => {
          /* user denied or unavailable — non-blocking */
        },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
      );
    }

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

    const blockClipboard =
      (kind: "copy" | "cut" | "paste") => (e: ClipboardEvent) => {
        const target = e.target as HTMLElement | null;
        const inEditor =
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable ||
          !!target?.closest(".monaco-editor");

        const allowInputs = cfgRef.current.allow_clipboard_in_inputs;
        if (!inEditor || !allowInputs) {
          e.preventDefault();
          log(kind);
          return;
        }

        // Even when allowed inside inputs, flag large pastes for analysis
        if (kind === "paste") {
          const text = e.clipboardData?.getData("text") ?? "";
          if (text.length > 50) {
            log("paste_large", { length: text.length });
          }
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
      if (cmd && (k === "p" || k === "s")) {
        e.preventDefault();
        log("print_blocked");
        return;
      }
      if (cmd && k === "u") {
        e.preventDefault();
        log("devtools_attempt");
        return;
      }
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
    maxViolations: cfg.max_violations,
    fullscreenLost,
    config: cfg,
  };
}

/** Backwards-compatible export — old code reads this constant. */
export const MAX_VIOLATIONS = 3;
