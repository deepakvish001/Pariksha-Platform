import { cn } from "@/lib/utils";
import type { PaperQuestionType } from "../hooks/usePaper";

/**
 * Returns the className string for the Player's <main> container.
 *
 * The container WIDTH must stay invariant across every question type so the
 * layout doesn't jump as the candidate navigates (MCQ → coding → SQL → …).
 * Only the sidebar COLUMN width changes (expanded vs. collapsed palette).
 *
 * Exported so it can be unit-tested as a width-invariant regression guard.
 */
export function getPlayerMainClass(opts: {
  focusMode: boolean;
  /** Collapsed = thin icon strip; expanded = full palette rail. */
  paletteCollapsed?: boolean;
  /** Reserved for future use — kept so callers don't need to special-case. */
  questionType?: PaperQuestionType | null;
}): string {
  const cols = opts.paletteCollapsed
    ? "lg:grid-cols-[56px_1fr]"
    : "lg:grid-cols-[300px_1fr]";
  return cn(
    // Width guardrails — do NOT add responsive max-w overrides here.
    "flex-1 w-full min-w-0 mx-auto px-3 sm:px-5 py-4 grid gap-4 max-w-[1600px] overflow-x-clip",
    !opts.focusMode && cols
  );
}
