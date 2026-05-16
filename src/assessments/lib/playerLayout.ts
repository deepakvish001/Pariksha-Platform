import { cn } from "@/lib/utils";
import type { PaperQuestionType } from "../hooks/usePaper";

/**
 * Returns the className string for the Player's <main> container.
 *
 * The container width MUST stay fixed across every question type so the
 * layout doesn't jump as the candidate navigates (MCQ → coding → SQL → …).
 * The only thing that changes is whether the sidebar column is shown
 * (hidden in focus mode).
 *
 * Exported so it can be unit-tested as a width-invariant regression guard.
 */
export function getPlayerMainClass(opts: {
  focusMode: boolean;
  /** Reserved for future use — kept so callers don't need to special-case. */
  questionType?: PaperQuestionType | null;
}): string {
  return cn(
    "flex-1 w-full mx-auto px-3 sm:px-5 py-4 grid gap-4 max-w-[1600px]",
    !opts.focusMode && "lg:grid-cols-[240px_1fr]"
  );
}
