import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Maximize2, Send, ShieldCheck, Wand2 } from "lucide-react";

interface Props {
  title: string;
  answered: number;
  total: number;
  remainingMs: number;
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
  total,
  remainingMs,
  proctoring,
  isPreview,
  submitting,
  onSubmit,
  onFullscreen,
  onPrefillKey,
}: Props) {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const urgent = remainingMs > 0 && remainingMs < 60_000;
  const warning = !urgent && remainingMs > 0 && remainingMs < 5 * 60_000;

  const timerTone = urgent
    ? "bg-destructive/15 text-destructive border-destructive/40 animate-pulse"
    : warning
    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40"
    : "bg-[hsl(var(--muted))] text-foreground border-transparent";

  return (
    <header className="sticky top-0 z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--card))]/80">
      <div className="px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-primary/60 grid place-items-center text-primary-foreground text-xs font-bold shadow-sm">
            P
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate leading-tight">{title}</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {answered} / {total} answered
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {proctoring && (
            <div className="hidden md:flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Proctored
            </div>
          )}
          {proctoring && (
            <Button size="sm" variant="outline" onClick={onFullscreen} title="Enter fullscreen" className="h-8 w-8 p-0">
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
          <div
            className={`hidden xs:flex items-center gap-1.5 px-3 h-8 rounded-md border text-sm font-mono tabular-nums ${timerTone}`}
          >
            <Clock className="h-4 w-4" />
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
          {isPreview && (
            <Button size="sm" variant="outline" onClick={onPrefillKey} title="Prefill correct answers" className="h-8">
              <Wand2 className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Prefill key</span>
            </Button>
          )}
          <Button size="sm" onClick={onSubmit} disabled={submitting} className="h-8">
            <Send className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Submit</span>
          </Button>
        </div>
      </div>
      <Progress
        value={total > 0 ? (answered / total) * 100 : 0}
        className="h-[3px] rounded-none bg-[hsl(var(--muted))]"
      />
    </header>
  );
}
