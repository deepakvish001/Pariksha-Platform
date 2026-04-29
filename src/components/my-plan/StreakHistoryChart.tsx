import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, CheckCircle2, XCircle, Circle, CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  fullLabel: string;
  done: number;
  skipped: number;
  pending: number;
  active: boolean;
  doneTasks: PlanTask[];
  skippedTasks: PlanTask[];
  pendingTasks: PlanTask[];
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
      const doneTasks = dayTasks.filter((t) => t.status === "done");
      const skippedTasks = dayTasks.filter((t) => t.status === "skipped");
      const pendingTasks = dayTasks.filter((t) => t.status === "pending");
      result.push({
        iso,
        label: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
        fullLabel: d.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        done: doneTasks.length,
        skipped: skippedTasks.length,
        pending: pendingTasks.length,
        active: doneTasks.length > 0,
        doneTasks,
        skippedTasks,
        pendingTasks,
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
          const total = d.done + d.skipped + d.pending;
          return (
            <Popover key={d.iso}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`${d.fullLabel}: ${d.done} done, ${d.skipped} skipped, ${d.pending} pending`}
                  className={cn(
                    "aspect-square rounded-sm border flex items-center justify-center text-[10px] cursor-pointer transition-transform hover:scale-110 hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    status === "done" && "bg-primary/80 border-primary text-primary-foreground",
                    status === "skipped" && "bg-destructive/15 border-destructive/40 text-destructive",
                    status === "pending" && "bg-amber-500/10 border-amber-500/30 text-amber-600",
                    status === "empty" && "bg-muted/30 border-border text-muted-foreground"
                  )}
                >
                  {d.done > 0 ? d.done : d.skipped > 0 ? "·" : ""}
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="center" className="w-72 p-3 text-xs space-y-2">
                <div className="flex items-center gap-2 border-b pb-2">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  <div className="font-semibold text-sm">{d.fullLabel}</div>
                </div>

                {total === 0 ? (
                  <p className="text-muted-foreground italic">No tasks were scheduled for this day.</p>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-primary" /> {d.done}
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-destructive" /> {d.skipped}
                      </span>
                      <span className="flex items-center gap-1">
                        <Circle className="h-3 w-3 text-amber-500" /> {d.pending}
                      </span>
                    </div>

                    {d.doneTasks.length > 0 && (
                      <div className="space-y-1">
                        <div className="font-medium text-[11px] text-primary uppercase tracking-wide">Completed</div>
                        <ul className="space-y-0.5">
                          {d.doneTasks.map((t) => (
                            <li key={t.id} className="flex items-start gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                              <span className="min-w-0">
                                <span className="font-medium">{t.title}</span>
                                <span className="text-muted-foreground"> · {t.topic}</span>
                                {t.score != null && <span className="text-muted-foreground"> · {t.score}%</span>}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {d.skippedTasks.length > 0 && (
                      <div className="space-y-1">
                        <div className="font-medium text-[11px] text-destructive uppercase tracking-wide">Skipped</div>
                        <ul className="space-y-0.5">
                          {d.skippedTasks.map((t) => (
                            <li key={t.id} className="flex items-start gap-1.5">
                              <XCircle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                              <span className="min-w-0">
                                <span className="font-medium">{t.title}</span>
                                <span className="text-muted-foreground"> · {t.topic}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {d.pendingTasks.length > 0 && (
                      <div className="space-y-1">
                        <div className="font-medium text-[11px] text-amber-600 uppercase tracking-wide">Pending</div>
                        <ul className="space-y-0.5">
                          {d.pendingTasks.map((t) => (
                            <li key={t.id} className="flex items-start gap-1.5">
                              <Circle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                              <span className="min-w-0">
                                <span className="font-medium">{t.title}</span>
                                <span className="text-muted-foreground"> · {t.topic}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </PopoverContent>
            </Popover>
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
