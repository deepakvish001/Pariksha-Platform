import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, CircleDashed, Flag, Loader2, Send, WifiOff } from "lucide-react";

interface Props {
  index: number;
  total: number;
  isFlagged: boolean;
  saving: boolean;
  lastSavedAt: number | null;
  online: boolean;
  pendingCount: number;
  onPrev: () => void;
  onNext: () => void;
  onToggleFlag: () => void;
  onFlagAndNext: () => void;
  onReviewSubmit: () => void;
}

function relativeLabel(ts: number, now: number): string {
  const secs = Math.max(0, Math.round((now - ts) / 1000));
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

export function PlayerBottomBar({
  index,
  total,
  isFlagged,
  saving,
  lastSavedAt,
  online,
  pendingCount,
  onPrev,
  onNext,
  onToggleFlag,
  onFlagAndNext,
  onReviewSubmit,
}: Props) {
  const isLast = index >= total - 1;

  // Tick every 10s so "Saved Xs ago" stays fresh without re-rendering everything.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(id);
  }, []);

  const savingLabel = saving
    ? "Saving…"
    : !online
    ? pendingCount > 0
      ? `Offline · ${pendingCount} queued`
      : "Offline · safe"
    : lastSavedAt
    ? `Saved ${relativeLabel(lastSavedAt, now)}`
    : "Autosave on";

  const SavingIcon = saving
    ? Loader2
    : !online
    ? WifiOff
    : lastSavedAt
    ? Check
    : CircleDashed;

  return (
    <footer className="sticky bottom-0 z-30 border-t border-border bg-card/85 backdrop-blur supports-[backdrop-filter]:bg-card/65">
      <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={index === 0}
          onClick={onPrev}
          className="h-9 px-3"
          aria-label="Previous question"
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
            aria-pressed={isFlagged}
            aria-label={isFlagged ? "Flagged" : "Flag"}
          >
            <Flag className={cn("h-3.5 w-3.5 sm:mr-1.5", isFlagged && "fill-current")} />
            <span className="hidden sm:inline">{isFlagged ? "Flagged" : "Flag"}</span>
          </Button>

          {!isLast && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFlagAndNext}
              className="hidden md:inline-flex h-9 px-3 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
              title="Mark for review and go to next"
            >
              <Flag className="h-3.5 w-3.5 mr-1.5" />
              Review & next
            </Button>
          )}

          <div
            className={cn(
              "hidden md:flex items-center gap-1.5 text-[11px] tabular-nums",
              !online ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"
            )}
            aria-live="polite"
          >
            <SavingIcon
              className={cn(
                "h-3 w-3",
                saving && "animate-spin text-primary",
                !saving && online && lastSavedAt && "text-emerald-500"
              )}
            />
            <span>{savingLabel}</span>
          </div>
        </div>

        {isLast ? (
          <Button
            size="sm"
            onClick={onReviewSubmit}
            className="h-9 px-3 font-semibold"
          >
            <Send className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Review & submit</span>
          </Button>
        ) : (
          <Button size="sm" onClick={onNext} className="h-9 px-3" aria-label="Next question">
            <span className="hidden sm:inline">Q{index + 2}</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
        )}
      </div>
    </footer>
  );
}
