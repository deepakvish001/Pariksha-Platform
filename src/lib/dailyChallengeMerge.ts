/**
 * Pure conflict-safe merge for daily challenge completions.
 *
 * Used by:
 * - useDailyChallenge hook (cloud ↔ local merge after pull)
 * - vitest unit tests for two-device merge invariants
 * - reasoning about idempotency of the audit RPC
 *
 * Invariants:
 *  1. The result is deduped on `date` (one record per local-day).
 *  2. On overlap, the EARLIEST `completedAt` wins (so a later "mark done"
 *     on another device cannot retroactively change the streak day).
 *  3. If two records have the same `completedAt`, the one with a non-empty
 *     `problemSlug` is preferred.
 *  4. Output is sorted newest-date first.
 */
export interface CompletionRecord {
  /** Local-day key, YYYY-MM-DD */
  date: string;
  problemSlug: string;
  /** ISO timestamp */
  completedAt: string;
}

const ts = (v: string): number => {
  const n = Date.parse(v);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
};

/** Returns true if `b` should replace `a` for the same date. */
export const shouldReplace = (
  a: CompletionRecord,
  b: CompletionRecord,
): boolean => {
  const ta = ts(a.completedAt);
  const tb = ts(b.completedAt);
  if (tb < ta) return true;
  if (tb > ta) return false;
  // Tie on timestamp — prefer the one with a real slug.
  return !a.problemSlug && !!b.problemSlug;
};

/**
 * Conflict-safe merge of any number of completion sources (e.g. local + remote).
 * The order of inputs does NOT matter for the result — only the records do.
 */
export const mergeCompletions = (
  ...sources: CompletionRecord[][]
): CompletionRecord[] => {
  const byDate = new Map<string, CompletionRecord>();
  for (const list of sources) {
    for (const rec of list) {
      if (!rec || !rec.date) continue;
      const existing = byDate.get(rec.date);
      if (!existing) {
        byDate.set(rec.date, rec);
      } else if (shouldReplace(existing, rec)) {
        byDate.set(rec.date, rec);
      }
    }
  }
  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
};
