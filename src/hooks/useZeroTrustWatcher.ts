import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type Severity = "info" | "warn" | "high" | "critical";

/**
 * Continuous integrity watcher. Single sink that forwards every runtime
 * signal to the `contest-violation-engine` edge function, which decides
 * whether to log / warn / auto-terminate based on the contest's
 * enforcement_mode.
 *
 * Signals wired here are universal (browser-only, no media). Specialised
 * watchers (face / second-person / voice / side-eye / display-capture /
 * keystroke / paste-burst / free-text-AI) already exist and call
 * `reportViolation` exposed by this hook directly.
 */
export function useZeroTrustWatcher(sessionId: string | null, enabled = true) {
  // Throttle map: category -> last sent timestamp (ms)
  const lastSentRef = useRef<Record<string, number>>({});

  // Always-fresh reporter so child hooks can `const { report } = useZeroTrustWatcher(...)`
  const report = useRef(async (
    category: string,
    severity: Severity,
    meta?: Record<string, unknown>,
    throttleMs = 5_000,
  ) => {
    if (!sessionId) return;
    const now = Date.now();
    const key = `${category}:${severity}`;
    if (now - (lastSentRef.current[key] ?? 0) < throttleMs) return;
    lastSentRef.current[key] = now;
    try {
      await supabase.functions.invoke("contest-violation-engine", {
        body: { session_id: sessionId, category, severity, meta },
      });
    } catch {
      // Engine outage must NOT crash the player. The DLQ will catch up.
    }
  });
  // Rebind on sessionId change
  useEffect(() => {
    const fn = report.current;
    report.current = async (category, severity, meta, throttleMs = 5_000) => {
      if (!sessionId) return;
      const now = Date.now();
      const key = `${category}:${severity}`;
      if (now - (lastSentRef.current[key] ?? 0) < throttleMs) return;
      lastSentRef.current[key] = now;
      try {
        await supabase.functions.invoke("contest-violation-engine", {
          body: { session_id: sessionId, category, severity, meta },
        });
      } catch { /* swallow */ }
    };
    return () => { report.current = fn; };
  }, [sessionId]);

  // ---- Devtools-open detector (window-size delta) ----
  useEffect(() => {
    if (!enabled || !sessionId) return;
    const THRESHOLD = 160;
    const check = () => {
      const widthGap = window.outerWidth - window.innerWidth;
      const heightGap = window.outerHeight - window.innerHeight;
      if (widthGap > THRESHOLD || heightGap > THRESHOLD) {
        void report.current("devtools_open", "critical", { widthGap, heightGap }, 30_000);
      }
    };
    const id = window.setInterval(check, 1500);
    return () => window.clearInterval(id);
  }, [enabled, sessionId]);

  // ---- Mid-test second-monitor detector ----
  useEffect(() => {
    if (!enabled || !sessionId) return;
    const check = () => {
      const isExtended = (window.screen as unknown as { isExtended?: boolean }).isExtended;
      if (isExtended === true) {
        void report.current("second_monitor", "critical", {}, 30_000);
      }
    };
    check();
    const id = window.setInterval(check, 4000);
    return () => window.clearInterval(id);
  }, [enabled, sessionId]);

  // ---- Mid-test automation flag detector ----
  useEffect(() => {
    if (!enabled || !sessionId) return;
    const nav = navigator as Navigator & { webdriver?: boolean };
    if (nav.webdriver || /HeadlessChrome/i.test(navigator.userAgent)) {
      void report.current("automation_detected", "critical",
        { webdriver: !!nav.webdriver, ua: navigator.userAgent }, 60_000);
    }
  }, [enabled, sessionId]);

  // ---- Tab/window hide for prolonged period ----
  useEffect(() => {
    if (!enabled || !sessionId) return;
    let hiddenAt = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (hiddenAt) {
        const ms = Date.now() - hiddenAt;
        hiddenAt = 0;
        if (ms > 8000) void report.current("tab_hidden_long", "high", { ms }, 10_000);
        else if (ms > 1500) void report.current("tab_hidden", "warn", { ms }, 10_000);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [enabled, sessionId]);

  // ---- Paste burst detector (large clipboard injections) ----
  useEffect(() => {
    if (!enabled || !sessionId) return;
    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text") ?? "";
      const len = text.length;
      if (len > 800) {
        void report.current("paste_burst", "high", { chars: len }, 8_000);
      } else if (len > 200) {
        void report.current("paste_burst", "warn", { chars: len }, 8_000);
      }
    };
    document.addEventListener("paste", onPaste, true);
    return () => document.removeEventListener("paste", onPaste, true);
  }, [enabled, sessionId]);

  // ---- Network offline as info (existing useOnline handles UX) ----
  useEffect(() => {
    if (!enabled || !sessionId) return;
    const onOff = () => void report.current("network_offline", "warn", {}, 15_000);
    window.addEventListener("offline", onOff);
    return () => window.removeEventListener("offline", onOff);
  }, [enabled, sessionId]);

  return {
    /**
     * Manually report a violation from a specialised watcher
     * (face match, audio, keystroke, AI-text-classifier, side-eye, etc.)
     */
    reportViolation: (
      category: string,
      severity: Severity,
      meta?: Record<string, unknown>,
      throttleMs?: number,
    ) => report.current(category, severity, meta, throttleMs),
  };
}
