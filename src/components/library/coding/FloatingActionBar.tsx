import { Button } from "@/components/ui/button";
import { Loader2, Play, RotateCcw, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
  /** Hide on screens larger than this breakpoint — desktop already has a top toolbar. */
  desktopHidden?: boolean;
}

/**
 * Sticky bottom action bar for the coding problem detail page. Provides
 * one-tap access to Run / Submit / Reset, primarily on mobile where the top
 * toolbar can be cramped. On desktop, this stays available as a secondary
 * affordance and respects the user's keyboard shortcuts.
 */
export const FloatingActionBar = ({
  onRun,
  onSubmit,
  onReset,
  isRunning,
  isSubmitting,
  desktopHidden = true,
}: Props) => {
  const busy = isRunning || isSubmitting;
  return (
    <div
      className={cn(
        "fixed bottom-3 left-1/2 -translate-x-1/2 z-30",
        "flex items-center gap-1.5 rounded-full border border-border/70",
        "bg-background/85 backdrop-blur shadow-lg px-1.5 py-1.5",
        desktopHidden && "lg:hidden",
      )}
      role="toolbar"
      aria-label="Coding problem actions"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        disabled={busy}
        className="h-9 gap-1.5 rounded-full px-3"
        aria-label="Reset to starter code"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span className="text-xs">Reset</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onRun}
        disabled={busy}
        className="h-9 gap-1.5 rounded-full px-3"
        aria-label="Run code (Ctrl+Enter)"
      >
        {isRunning ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
        <span className="text-xs">Run</span>
      </Button>
      <Button
        size="sm"
        onClick={onSubmit}
        disabled={busy}
        className="h-9 gap-1.5 rounded-full px-4"
        aria-label="Submit solution (Ctrl+Shift+Enter)"
      >
        {isSubmitting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Send className="h-3.5 w-3.5" />
        )}
        <span className="text-xs font-medium">Submit</span>
      </Button>
    </div>
  );
};
