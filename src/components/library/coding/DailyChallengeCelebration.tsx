import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Link } from "react-router-dom";
import { CheckCircle2, Flame, Sparkles, Calendar, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CodingProblem } from "@/data/codingProblemsData";

interface Props {
  open: boolean;
  onClose: () => void;
  problem: CodingProblem;
  streak: number;
  weeklyDone: number;
  weeklyTarget: number;
}

const fireConfetti = () => {
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
  const count = 80;
  const origin = { x: 0.5, y: 0.4 };
  // Two bursts for a richer effect
  confetti({
    ...defaults,
    particleCount: count,
    origin,
    colors: ["#fbbf24", "#f97316", "#10b981", "#3b82f6", "#a855f7"],
  });
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 60,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.7 },
    });
    confetti({
      ...defaults,
      particleCount: 60,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.7 },
    });
  }, 200);
};

export const DailyChallengeCelebration = ({
  open,
  onClose,
  problem,
  streak,
  weeklyDone,
  weeklyTarget,
}: Props) => {
  const fired = useRef(false);

  useEffect(() => {
    if (open && !fired.current) {
      fired.current = true;
      // small delay so dialog mounts first
      const t = setTimeout(fireConfetti, 80);
      return () => clearTimeout(t);
    }
    if (!open) fired.current = false;
  }, [open]);

  const weeklyPct = Math.min(100, Math.round((weeklyDone / weeklyTarget) * 100));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-amber-500/10" />
        <DialogHeader className="relative">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl">
            Daily Challenge complete!
          </DialogTitle>
          <DialogDescription className="text-center">
            You crushed{" "}
            <span className="font-semibold text-foreground">{problem.title}</span>{" "}
            today. Keep the streak alive tomorrow.
          </DialogDescription>
        </DialogHeader>

        <div className="relative grid grid-cols-2 gap-3 my-2">
          <div className="rounded-lg border border-border/60 bg-background/50 p-3">
            <div className="flex items-center gap-2 text-amber-500">
              <Flame className="h-4 w-4" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Current streak
              </span>
            </div>
            <div className="mt-1 text-2xl font-bold">{streak}</div>
            <div className="text-[10px] text-muted-foreground">
              day{streak === 1 ? "" : "s"}
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-3">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Weekly goal
              </span>
            </div>
            <div className="mt-1 text-2xl font-bold">
              {weeklyDone}
              <span className="text-base text-muted-foreground">/{weeklyTarget}</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full bg-gradient-to-r from-primary to-amber-500 transition-all",
                )}
                style={{ width: `${weeklyPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{problem.difficulty}</Badge>
          {problem.topics.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="bg-muted/50">
              {t}
            </Badge>
          ))}
        </div>

        <DialogFooter className="relative flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" asChild size="sm">
            <Link to="/library/problems/weekly" onClick={onClose}>
              <Calendar className="mr-1.5 h-4 w-4" />
              View weekly review
            </Link>
          </Button>
          <Button onClick={onClose} size="sm" className="gap-1.5">
            Awesome
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
