/**
 * Per-assessment proctoring configuration.
 *
 * Stored as JSONB in `assessments.proctoring_config`. An empty object falls back
 * to "balanced" defaults so old assessments keep working unchanged.
 */

export type ProctoringEventKey =
  // Tab & window
  | "tab_switch"
  | "window_blur"
  | "fullscreen_exit"
  // Input
  | "copy"
  | "paste"
  | "paste_large"
  | "typing_burst"
  // Devtools / print
  | "devtools_attempt"
  | "print_blocked"
  // Camera / face
  | "webcam_lost"
  | "no_face"
  | "multi_face"
  // Display
  | "second_monitor"
  | "screenshare_lost"
  // Device
  | "device_change"
  // Side eye (phone)
  | "side_eye_lost";

export interface ProctoringEventRule {
  /** Adds to total integrity penalty (0–100). */
  weight: number;
  /** Counts as a strike toward `max_violations`. */
  strike?: boolean;
  /** Auto-submit the attempt after this many occurrences (overrides max_violations). */
  autosubmit_after?: number;
  /** Seconds threshold (used by no_face / typing_burst). */
  threshold_seconds?: number;
}

export interface ProctoringConfig {
  strictness: "lenient" | "balanced" | "strict";
  /** Cap of strike-count before auto-submit. */
  max_violations: number;
  /** Hard requirements at lockdown time. */
  require_screen_share: boolean;
  require_side_eye: boolean;
  require_face_detection: boolean;
  /** Allow paste/copy inside form inputs so candidates can edit their own answers. */
  allow_clipboard_in_inputs: boolean;
  /** AI snapshot review cadence in seconds (0 = disabled). */
  ai_review_interval_s: number;
  /** Continuously record webcam + screen + side-cam to evidence storage for full session replay. */
  record_full_session: boolean;
  events: Partial<Record<ProctoringEventKey, ProctoringEventRule>>;
}

const PRESETS: Record<ProctoringConfig["strictness"], ProctoringConfig> = {
  lenient: {
    strictness: "lenient",
    max_violations: 6,
    require_screen_share: false,
    require_side_eye: false,
    require_face_detection: false,
    allow_clipboard_in_inputs: true,
    ai_review_interval_s: 0,
    record_full_session: true,
    events: {
      tab_switch: { weight: 3, strike: true },
      window_blur: { weight: 2 },
      fullscreen_exit: { weight: 5, strike: true },
      copy: { weight: 1 },
      paste: { weight: 2 },
      paste_large: { weight: 4 },
      devtools_attempt: { weight: 8, strike: true },
      print_blocked: { weight: 4 },
      webcam_lost: { weight: 6, strike: true },
    },
  },
  balanced: {
    strictness: "balanced",
    max_violations: 3,
    require_screen_share: false,
    require_side_eye: false,
    require_face_detection: true,
    allow_clipboard_in_inputs: true,
    ai_review_interval_s: 60,
    record_full_session: true,
    events: {
      tab_switch: { weight: 5, strike: true },
      window_blur: { weight: 3 },
      fullscreen_exit: { weight: 8, strike: true },
      copy: { weight: 2 },
      paste: { weight: 4 },
      paste_large: { weight: 6, strike: true },
      typing_burst: { weight: 3, threshold_seconds: 10 },
      devtools_attempt: { weight: 10, strike: true },
      print_blocked: { weight: 5 },
      webcam_lost: { weight: 10, strike: true },
      no_face: { weight: 4, threshold_seconds: 10 },
      multi_face: { weight: 8, strike: true },
      second_monitor: { weight: 6, strike: true },
      device_change: { weight: 999, autosubmit_after: 1 },
    },
  },
  strict: {
    strictness: "strict",
    max_violations: 2,
    require_screen_share: true,
    require_side_eye: true,
    require_face_detection: true,
    allow_clipboard_in_inputs: false,
    ai_review_interval_s: 30,
    record_full_session: true,
    events: {
      tab_switch: { weight: 10, strike: true, autosubmit_after: 1 },
      window_blur: { weight: 5, strike: true },
      fullscreen_exit: { weight: 15, strike: true, autosubmit_after: 1 },
      copy: { weight: 4, strike: true },
      paste: { weight: 6, strike: true },
      paste_large: { weight: 10, strike: true, autosubmit_after: 1 },
      typing_burst: { weight: 6, strike: true, threshold_seconds: 8 },
      devtools_attempt: { weight: 999, autosubmit_after: 1 },
      print_blocked: { weight: 8, strike: true },
      webcam_lost: { weight: 20, strike: true, autosubmit_after: 1 },
      no_face: { weight: 6, strike: true, threshold_seconds: 8 },
      multi_face: { weight: 999, autosubmit_after: 1 },
      second_monitor: { weight: 999, autosubmit_after: 1 },
      screenshare_lost: { weight: 15, strike: true, autosubmit_after: 1 },
      device_change: { weight: 999, autosubmit_after: 1 },
      side_eye_lost: { weight: 8, strike: true, threshold_seconds: 15 },
    },
  },
};

export function getPreset(strictness: ProctoringConfig["strictness"]): ProctoringConfig {
  // deep clone so callers can mutate safely
  return JSON.parse(JSON.stringify(PRESETS[strictness]));
}

/** Normalise whatever is stored in DB into a complete config object. */
export function resolveProctoringConfig(
  raw: unknown,
  fallbackEnabled = true
): ProctoringConfig {
  const base = getPreset("balanced");
  if (!fallbackEnabled) {
    // Proctoring disabled entirely → return an empty rule set.
    return {
      ...base,
      strictness: "lenient",
      max_violations: 999,
      require_screen_share: false,
      require_side_eye: false,
      require_face_detection: false,
      ai_review_interval_s: 0,
      record_full_session: false,
      events: {},
    };
  }
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<ProctoringConfig>;
  const strictness = r.strictness ?? base.strictness;
  const preset = getPreset(strictness);
  return {
    strictness,
    max_violations: r.max_violations ?? preset.max_violations,
    require_screen_share: r.require_screen_share ?? preset.require_screen_share,
    require_side_eye: r.require_side_eye ?? preset.require_side_eye,
    require_face_detection: r.require_face_detection ?? preset.require_face_detection,
    allow_clipboard_in_inputs:
      r.allow_clipboard_in_inputs ?? preset.allow_clipboard_in_inputs,
    ai_review_interval_s: r.ai_review_interval_s ?? preset.ai_review_interval_s,
    record_full_session: r.record_full_session ?? preset.record_full_session,
    events: { ...preset.events, ...(r.events ?? {}) },
  };
}

export function describeRulesForCandidate(cfg: ProctoringConfig): string[] {
  const lines: string[] = [
    "Stay in fullscreen for the entire attempt.",
    "Do not switch tabs, windows, or apps.",
  ];
  if (!cfg.allow_clipboard_in_inputs) {
    lines.push("Copy, paste and right-click are blocked everywhere.");
  } else {
    lines.push("Copy/paste is blocked outside answer fields.");
  }
  lines.push("Printing, view-source and developer tools are blocked.");
  if (cfg.require_face_detection) {
    lines.push("Your face must remain visible on the webcam at all times.");
  } else {
    lines.push("Your webcam will be sampled periodically for review.");
  }
  if (cfg.require_screen_share) {
    lines.push("You must share your entire screen during the attempt.");
  }
  if (cfg.require_side_eye) {
    lines.push("You must pair a secondary phone camera (Third Eye) before starting.");
  }
  lines.push(
    `${cfg.max_violations} violation${cfg.max_violations === 1 ? "" : "s"} will auto-submit your attempt.`
  );
  return lines;
}
