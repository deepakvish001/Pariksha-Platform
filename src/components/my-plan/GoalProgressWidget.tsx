import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, CheckCircle2, Clock } from "lucide-react";
import type { PlanTask } from "@/hooks/useStudyPlan";

interface Props {
  tasks: PlanTask[];
}

const todayIso = () => {
  const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10);
};

export const GoalProgressWidget = ({ tasks }: Props) => {
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const skipped = tasks.filter((t) => t.status === "skipped").length;
    const today = todayIso();
    const todayTotal = tasks.filter((t) => t.day_date === today).length;
    const todayDone = tasks.filter((t) => t.day_date === today && t.status === "done").length;

    // Streak: count back from today consecutive days with at least one done task.
    const doneByDay = new Set(
      tasks.filter((t) => t.status === "done" && t.completed_at)
        .map((t) => (t.completed_at as string).slice(0, 10))
    );
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0,0,0,0);
    // Allow today to not count yet without breaking the streak
    if (!doneByDay.has(cursor.toISOString().slice(0,10))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (doneByDay.has(cursor.toISOString().slice(0,10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const todayPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;
    const remainingMinutes = tasks
      .filter((t) => t.status !== "done" && t.status !== "skipped")
      .reduce((s, t) => s + t.est_minutes, 0);

    return { total, done, skipped, pct, todayDone, todayTotal, todayPct, streak, remainingMinutes };
  }, [tasks]);

  if (stats.total === 0) return null;

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm sm:text-base">Plan progress</h3>
        </div>
        <div className="flex items-center gap-1 text-xs sm:text-sm">
          <Flame className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-semibold">{stats.streak}</span>
          <span className="text-muted-foreground">day streak</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">Overall completion</span>
          <span className="font-semibold tabular-nums">{stats.done}/{stats.total} ({stats.pct}%)</span>
        </div>
        <Progress value={stats.pct} className="h-2" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">Today</span>
          <span className="font-semibold tabular-nums">{stats.todayDone}/{stats.todayTotal}</span>
        </div>
        <Progress value={stats.todayPct} className="h-2" />
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="rounded-lg border border-border/40 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" /> Done
          </div>
          <p className="text-lg font-bold tabular-nums">{stats.done}</p>
        </div>
        <div className="rounded-lg border border-border/40 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> Remaining
          </div>
          <p className="text-lg font-bold tabular-nums">
            {Math.round(stats.remainingMinutes / 60)}h
          </p>
        </div>
      </div>
    </Card>
  );
};
