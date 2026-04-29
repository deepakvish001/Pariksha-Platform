import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Flame, BarChart3 } from "lucide-react";
import type { PlanTask } from "@/hooks/useStudyPlan";

interface Props {
  tasks: PlanTask[];
}

type Range = 7 | 30 | 90;

const DIFF_VALUE: Record<string, number> = { easy: 1, medium: 2, hard: 3 };

const isoDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};

export const ProgressAnalytics = ({ tasks }: Props) => {
  const [range, setRange] = useState<Range>(30);

  const data = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: { day: string; label: string; planned: number; done: number; rate: number; avgDiff: number; streak: number }[] = [];
    let runningStreak = 0;

    // Build day buckets oldest -> today
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = isoDay(d);
      const dayTasks = tasks.filter((t) => t.day_date === iso);
      const doneTasks = dayTasks.filter((t) => t.status === "done");
      const planned = dayTasks.length;
      const done = doneTasks.length;
      const rate = planned > 0 ? Math.round((done / planned) * 100) : 0;
      const avgDiff =
        doneTasks.length > 0
          ? doneTasks.reduce((s, t) => s + (DIFF_VALUE[t.difficulty] ?? 2), 0) / doneTasks.length
          : 0;
      // Streak: days where user completed at least 1 task
      if (done > 0) runningStreak += 1;
      else runningStreak = 0;
      days.push({
        day: iso,
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        planned,
        done,
        rate,
        avgDiff: Number(avgDiff.toFixed(2)),
        streak: runningStreak,
      });
    }
    return days;
  }, [tasks, range]);

  const totals = useMemo(() => {
    const planned = data.reduce((s, d) => s + d.planned, 0);
    const done = data.reduce((s, d) => s + d.done, 0);
    const completion = planned > 0 ? Math.round((done / planned) * 100) : 0;
    const currentStreak = data[data.length - 1]?.streak ?? 0;
    const trend = data.filter((d) => d.avgDiff > 0);
    const first = trend[0]?.avgDiff ?? 0;
    const last = trend[trend.length - 1]?.avgDiff ?? 0;
    const diffDelta = last - first;
    return { completion, currentStreak, diffDelta };
  }, [data]);

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Progress analytics</h2>
        </div>
        <div className="flex gap-1 rounded-md border border-border p-0.5">
          {([7, 30, 90] as Range[]).map((r) => (
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

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />Completion</div>
          <div className="text-xl font-bold">{totals.completion}%</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="h-3 w-3" />Streak</div>
          <div className="text-xl font-bold">{totals.currentStreak}d</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground">Difficulty trend</div>
          <div className="text-xl font-bold">
            {totals.diffDelta > 0 ? "+" : ""}{totals.diffDelta.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Completion rate */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Completion rate</p>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" fill="url(#rateFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Streak */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Streak (days)</p>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="streak" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Difficulty trend */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Avg difficulty completed (1=easy · 3=hard)</p>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 3]} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Line type="monotone" dataKey="avgDiff" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};
