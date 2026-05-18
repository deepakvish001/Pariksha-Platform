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
  // Trust Gate attestation runs exactly once per session.
  const attestedRef = useRef<string | null>(null);

  // ---- One-shot Trust Gate attestation on activation ----
  useEffect(() => {
    if (!enabled || !sessionId) return;
    if (attestedRef.current === sessionId) return;
    attestedRef.current = sessionId;
    (async () => {
      try {
        // Collect a lightweight environment snapshot. Heavier signals
        // (selfie match, side-eye paired) are filled by their own steps;
        // the engine evaluates failures by what's present.
        let webglRenderer: string | null = null;
        try {
          const c = document.createElement("canvas");
          const gl = (c.getContext("webgl") || c.getContext("experimental-webgl")) as WebGLRenderingContext | null;
          const ext = gl?.getExtension("WEBGL_debug_renderer_info");
          if (gl && ext) webglRenderer = gl.getParameter((ext as { UNMASKED_RENDERER_WEBGL: number }).UNMASKED_RENDERER_WEBGL) as string;
        } catch { /* ignore */ }
        const nav = navigator as Navigator & { webdriver?: boolean };
        const automation: string[] = [];
        if (nav.webdriver) automation.push("webdriver");
        if (/HeadlessChrome/i.test(navigator.userAgent)) automation.push("headless");
        const isExtended = (window.screen as unknown as { isExtended?: boolean }).isExtended;
        const widthGap = window.outerWidth - window.innerWidth;
        const heightGap = window.outerHeight - window.innerHeight;
        const snapshot = {
          single_monitor: isExtended === false ? true : isExtended === true ? false : null,
          vm_detected: /(VirtualBox|VMware|QEMU|Xen|Parallels|Hyper-?V)/i.test(navigator.userAgent),
          rdp_detected: /(RDP|TeamViewer|AnyDesk|VNC|Chrome Remote)/i.test(navigator.userAgent),
          webgl_renderer: webglRenderer,
          devtools_open: widthGap > 160 || heightGap > 160,
          automation_flags: automation,
          user_agent: navigator.userAgent,
        };
        await supabase.functions.invoke("contest-environment-attest", {
          body: { session_id: sessionId, snapshot },
        });
      } catch {
        // Attestation failure does not block the player — the gate will
        // re-evaluate on next reload and the violation engine will
        // independently catch critical signals.
      }
    })();
  }, [enabled, sessionId]);


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

  // ---- Window Management API: react to screens being added mid-test ----
  useEffect(() => {
    if (!enabled || !sessionId) return;
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const wm = (window as unknown as { getScreenDetails?: () => Promise<{ screens: unknown[]; addEventListener: (e: string, h: () => void) => void; removeEventListener: (e: string, h: () => void) => void }> }).getScreenDetails;
        if (!wm) return;
        const details = await wm();
        const onChange = () => {
          if ((details.screens?.length ?? 1) > 1) {
            void report.current("second_monitor", "critical", { source: "screens.onchange", count: details.screens.length }, 30_000);
          }
        };
        details.addEventListener("screenschange", onChange);
        onChange();
        cleanup = () => details.removeEventListener("screenschange", onChange);
      } catch { /* permission denied — silent */ }
    })();
    return () => { cleanup?.(); };
  }, [enabled, sessionId]);

  // ---- Periodic silent identity recheck (every 10 min) ----
  useEffect(() => {
    if (!enabled || !sessionId) return;
    const recheck = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
        const video = document.createElement("video");
        video.srcObject = stream;
        await video.play().catch(() => {});
        await new Promise((r) => setTimeout(r, 400));
        const canvas = document.createElement("canvas");
        canvas.width = 320; canvas.height = 240;
        canvas.getContext("2d")?.drawImage(video, 0, 0, 320, 240);
        const frame = canvas.toDataURL("image/jpeg", 0.6);
        stream.getTracks().forEach((t) => t.stop());
        await supabase.functions.invoke("contest-identity-verify", {
          body: { session_id: sessionId, mode: "recheck", frame },
        });
      } catch { /* webcam unavailable — main proctoring will flag */ }
    };
    const id = window.setInterval(recheck, 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [enabled, sessionId]);

  // ---- Print Screen attempt (Layer 1) ----
  // The browser cannot block PrintScreen at the OS level, but we can detect
  // the keydown and flag it as a critical violation. Most candidates who do
  // this lose the session immediately under `hard` enforcement.
  useEffect(() => {
    if (!enabled || !sessionId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        void report.current("print_screen_attempt", "critical", {}, 5_000);
      }
      // Snipping Tool / OS screenshot hotkeys (Win+Shift+S, Cmd+Shift+3/4/5)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && /^(3|4|5|s|S)$/.test(e.key)) {
        void report.current("os_screenshot_hotkey", "high", { key: e.key }, 5_000);
      }
    };
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
    };
  }, [enabled, sessionId]);

  // ---- Copy attempt (Layer 1 forensic) ----
  useEffect(() => {
    if (!enabled || !sessionId) return;
    const onCopy = (e: ClipboardEvent) => {
      const text = window.getSelection()?.toString() ?? "";
      if (text.length > 40) {
        void report.current("copy_attempt", "high", { chars: text.length }, 5_000);
      } else if (text.length > 0) {
        void report.current("copy_attempt", "warn", { chars: text.length }, 10_000);
      }
    };
    document.addEventListener("copy", onCopy, true);
    return () => document.removeEventListener("copy", onCopy, true);
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
