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
    // Width guardrails:
    //   - `w-full` + `max-w-[1600px]` caps the container at the same upper bound
    //     on every breakpoint (mobile, tablet, desktop, preview iframe).
    //   - `min-w-0` prevents flex/grid children from forcing the container wider
    //     than the viewport (common cause of horizontal scroll on mobile).
    //   - `overflow-x-clip` is a hard backstop: even if a child overflows
    //     (e.g. wide code editor / SQL result table), the container itself
    //     never widens beyond the cap.
    //   - No responsive `sm:max-w-*` / `md:max-w-*` / `lg:max-w-*` overrides
    //     are allowed here — the cap must stay invariant across breakpoints.
    "flex-1 w-full min-w-0 mx-auto px-3 sm:px-5 py-4 grid gap-4 max-w-[1600px] overflow-x-clip",
    !opts.focusMode && "lg:grid-cols-[240px_1fr]"
  );
}
