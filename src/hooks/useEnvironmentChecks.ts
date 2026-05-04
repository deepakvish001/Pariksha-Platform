import { useCallback, useEffect, useState } from "react";

/**
 * Tier 4 pre-flight: probes the contestant's environment for things we
 * never want a secure session to start in (VMs, multi-monitor setups,
 * virtual cameras, browser extensions injecting code, suspicious user
 * agents, low-resolution displays). Returns a typed result so the UI
 * can render per-check status and the gate can decide pass/warn/fail.
 *
 * NOTE: Browser-side checks are best-effort and can be evaded by a
 * determined attacker. They exist to (a) deter casual cheating and
 * (b) feed the admin alerts panel with high-signal events for review.
 */

export type ProbeStatus = "pass" | "warn" | "fail";

export interface ProbeResult {
  id: string;
  label: string;
  status: ProbeStatus;
  detail?: string;
}

export interface EnvironmentReport {
  status: ProbeStatus; // worst of all probes
  probes: ProbeResult[];
  ranAt: number;
}

const VM_UA_PATTERNS = [
  /VirtualBox/i, /VMware/i, /QEMU/i, /Xen/i, /Parallels/i, /Hyper-?V/i,
  /Citrix/i, /CrossOver/i, /Wine/i,
];
const RDP_UA_PATTERNS = [/RDP/i, /TeamViewer/i, /AnyDesk/i, /VNC/i, /Chrome Remote/i];
const VIRTUAL_CAM_PATTERNS = [
  /OBS\s*Virtual/i, /OBS\s*Camera/i, /ManyCam/i, /XSplit/i, /Snap\s*Camera/i,
  /Streamlabs/i, /NDI/i, /vMix/i, /e2eSoft/i, /AlterCam/i, /YouCam/i,
  /Logi Capture/i, // Logitech virtual cam
];

async function detectVirtualCamera(): Promise<ProbeResult> {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return { id: "virtual_camera", label: "Camera", status: "warn", detail: "Cannot enumerate cameras" };
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");
    if (cams.length === 0) {
      return { id: "virtual_camera", label: "Camera", status: "fail", detail: "No camera detected" };
    }
    const labelHits = cams
      .map((c) => c.label || "")
      .filter((l) => VIRTUAL_CAM_PATTERNS.some((p) => p.test(l)));
    if (labelHits.length > 0) {
      return {
        id: "virtual_camera",
        label: "Camera",
        status: "fail",
        detail: `Virtual camera detected: ${labelHits.join(", ")}`,
      };
    }
    // Labels are blank until the user grants getUserMedia. We still pass —
    // the identity-verify step will catch a virtual camera anyway.
    return { id: "virtual_camera", label: "Camera", status: "pass", detail: `${cams.length} camera(s)` };
  } catch (e) {
    return { id: "virtual_camera", label: "Camera", status: "warn", detail: (e as Error).message };
  }
}

function detectVM(): ProbeResult {
  const ua = navigator.userAgent;
  for (const p of VM_UA_PATTERNS) {
    if (p.test(ua)) {
      return { id: "vm", label: "Virtual machine", status: "fail", detail: `UA matches ${p.source}` };
    }
  }
  for (const p of RDP_UA_PATTERNS) {
    if (p.test(ua)) {
      return { id: "vm", label: "Remote desktop", status: "fail", detail: `UA matches ${p.source}` };
    }
  }
  return { id: "vm", label: "Virtual machine", status: "pass" };
}

function detectMultiMonitor(): ProbeResult {
  try {
    const isExtended = (window.screen as unknown as { isExtended?: boolean }).isExtended;
    if (isExtended === true) {
      return {
        id: "multi_monitor",
        label: "Multi-monitor setup",
        status: "fail",
        detail: "Multiple displays detected — please disconnect external monitors",
      };
    }
    if (isExtended === false) {
      return { id: "multi_monitor", label: "Single display", status: "pass" };
    }
    return {
      id: "multi_monitor",
      label: "Display layout",
      status: "warn",
      detail: "Browser cannot confirm single-display setup",
    };
  } catch {
    return { id: "multi_monitor", label: "Display layout", status: "warn" };
  }
}

function detectResolution(): ProbeResult {
  const w = window.screen.width;
  const h = window.screen.height;
  if (w < 1024 || h < 600) {
    return {
      id: "resolution",
      label: "Screen resolution",
      status: "fail",
      detail: `${w}×${h} is below minimum 1024×600`,
    };
  }
  return { id: "resolution", label: "Screen resolution", status: "pass", detail: `${w}×${h}` };
}

function detectBrowser(): ProbeResult {
  const ua = navigator.userAgent;
  const isChromium = /Chrome\/(\d+)/.test(ua) && !/Edg\//.test(ua) === false ? false : /Chrome\/(\d+)/.test(ua);
  // Allow Chrome, Edge, Brave, Opera. Block Firefox/Safari (no reliable
  // screen-share constraints + getDisplayMedia parity).
  if (!isChromium) {
    return {
      id: "browser",
      label: "Browser",
      status: "fail",
      detail: "Use Chrome, Edge, Brave, or Opera (Chromium-based)",
    };
  }
  const m = /Chrome\/(\d+)/.exec(ua);
  const version = m ? parseInt(m[1], 10) : 0;
  if (version > 0 && version < 110) {
    return {
      id: "browser",
      label: "Browser",
      status: "warn",
      detail: `Chromium ${version} is older than recommended (110+)`,
    };
  }
  return { id: "browser", label: "Browser", status: "pass", detail: `Chromium ${version || "?"}` };
}

function detectExtensions(): ProbeResult {
  // Heuristic: many extensions inject elements with data-* attrs at <html>
  // root, or add <script> tags with chrome-extension:// src. We can't
  // enumerate extensions, but we can flag obvious code-helper injections.
  try {
    const html = document.documentElement;
    const suspiciousAttrs = Array.from(html.attributes)
      .map((a) => a.name)
      .filter((n) => /^data-(grammarly|wfd|new-?gr|lt|copilot|monica|merlin)/i.test(n));
    const scripts = Array.from(document.querySelectorAll("script"))
      .map((s) => s.getAttribute("src") || "")
      .filter((s) => s.startsWith("chrome-extension://") || s.startsWith("moz-extension://"));
    if (suspiciousAttrs.length > 0 || scripts.length > 0) {
      return {
        id: "extensions",
        label: "Browser extensions",
        status: "warn",
        detail: `Detected: ${[...suspiciousAttrs, ...scripts].slice(0, 3).join(", ")}`,
      };
    }
    return { id: "extensions", label: "Browser extensions", status: "pass" };
  } catch {
    return { id: "extensions", label: "Browser extensions", status: "warn" };
  }
}

function detectAutomation(): ProbeResult {
  // Catches headless / Selenium / Playwright / Puppeteer.
  const nav = navigator as Navigator & { webdriver?: boolean };
  if (nav.webdriver) {
    return { id: "automation", label: "Automation tooling", status: "fail", detail: "navigator.webdriver = true" };
  }
  if (/HeadlessChrome/i.test(navigator.userAgent)) {
    return { id: "automation", label: "Automation tooling", status: "fail", detail: "Headless browser" };
  }
  return { id: "automation", label: "Automation tooling", status: "pass" };
}

export function useEnvironmentChecks() {
  const [report, setReport] = useState<EnvironmentReport | null>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(async (): Promise<EnvironmentReport> => {
    setRunning(true);
    const probes: ProbeResult[] = [
      detectBrowser(),
      detectAutomation(),
      detectVM(),
      detectMultiMonitor(),
      detectResolution(),
      detectExtensions(),
      await detectVirtualCamera(),
    ];
    const status: ProbeStatus = probes.some((p) => p.status === "fail")
      ? "fail"
      : probes.some((p) => p.status === "warn")
        ? "warn"
        : "pass";
    const r: EnvironmentReport = { status, probes, ranAt: Date.now() };
    setReport(r);
    setRunning(false);
    return r;
  }, []);

  // Auto-run once on mount so the UI shows immediate results.
  useEffect(() => {
    void run();
  }, [run]);

  return { report, running, rerun: run };
}
