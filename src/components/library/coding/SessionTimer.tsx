import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { Timer, Pause, Play, RotateCcw, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "parikshaa:coding-session-time:v1";
const POMODORO_KEY = "parikshaa:coding-pomodoro-on:v1";
const IDLE_MS = 60_000;
const FOCUS_MS = 25 * 60 * 1000;
const BREAK_MS = 5 * 60 * 1000;

const fmt = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const readMap = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
};

const writeElapsed = (slug: string, ms: number) => {
  try {
    const map = readMap();
    if (ms > 0) map[slug] = ms;
    else delete map[slug];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

export interface SessionTimerHandle {
  /** Mark activity (call on every keystroke). Auto-starts and resets idle. */
  poke: () => void;
  /** Get elapsed milliseconds for the current slug. */
  getElapsedMs: () => number;
  /** Reset the timer for the current slug. */
  reset: () => void;
}

interface Props {
  slug: string;
}

export const SessionTimer = forwardRef<SessionTimerHandle, Props>(({ slug }, ref) => {
  const { toast } = useToast();
  const [elapsed, setElapsed] = useState<number>(() => readMap()[slug] ?? 0);
  const [running, setRunning] = useState(false);
  const [pomodoro, setPomodoro] = useState<boolean>(() => {
    try {
      return localStorage.getItem(POMODORO_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [phaseStart, setPhaseStart] = useState<number>(() => Date.now());

  const lastTickRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const slugRef = useRef(slug);

  // Reload elapsed when slug changes.
  useEffect(() => {
    slugRef.current = slug;
    setElapsed(readMap()[slug] ?? 0);
    setRunning(false);
    lastTickRef.current = null;
    setPhase("focus");
    setPhaseStart(Date.now());
  }, [slug]);

  // Tick loop.
  useEffect(() => {
    if (!running) {
      lastTickRef.current = null;
      return;
    }
    const id = window.setInterval(() => {
      const now = Date.now();
      const last = lastTickRef.current ?? now;
      const dt = now - last;
      lastTickRef.current = now;

      // Idle pause.
      if (now - lastActivityRef.current > IDLE_MS) {
        setRunning(false);
        return;
      }

      setElapsed((e) => {
        const next = e + dt;
        writeElapsed(slugRef.current, next);
        return next;
      });

      if (pomodoro) {
        const phaseElapsed = now - phaseStart;
        const target = phase === "focus" ? FOCUS_MS : BREAK_MS;
        if (phaseElapsed >= target) {
          if (phase === "focus") {
            setPhase("break");
            setPhaseStart(now);
            toast({
              title: "Focus block done",
              description: "Take a 5‑minute break.",
            });
          } else {
            setPhase("focus");
            setPhaseStart(now);
            toast({
              title: "Break over",
              description: "Back to focus — 25 minutes.",
            });
          }
        }
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, pomodoro, phase, phaseStart, toast]);

  const poke = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (!running) {
      lastTickRef.current = Date.now();
      setRunning(true);
    }
  }, [running]);

  const reset = useCallback(() => {
    setElapsed(0);
    writeElapsed(slugRef.current, 0);
    setRunning(false);
    setPhase("focus");
    setPhaseStart(Date.now());
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      poke,
      getElapsedMs: () => elapsed,
      reset,
    }),
    [poke, elapsed, reset],
  );

  const togglePomodoro = () => {
    setPomodoro((v) => {
      const next = !v;
      try {
        localStorage.setItem(POMODORO_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (next) {
        setPhase("focus");
        setPhaseStart(Date.now());
      }
      return next;
    });
  };

  const phaseRemaining = pomodoro
    ? Math.max(0, (phase === "focus" ? FOCUS_MS : BREAK_MS) - (Date.now() - phaseStart))
    : 0;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 rounded-md border bg-background/60 px-1.5 py-0.5">
        <Timer
          className={cn(
            "h-3 w-3",
            running ? "text-emerald-500" : "text-muted-foreground",
            pomodoro && phase === "break" && "text-amber-500",
          )}
        />
        <span
          className="text-xs tabular-nums font-medium min-w-[42px]"
          aria-label={`Time on this problem: ${fmt(elapsed)}`}
        >
          {fmt(elapsed)}
        </span>
        {pomodoro && (
          <span
            className={cn(
              "text-[10px] tabular-nums px-1 rounded",
              phase === "focus"
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-amber-500/10 text-amber-500",
            )}
            title={`${phase === "focus" ? "Focus" : "Break"} — ${fmt(phaseRemaining)} left`}
          >
            {phase === "focus" ? "F" : "B"} {fmt(phaseRemaining)}
          </span>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => (running ? setRunning(false) : poke())}
              aria-label={running ? "Pause timer" : "Start timer"}
            >
              {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{running ? "Pause" : "Start"} (auto‑pauses after 60s idle)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-6 w-6", pomodoro && "text-amber-500")}
              onClick={togglePomodoro}
              aria-label="Toggle Pomodoro"
              aria-pressed={pomodoro}
            >
              <Coffee className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Pomodoro {pomodoro ? "on" : "off"} · 25/5</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={reset}
              aria-label="Reset timer"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset timer</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
});

SessionTimer.displayName = "SessionTimer";

/** Helper for a friendly "Solved in Xm Ys" string. */
export const formatSolveTime = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
};
