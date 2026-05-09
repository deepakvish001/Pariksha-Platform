import { useEffect, useRef } from "react";
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
  | "context_menu"
  | "right_click"
  | "submit";

const PENALTY: Partial<Record<EventKind, number>> = {
  visibility_hidden: 5,
  window_blur: 3,
  fullscreen_exit: 8,
  copy: 2,
  paste: 4,
  context_menu: 1,
  right_click: 1,
};

/**
 * Hooks proctoring listeners onto the document while an attempt is active.
 * Logs events to attempt_events and decrements integrity_score for suspicious activity.
 */
export function useProctoring(attemptId: string | undefined, enabled: boolean) {
  const integrityRef = useRef<number>(100);

  // Log helper
  const log = async (kind: EventKind, payload: Record<string, unknown> = {}) => {
    if (!attemptId) return;
    try {
      await supabase.from("attempt_events").insert({ attempt_id: attemptId, kind, payload: payload as never });
      const penalty = PENALTY[kind] ?? 0;
      if (penalty > 0) {
        integrityRef.current = Math.max(0, integrityRef.current - penalty);
        await supabase
          .from("assessment_attempts")
          .update({ integrity_score: integrityRef.current })
          .eq("id", attemptId);
      }
    } catch {
      /* swallow — proctoring should never break the player */
    }
  };

  useEffect(() => {
    if (!enabled || !attemptId) return;

    log("attempt_start");

    const onVisibility = () => log(document.hidden ? "visibility_hidden" : "visibility_visible");
    const onBlur = () => log("window_blur");
    const onFocus = () => log("window_focus");
    const onFs = () => log(document.fullscreenElement ? "fullscreen_enter" : "fullscreen_exit");
    const onCopy = () => log("copy");
    const onPaste = () => log("paste");
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      log("context_menu");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContext);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContext);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, enabled]);

  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      /* user denied */
    }
  };

  return { logEvent: log, requestFullscreen };
}
