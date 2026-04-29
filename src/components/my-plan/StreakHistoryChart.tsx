import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, CheckCircle2, XCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanTask } from "@/hooks/useStudyPlan";

interface Props {
  tasks: PlanTask[];
}

type Range = 14 | 30 | 60;

const isoDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};

interface DayCell {
  iso: string;
  label: string;
  done: number;
  skipped: number;
  pending: number;
  active: boolean;
}

export const StreakHistoryChart = ({ tasks }: Props) => {
  const [range, setRange] = useState<Range>(30);

  const days = useMemo<DayCell[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result: DayCell[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = isoDay(d);
      const dayTasks = tasks.filter((t) => t.day_date === iso);
      const done = dayTasks.filter((t) => t.status === "done").length;
      const skipped = dayTasks.filter((t) => t.status === "skipped").length;
      const pending = dayTasks.filter((t) => t.status === "pending").length;
      result.push({
        iso,
        label: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
        done,
        skipped,
        pending,
        active: done > 0,
      });
    }
    return result;
  }, [tasks, range]);

  const { current, longest } = useMemo(() => {
    let cur = 0;
    // current streak counts back from latest active day
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].active) cur += 1;
      else break;
    }
    let longestRun = 0;
    let run = 0;
    for (const d of days) {
      if (d.active) {
        run += 1;
        if (run > longestRun) longestRun = run;
      } else {
        run = 0;
      }
    }
    return { current: cur, longest: longestRun };
  }, [days]);

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Streak history</h2>
        </div>
        <div className="flex gap-1 rounded-md border border-border p-0.5">
          {([14, 30, 60] as Range[]).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? "default" : "ghost"}
              className="h-7 px-2 text-xs"
              onClick={() => setRange(r)}
            >
              {r}d
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground">Current streak</div>
          <div className="text-xl font-bold">{current} day{current === 1 ? "" : "s"}</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground">Longest in period</div>
          <div className="text-xl font-bold">{longest} day{longest === 1 ? "" : "s"}</div>
        </div>
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${Math.min(range, 30)}, minmax(0, 1fr))` }}
      >
        {days.map((d) => {
          const status =
            d.done > 0 ? "done" : d.skipped > 0 ? "skipped" : d.pending > 0 ? "pending" : "empty";
          return (
            <div
              key={d.iso}
              title={`${d.label}: ${d.done} done · ${d.skipped} skipped · ${d.pending} pending`}
              className={cn(
                "aspect-square rounded-sm border flex items-center justify-center text-[10px]",
                status === "done" && "bg-primary/80 border-primary text-primary-foreground",
                status === "skipped" && "bg-destructive/15 border-destructive/40 text-destructive",
                status === "pending" && "bg-amber-500/10 border-amber-500/30 text-amber-600",
                status === "empty" && "bg-muted/30 border-border text-muted-foreground"
              )}
              aria-label={`${d.label}, ${status}`}
            >
              {d.done > 0 ? d.done : d.skipped > 0 ? "·" : ""}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" /> Done</span>
        <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" /> Skipped</span>
        <span className="flex items-center gap-1"><Circle className="h-3 w-3 text-amber-500" /> Pending</span>
      </div>
    </Card>
  );
};
