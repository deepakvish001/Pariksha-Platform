/**
 * End-to-end test for the cloud pull/push flow in useDailyChallenge,
 * verifying it still works after the syncStatus / syncError / lastSyncedAt
 * fields were removed from the hook's public surface.
 *
 * We mock @/integrations/supabase/client and @/contexts/AuthContext so the
 * hook can be exercised in isolation, then assert:
 *  - Pull merges remote completions into local state.
 *  - Local-only completions are pushed via upsert with ignoreDuplicates.
 *  - The audit RPC is invoked as part of the sync.
 *  - The hook does not expose any of the removed fields.
 *  - markCompleted writes locally and pushes to the cloud.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

/** Minimal waitFor: polls `cb` until it doesn't throw or timeout elapses. */
const waitFor = async (cb: () => void | Promise<void>, timeout = 2000) => {
  const start = Date.now();
  let lastErr: unknown;
  while (Date.now() - start < timeout) {
    try {
      await cb();
      return;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 20));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("waitFor timed out");
};

// ---- Mocks ---------------------------------------------------------------
// vi.mock is hoisted, so the factory must define its own state and expose it
// for tests to inspect.

vi.mock("@/integrations/supabase/client", () => {
  const remoteRows = [
    {
      challenge_date: "2026-04-26",
      problem_slug: "two-sum",
      completed_at: "2026-04-26T08:00:00.000Z",
    },
    {
      challenge_date: "2026-04-27",
      problem_slug: "valid-parens",
      completed_at: "2026-04-27T09:30:00.000Z",
    },
  ];
  const upsertMock = vi.fn().mockResolvedValue({ error: null });
  const rpcMock = vi
    .fn()
    .mockResolvedValue({ data: { duplicates_removed: 0 }, error: null });
  const selectChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: remoteRows, error: null }),
    upsert: upsertMock,
  };
  return {
    supabase: {
      from: vi.fn(() => selectChain),
      rpc: rpcMock,
    },
    __mocks: { upsertMock, rpcMock, selectChain, remoteRows },
  };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-abc-123" } }),
}));

// Imported AFTER mocks so the hook picks up the mocked modules.
import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import * as supabaseClient from "@/integrations/supabase/client";

const { upsertMock, rpcMock, selectChain } = (
  supabaseClient as unknown as {
    __mocks: {
      upsertMock: ReturnType<typeof vi.fn>;
      rpcMock: ReturnType<typeof vi.fn>;
      selectChain: {
        select: ReturnType<typeof vi.fn>;
        eq: ReturnType<typeof vi.fn>;
        gte: ReturnType<typeof vi.fn>;
        order: ReturnType<typeof vi.fn>;
      };
    };
  }
).__mocks;


const STORAGE_KEY = "byteskill:coding:dailyChallenge:v2";

describe("useDailyChallenge — cloud pull/push end-to-end (post sync-field removal)", () => {
  beforeEach(() => {
    localStorage.clear();
    upsertMock.mockClear();
    rpcMock.mockClear();
    selectChain.select.mockClear();
    selectChain.eq.mockClear();
    selectChain.gte.mockClear();
    selectChain.order.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("pulls remote completions, merges them into local state, and audits", async () => {
    // Seed a local-only completion that should be pushed to the cloud.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        completions: [
          {
            date: "2026-04-25",
            problemSlug: "reverse-string",
            completedAt: "2026-04-25T07:15:00.000Z",
          },
        ],
      }),
    );

    const { result } = renderHook(() => useDailyChallenge());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });
    console.log("DEBUG eq:", selectChain.eq.mock.calls.length, "gte:", selectChain.gte.mock.calls.length, "order:", selectChain.order.mock.calls.length);
    console.log("DEBUG state:", JSON.stringify(result.current.recentCompletions));
    console.log("DEBUG after 100ms select:", selectChain.select.mock.calls.length, "rpc:", rpcMock.mock.calls.length, "upsert:", upsertMock.mock.calls.length);

    await waitFor(() => {
      // Remote rows should have merged in alongside the local-only row.
      const dates = result.current.recentCompletions.map((c) => c.date);
      expect(dates).toEqual(
        expect.arrayContaining(["2026-04-25", "2026-04-26", "2026-04-27"]),
      );
    });

    // Pull happened against daily_challenge_completions.
    expect(selectChain.select).toHaveBeenCalled();
    expect(selectChain.eq).toHaveBeenCalledWith("user_id", "user-abc-123");

    // Push of local-only row happened with ignoreDuplicates so a peer device
    // cannot overwrite an earlier cloud completed_at.
    await waitFor(() => expect(upsertMock).toHaveBeenCalled());
    const [rows, opts] = upsertMock.mock.calls[0];
    expect(Array.isArray(rows) ? rows : [rows]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: "user-abc-123",
          challenge_date: "2026-04-25",
          problem_slug: "reverse-string",
        }),
      ]),
    );
    expect(opts).toEqual(
      expect.objectContaining({
        onConflict: "user_id,challenge_date",
        ignoreDuplicates: true,
      }),
    );

    // Self-heal audit is invoked.
    await waitFor(() =>
      expect(rpcMock).toHaveBeenCalledWith("audit_daily_completions"),
    );

    // Public hook surface does NOT expose removed sync fields.
    const surface = result.current as unknown as Record<string, unknown>;
    expect(surface).not.toHaveProperty("syncStatus");
    expect(surface).not.toHaveProperty("syncError");
    expect(surface).not.toHaveProperty("lastSyncedAt");
    // But it still exposes `syncing` (the in-flight flag) per the public API.
    expect(typeof surface.syncing).toBe("boolean");
  });

  it("markCompleted writes locally and pushes to cloud with ignoreDuplicates", async () => {
    const { result } = renderHook(() => useDailyChallenge());

    // Wait for the initial pull to finish so we don't race with it.
    await waitFor(() => expect(rpcMock).toHaveBeenCalled());
    const upsertCallsBefore = upsertMock.mock.calls.length;

    await act(async () => {
      await result.current.markCompleted();
    });

    // The hook recorded today's completion locally.
    expect(result.current.isCompletedToday).toBe(true);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(stored.completions.some((c: { date: string }) => c.date === result.current.dateKey))
      .toBe(true);

    // And pushed it to the cloud with the same conflict-safe upsert options.
    await waitFor(() =>
      expect(upsertMock.mock.calls.length).toBeGreaterThan(upsertCallsBefore),
    );
    const lastCall = upsertMock.mock.calls[upsertMock.mock.calls.length - 1];
    const [row, opts] = lastCall;
    expect(row).toEqual(
      expect.objectContaining({
        user_id: "user-abc-123",
        challenge_date: result.current.dateKey,
      }),
    );
    expect(opts).toEqual(
      expect.objectContaining({
        onConflict: "user_id,challenge_date",
        ignoreDuplicates: true,
      }),
    );
  });
});
