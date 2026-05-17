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
  if (!a) return false;
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
  return false;
}
