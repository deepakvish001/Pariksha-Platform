import type { PaperQuestion } from "../hooks/usePaper";

/**
 * Determine whether a candidate's answer record counts as "answered" for the
 * purpose of question palette badges, the bottom-bar counter, and the
 * test-summary screen. Subjective questions are answered if there is text OR
 * at least one uploaded answer-sheet page synced from the phone.
 *
 * Pure function — safe to unit-test in isolation.
 */
export function isAnswered(
  qq: PaperQuestion,
  a: Record<string, unknown> | undefined
): boolean {
  // Locked Premium questions are excluded from the candidate's submission
  // surface — treat them as "answered" so they don't show up as unanswered
  // gaps the user can never fill.
  const meta = qq.meta as { locked?: boolean; tier?: string } | null | undefined;
  if (meta?.locked && meta?.tier === "premium") return true;
  if (!a) return false;
  // Explicitly skipped questions count as answered for palette/summary purposes.
  if ((a as { skipped?: boolean }).skipped === true) return true;
  if (qq.type === "mcq" || qq.type === "true_false")
    return Array.isArray(a.selected) && (a.selected as string[]).length > 0;
  if (qq.type === "subjective") {
    const hasText = typeof a.text === "string" && (a.text as string).trim().length > 0;
    const hasPages = Array.isArray(a.pages) && (a.pages as unknown[]).length > 0;
    return hasText || hasPages;
  }
  if (qq.type === "short_answer")
    return typeof a.text === "string" && (a.text as string).trim().length > 0;
  if (qq.type === "sql")
    return typeof a.query === "string" && (a.query as string).trim().length > 0;
  if (qq.type === "coding")
    return typeof a.code === "string" && (a.code as string).trim().length > 0;
  if (qq.type === "matching") {
    const pairs = (a.pairs as Record<string, string>) ?? {};
    return Object.values(pairs).some((v) => v && v.trim().length > 0);
  }
  if (qq.type === "numerical") {
    const v = a.value;
    return typeof v === "string" ? v.trim().length > 0 : typeof v === "number";
  }
  if (qq.type === "fill_blanks") {
    const blanks = (a.blanks as Record<string, string>) ?? {};
    return Object.values(blanks).some((v) => v && v.trim().length > 0);
  }
  return false;
}
