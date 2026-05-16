import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Flag, Loader2, Send } from "lucide-react";

interface Props {
  index: number;
  total: number;
  isFlagged: boolean;
  saving: boolean;
  lastSavedAt: number | null;
  onPrev: () => void;
  onNext: () => void;
  onToggleFlag: () => void;
  onReviewSubmit: () => void;
}

export function PlayerBottomBar({
  index,
  total,
  isFlagged,
  saving,
  lastSavedAt,
  onPrev,
  onNext,
  onToggleFlag,
  onReviewSubmit,
}: Props) {
  const isLast = index >= total - 1;
  const savedLabel = saving
    ? "Saving…"
    : lastSavedAt
    ? `Saved · ${new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Autosave on";

  return (
    <footer className="sticky bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={index === 0}
          onClick={onPrev}
          className="h-9 px-3"
        >
          <ChevronLeft className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Q{Math.max(1, index)}</span>
        </Button>

        <div className="flex items-center gap-2 sm:gap-3 text-xs min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFlag}
            className={cn(
              "h-9 px-3 transition-colors",
              isFlagged &&
                "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/50 hover:bg-amber-500/20"
            )}
          >
            <Flag className={cn("h-3.5 w-3.5 sm:mr-1.5", isFlagged && "fill-current")} />
            <span className="hidden sm:inline">{isFlagged ? "Flagged" : "Flag"}</span>
          </Button>
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            ) : (
              <Check className="h-3 w-3 text-emerald-500" />
            )}
            <span>{savedLabel}</span>
          </div>
        </div>

        {isLast ? (
          <Button
            size="sm"
            onClick={onReviewSubmit}
            className="h-9 px-3 bg-gradient-to-r from-primary to-primary/80 font-semibold shadow-sm"
          >
            <Send className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Review & submit</span>
          </Button>
        ) : (
          <Button size="sm" onClick={onNext} className="h-9 px-3">
            <span className="hidden sm:inline">Q{index + 2}</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
        )}
      </div>
    </footer>
  );
}
