import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Clock, Maximize2, Send, ShieldCheck, Wand2, Loader2,
  Wifi, WifiOff, Info, ZoomIn, ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerSosButton } from "./PlayerSosButton";
import { PlayerSosStatus } from "./PlayerSosStatus";
import { PlayerSosTimeline } from "./PlayerSosTimeline";
import { CameraStatusIndicator } from "./CameraStatusIndicator";

interface Props {
  title: string;
  attemptId?: string | null;
  answered: number;
  flagged: number;
  total: number;
  remainingMs: number;
  deadlineMs: number | null;
  totalDurationMs: number | null;
  proctoring: boolean;
  cameraActive?: boolean;
  isPreview: boolean;
  submitting: boolean;
  online: boolean;
  onSubmit: () => void;
  onFullscreen: () => void;
  onPrefillKey: () => void;
  onShowInstructions?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
}

export function PlayerTopBar({
  title,
  attemptId,
  answered,
  flagged,
  total,
  remainingMs,
  deadlineMs,
  totalDurationMs,
  proctoring,
  cameraActive = false,
  isPreview,
  submitting,
  online,
  onSubmit,
  onFullscreen,
  onPrefillKey,
  onShowInstructions,
  onZoomIn,
  onZoomOut,
  canZoomIn = true,
  canZoomOut = true,
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
    : "bg-muted/60 text-foreground border-border";

  const dotTone = urgent
    ? "bg-destructive animate-pulse"
    : warning
    ? "bg-amber-500"
    : "bg-emerald-500";

  const answeredPct = total > 0 ? (answered / total) * 100 : 0;
  const flaggedPct = total > 0 ? (flagged / total) * 100 : 0;
  const elapsedPct =
    totalDurationMs && totalDurationMs > 0
      ? Math.min(100, Math.max(0, ((totalDurationMs - remainingMs) / totalDurationMs) * 100))
      : 0;

  const deadlineLabel = deadlineMs
    ? new Date(deadlineMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const TimerChip = (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "hidden xs:flex items-center gap-2 px-3 h-8 rounded-md border text-sm font-mono tabular-nums font-semibold",
            timerTone,
            urgent && "animate-[pulse_1.6s_ease-in-out_infinite]"
          )}
          aria-label="Time remaining"
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
  );

  return (
    <TooltipProvider delayDuration={150}>
      <header className="sticky top-0 z-30 border-b border-border bg-card/85 backdrop-blur supports-[backdrop-filter]:bg-card/65">
        <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
          {/* Brand + title */}
          <div className="min-w-0 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-foreground text-background grid place-items-center font-black text-sm shrink-0">
              P
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

            {/* Online indicator */}
            {!online && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-[11px] px-2 h-7 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                    <WifiOff className="h-3.5 w-3.5" /> Offline
                  </div>
                </TooltipTrigger>
                <TooltipContent>Your answers are safe — they will sync when you’re back online.</TooltipContent>
              </Tooltip>
            )}
            {online && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="hidden sm:inline-flex h-7 w-7 items-center justify-center text-emerald-500" aria-label="Online">
                    <Wifi className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Connected</TooltipContent>
              </Tooltip>
            )}

            <div className="hidden md:block h-5 w-px bg-border mx-0.5" />

            {proctoring && (
              <CameraStatusIndicator
                mode="proctoring"
                active={cameraActive}
                className="hidden lg:inline-flex"
              />
            )}
            {proctoring && (
              <CameraStatusIndicator
                mode="proctoring"
                active={cameraActive}
                compact
                className="lg:hidden"
              />
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

            {/* Zoom controls */}
            {onZoomOut && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onZoomOut}
                    disabled={!canZoomOut}
                    className="h-8 w-8 p-0 hidden sm:inline-flex"
                    aria-label="Decrease question text size"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Smaller text</TooltipContent>
              </Tooltip>
            )}
            {onZoomIn && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onZoomIn}
                    disabled={!canZoomIn}
                    className="h-8 w-8 p-0 hidden sm:inline-flex"
                    aria-label="Increase question text size"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Larger text</TooltipContent>
              </Tooltip>
            )}

            {/* General instructions */}
            {onShowInstructions && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onShowInstructions}
                    className="h-8 w-8 p-0"
                    aria-label="Show general instructions"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>General instructions</TooltipContent>
              </Tooltip>
            )}

            {/* SOS */}
            <PlayerSosStatus attemptId={attemptId} />
            <PlayerSosTimeline attemptId={attemptId} />
            <PlayerSosButton attemptId={attemptId} assessmentTitle={title} />

            {/* Timer */}
            {TimerChip}


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
              className="h-8 font-semibold"
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
            className="absolute inset-y-0 left-0 bg-primary/70 transition-[width] duration-500 ease-out"
            style={{ width: `${answeredPct}%` }}
          />
          {flagged > 0 && (
            <div
              className="absolute inset-y-0 right-0 bg-amber-500/60"
              style={{ width: `${flaggedPct}%` }}
            />
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}
