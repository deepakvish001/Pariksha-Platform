import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, Keyboard, Maximize2, Send, ShieldCheck, Wand2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  answered: number;
  flagged: number;
  total: number;
  remainingMs: number;
  deadlineMs: number | null;
  proctoring: boolean;
  isPreview: boolean;
  submitting: boolean;
  onSubmit: () => void;
  onFullscreen: () => void;
  onPrefillKey: () => void;
}

export function PlayerTopBar({
  title,
  answered,
  flagged,
  total,
  remainingMs,
  deadlineMs,
  proctoring,
  isPreview,
  submitting,
  onSubmit,
  onFullscreen,
  onPrefillKey,
}: Props) {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  const urgent = remainingMs > 0 && remainingMs < 60_000;
  const warning = !urgent && remainingMs > 0 && remainingMs < 5 * 60_000;

  const timerTone = urgent
    ? "bg-destructive/10 text-destructive border-destructive/40"
    : warning
    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40"
    : "bg-muted text-foreground border-border";

  const dotTone = urgent
    ? "bg-destructive animate-pulse"
    : warning
    ? "bg-amber-500 animate-pulse"
    : "bg-emerald-500";

  const answeredPct = total > 0 ? (answered / total) * 100 : 0;
  const flaggedPct = total > 0 ? (flagged / total) * 100 : 0;

  const deadlineLabel = deadlineMs
    ? new Date(deadlineMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <TooltipProvider delayDuration={150}>
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
        <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
          {/* Brand + title */}
          <div className="min-w-0 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 grid place-items-center text-white font-black text-sm shadow-md shrink-0">
              B
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground leading-none">
                Assessment{isPreview && " · Preview"}
              </p>
              <h1 className="text-sm font-semibold truncate leading-tight mt-0.5">{title}</h1>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden md:flex items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">{answered}</span>
              <span>/</span>
              <span>{total}</span>
              <span className="text-muted-foreground/70">answered</span>
            </div>

            <div className="hidden md:block h-5 w-px bg-border mx-1" />

            {proctoring && (
              <div className="hidden lg:flex items-center gap-1.5 text-[11px] px-2 h-7 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" /> Proctored
              </div>
            )}
            {proctoring && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={onFullscreen} className="h-8 w-8 p-0">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Enter fullscreen</TooltipContent>
              </Tooltip>
            )}

            {/* Timer */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "hidden xs:flex items-center gap-2 px-3 h-8 rounded-md border text-sm font-mono tabular-nums font-semibold",
                    timerTone
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", dotTone)} />
                  <Clock className="h-3.5 w-3.5 opacity-70" />
                  {hh > 0 && <>{String(hh).padStart(2, "0")}:</>}
                  {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {deadlineMs ? `Ends at ${deadlineLabel}` : "No time limit"}
              </TooltipContent>
            </Tooltip>

            {/* Shortcuts */}
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Keyboard shortcuts">
                  <Keyboard className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 text-xs">
                <p className="font-semibold mb-2">Keyboard shortcuts</p>
                <ul className="space-y-1.5">
                  <ShortcutRow keys={["←", "→"]} label="Prev / Next question" />
                  <ShortcutRow keys={["1", "–", "9"]} label="Pick option (MCQ / T-F)" />
                  <ShortcutRow keys={["F"]} label="Flag for review" />
                  <ShortcutRow keys={["⌘", "↵"]} label="Run code" />
                  <ShortcutRow keys={["⌘", "⇧", "↵"]} label="Submit code" />
                </ul>
              </PopoverContent>
            </Popover>

            {isPreview && (
              <Button size="sm" variant="outline" onClick={onPrefillKey} className="h-8">
                <Wand2 className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Prefill key</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={onSubmit}
              disabled={submitting}
              className="h-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/70 shadow-sm font-semibold"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 sm:mr-1.5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 sm:mr-1.5" />
              )}
              <span className="hidden sm:inline">{submitting ? "Submitting…" : "Submit"}</span>
            </Button>
          </div>
        </div>

        {/* Dual progress (answered + flagged overlay) */}
        <div className="relative h-[3px] bg-muted">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/80 to-primary transition-[width] duration-500 ease-out"
            style={{ width: `${answeredPct}%` }}
          />
          {flagged > 0 && (
            <div
              className="absolute inset-y-0 right-0 bg-amber-500/70"
              style={{ width: `${flaggedPct}%` }}
            />
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono font-medium min-w-[20px] text-center"
          >
            {k}
          </kbd>
        ))}
      </div>
    </li>
  );
}
