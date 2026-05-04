import { supabase } from "@/integrations/supabase/client";

export type ContestLockEventKind =
  | "blocked_tab_activation"
  | "blocked_drag_reorder"
  | "blocked_hook_fetch"
  | "blocked_keyboard_activation";

export type ContestLockTarget =
  | "notes"
  | "my-solution"
  | "solution"
  | "runs"
  | "hints"
  | "tabs";

interface LogParams {
  contestId?: string | null;
  problemSlug?: string | null;
  kind: ContestLockEventKind;
  target?: ContestLockTarget;
  details?: Record<string, unknown>;
}

/**
 * Fire-and-forget audit log for any blocked interaction with locked contest
 * panels (tab activation, drag reorder, hook-level fetch). Always logs to the
 * console for local debugging; persists to `contest_lock_events` when the
 * user is authenticated and a contestId is present so admins/trust scoring
 * can audit attempts.
 */
export const logContestLockEvent = ({
  contestId,
  problemSlug,
  kind,
  target,
  details,
}: LogParams): void => {
  // Always emit to console for visible audit trail in dev / network panel.
  // eslint-disable-next-line no-console
  console.warn("[contest-lock]", kind, {
    contestId,
    problemSlug,
    target,
    details,
  });

  if (!contestId) return;
  // Best-effort insert; RLS ensures only the authed user can write their own
  // row. We don't await — telemetry must never block UI.
  void supabase
    .from("contest_lock_events")
    .insert({
      contest_id: contestId,
      problem_slug: problemSlug ?? null,
      event_kind: kind,
      target: target ?? null,
      details: (details ?? {}) as never,
    })
    .then(() => undefined);
};
