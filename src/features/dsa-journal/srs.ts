/**
 * Lightweight SM-2 inspired scheduler for journal entries.
 * Inputs: current ease & interval, plus the outcome of the latest attempt.
 * Outputs: new ease, new interval in days, and the next review date (YYYY-MM-DD).
 */
export interface SrsState {
  ease_factor: number;
  interval_days: number;
}

export interface SrsOutcome {
  /** True if the student solved it cleanly (1 attempt, no help). */
  solved_clean: boolean;
  /** Optional self-rating 1..5 used to nudge ease up/down. */
  quality?: number;
}

export interface SrsResult extends SrsState {
  next_revision_at: string; // YYYY-MM-DD
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

const fmtDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const scheduleNext = (prev: SrsState, outcome: SrsOutcome): SrsResult => {
  const q = clamp(outcome.quality ?? (outcome.solved_clean ? 5 : 2), 0, 5);
  let ease = prev.ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ease = clamp(ease, 1.3, 2.8);

  let interval: number;
  if (!outcome.solved_clean || q < 3) {
    interval = 1; // reset
  } else if (prev.interval_days <= 1) {
    interval = 3;
  } else if (prev.interval_days <= 3) {
    interval = 7;
  } else {
    interval = Math.round(prev.interval_days * ease);
  }
  interval = clamp(interval, 1, 120);

  const next = new Date();
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + interval);

  return {
    ease_factor: Number(ease.toFixed(2)),
    interval_days: interval,
    next_revision_at: fmtDate(next),
  };
};

export const todayISO = (): string => fmtDate(new Date());
