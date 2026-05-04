import { describe, it, expect, vi, beforeEach } from "vitest";

const insertMock = vi.fn(() => ({ then: (cb: () => void) => cb() }));
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...(args as [])) },
}));

import { logContestLockEvent } from "./contestTelemetry";

describe("logContestLockEvent", () => {
  beforeEach(() => {
    insertMock.mockClear();
    fromMock.mockClear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("always emits a console.warn with the event kind", () => {
    logContestLockEvent({ kind: "blocked_tab_activation", target: "notes" });
    expect(console.warn).toHaveBeenCalledWith(
      "[contest-lock]",
      "blocked_tab_activation",
      expect.objectContaining({ target: "notes" }),
    );
  });

  it("does NOT insert into the audit table when contestId is missing", () => {
    logContestLockEvent({ kind: "blocked_tab_activation", target: "notes" });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("inserts into contest_lock_events when contestId is provided", () => {
    logContestLockEvent({
      contestId: "c-1",
      problemSlug: "two-sum",
      kind: "blocked_drag_reorder",
      target: "tabs",
      details: { reason: "locked_tab" },
    });
    expect(fromMock).toHaveBeenCalledWith("contest_lock_events");
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contest_id: "c-1",
        problem_slug: "two-sum",
        event_kind: "blocked_drag_reorder",
        target: "tabs",
      }),
    );
  });
});
