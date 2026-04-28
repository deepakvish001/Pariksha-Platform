import { describe, it, expect } from "vitest";
import {
  mergeCompletions,
  type CompletionRecord,
} from "@/lib/dailyChallengeMerge";

const rec = (
  date: string,
  completedAt: string,
  problemSlug = "two-sum",
): CompletionRecord => ({ date, completedAt, problemSlug });

describe("mergeCompletions — two-device daily challenge merge", () => {
  it("dedupes the same date and keeps the EARLIEST completedAt", () => {
    // Device A marked done at 09:00; Device B marked done later at 14:00 same day.
    const deviceA = [rec("2026-04-28", "2026-04-28T09:00:00Z", "two-sum")];
    const deviceB = [rec("2026-04-28", "2026-04-28T14:00:00Z", "two-sum")];
    const merged = mergeCompletions(deviceA, deviceB);
    expect(merged).toHaveLength(1);
    expect(merged[0].completedAt).toBe("2026-04-28T09:00:00Z");
  });

  it("is order-independent (commutative)", () => {
    const a = [rec("2026-04-28", "2026-04-28T09:00:00Z")];
    const b = [rec("2026-04-28", "2026-04-28T14:00:00Z")];
    expect(mergeCompletions(a, b)).toEqual(mergeCompletions(b, a));
  });

  it("never duplicates the same date even with many overlapping sources", () => {
    const date = "2026-04-28";
    const sources = Array.from({ length: 5 }, (_, i) => [
      rec(date, `2026-04-28T1${i}:00:00Z`),
    ]);
    const merged = mergeCompletions(...sources);
    expect(merged).toHaveLength(1);
    expect(merged[0].completedAt).toBe("2026-04-28T10:00:00Z");
  });

  it("preserves all distinct dates and sorts newest-first", () => {
    const merged = mergeCompletions(
      [rec("2026-04-26", "2026-04-26T09:00:00Z")],
      [rec("2026-04-28", "2026-04-28T09:00:00Z")],
      [rec("2026-04-27", "2026-04-27T09:00:00Z")],
    );
    expect(merged.map((r) => r.date)).toEqual([
      "2026-04-28",
      "2026-04-27",
      "2026-04-26",
    ]);
  });

  it("on tied completedAt prefers the record with a real problemSlug", () => {
    const ts = "2026-04-28T09:00:00Z";
    const merged = mergeCompletions(
      [rec("2026-04-28", ts, "")],
      [rec("2026-04-28", ts, "two-sum")],
    );
    expect(merged[0].problemSlug).toBe("two-sum");
  });

  it("ignores malformed records (missing date)", () => {
    const merged = mergeCompletions([
      { date: "", completedAt: "2026-04-28T09:00:00Z", problemSlug: "x" },
      rec("2026-04-28", "2026-04-28T09:00:00Z"),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].date).toBe("2026-04-28");
  });

  it("two-device race: marking done concurrently never inflates streak length", () => {
    // Day 1: Device A marks 04-26
    // Day 2: Device A marks 04-27, Device B (offline) also marks 04-27 later
    // Day 3: Device B marks 04-28 first, A syncs and marks 04-28 later
    const deviceA = [
      rec("2026-04-26", "2026-04-26T09:00:00Z"),
      rec("2026-04-27", "2026-04-27T09:00:00Z"),
      rec("2026-04-28", "2026-04-28T18:00:00Z"),
    ];
    const deviceB = [
      rec("2026-04-27", "2026-04-27T20:00:00Z"),
      rec("2026-04-28", "2026-04-28T07:00:00Z"),
    ];
    const merged = mergeCompletions(deviceA, deviceB);
    expect(merged).toHaveLength(3);
    const byDate = Object.fromEntries(merged.map((r) => [r.date, r.completedAt]));
    expect(byDate["2026-04-26"]).toBe("2026-04-26T09:00:00Z");
    expect(byDate["2026-04-27"]).toBe("2026-04-27T09:00:00Z"); // earliest
    expect(byDate["2026-04-28"]).toBe("2026-04-28T07:00:00Z"); // earliest
  });
});
