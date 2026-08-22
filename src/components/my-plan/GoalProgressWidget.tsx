import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy, Flame, CheckCircle2, Clock, AlertTriangle, History, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanTask } from "@/hooks/useStudyPlan";
import type { PlanActivityEntry } from "@/hooks/usePlanActivityLog";

interface Props {
  tasks: PlanTask[];
  activity?: PlanActivityEntry[];
  onClearActivity?: () => void;
}

interface TopicRow {
  topic: string;
  total: number;
  done: number;
  pct: number;
}

const ALL_TOPICS = "__all__";

const todayIso = () => {
  const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10);
};

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
};

export const GoalProgressWidget = ({ tasks, activity = [], onClearActivity }: Props) => {
  const [topicFilter, setTopicFilter] = useState<string>(ALL_TOPICS);

  // All available topics (for the filter dropdown), independent of filter.
  const allTopics = useMemo(() => {
    const s = new Set<string>();
    for (const t of tasks) {
      if (t.status === "skipped") continue;
      s.add((t.topic || "Other").trim());
    }
    return Array.from(s).sort();
  }, [tasks]);

  // If the previously-selected topic disappears, reset to all.
  if (topicFilter !== ALL_TOPICS && !allTopics.includes(topicFilter)) {
    // Defer to a microtask so we don't update during render.
    queueMicrotask(() => setTopicFilter(ALL_TOPICS));
  }

  const filteredTasks = useMemo(
    () => topicFilter === ALL_TOPICS
      ? tasks
      : tasks.filter((t) => (t.topic || "Other").trim() === topicFilter),
    [tasks, topicFilter]
  );

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter((t) => t.status === "done").length;
    const today = todayIso();
    const todayTotal = filteredTasks.filter((t) => t.day_date === today).length;
    const todayDone = filteredTasks.filter((t) => t.day_date === today && t.status === "done").length;

    // Streak: based on full task list (not filtered), so a topic filter doesn't shrink your streak.
    const doneByDay = new Set(
      tasks.filter((t) => t.status === "done" && t.completed_at)
        .map((t) => (t.completed_at as string).slice(0, 10))
    );
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0,0,0,0);
    if (!doneByDay.has(cursor.toISOString().slice(0,10))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (doneByDay.has(cursor.toISOString().slice(0,10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const todayPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;
    const remainingMinutes = filteredTasks
      .filter((t) => t.status !== "done" && t.status !== "skipped")
      .reduce((s, t) => s + t.est_minutes, 0);

    // Topic breakdown for the filtered set (shows per-topic when "all", or just the one when filtered).
    const topicMap = new Map<string, { total: number; done: number }>();
    for (const t of filteredTasks) {
      if (t.status === "skipped") continue;
      const key = (t.topic || "Other").trim();
      const e = topicMap.get(key) ?? { total: 0, done: 0 };
      e.total += 1;
      if (t.status === "done") e.done += 1;
      topicMap.set(key, e);
    }
    const topicRows: TopicRow[] = Array.from(topicMap.entries())
      .map(([topic, v]) => ({
        topic, total: v.total, done: v.done,
        pct: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const weakAreas = topicRows
      .filter((r) => r.total >= 2 && r.pct < 50)
      .sort((a, b) => a.pct - b.pct || b.total - a.total)
      .slice(0, 3);

    const topTopics = topicRows.slice(0, 6);

    return {
      total, done, pct, todayDone, todayTotal, todayPct,
      streak, remainingMinutes, topTopics, weakAreas,
    };
  }, [filteredTasks, tasks]);

  if (tasks.length === 0) return null;

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

      {allTopics.length > 1 && (
        <div className="flex items-center gap-2">
          <label htmlFor="goal-focus-topic" className="text-xs text-muted-foreground shrink-0">Focus topic</label>
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger id="goal-focus-topic" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TOPICS} className="text-xs">All topics</SelectItem>
              {allTopics.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">
            {topicFilter === ALL_TOPICS ? "Overall completion" : `${topicFilter} completion`}
          </span>
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

      {/* Topic breakdown */}
      {stats.topTopics.length > 0 && (
        <div className="pt-1 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            By topic{topicFilter !== ALL_TOPICS && " (filtered)"}
          </p>
          <ul className="space-y-2">
            {stats.topTopics.map((t) => (
              <li key={t.topic} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate font-medium">{t.topic}</span>
                  <span className="text-muted-foreground tabular-nums shrink-0">
                    {t.done}/{t.total} ({t.pct}%)
                  </span>
                </div>
                <Progress
                  value={t.pct}
                  className={cn(
                    "h-1.5",
                    t.pct < 30 && "[&>div]:bg-red-500/70",
                    t.pct >= 30 && t.pct < 60 && "[&>div]:bg-amber-500/70",
                    t.pct >= 60 && "[&>div]:bg-green-500/70"
                  )}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top areas to improve */}
      {stats.weakAreas.length > 0 && (
        <div className="pt-1 space-y-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Top areas to improve{topicFilter !== ALL_TOPICS && ` in ${topicFilter}`}
          </div>
          <ul className="space-y-1 text-xs">
            {stats.weakAreas.map((w) => (
              <li key={w.topic} className="flex items-baseline justify-between gap-2">
                <span className="truncate font-medium">{w.topic}</span>
                <span className="text-muted-foreground tabular-nums shrink-0">
                  {w.done}/{w.total} done · {w.pct}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Activity log */}
      {activity.length > 0 && (
        <div className="pt-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <History className="h-3.5 w-3.5" /> Recent bulk actions
            </div>
            {onClearActivity && (
              <Button
                variant="ghost" size="sm"
                className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={onClearActivity}
              >
                <X className="h-3 w-3 mr-0.5" /> Clear
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-40">
            <ul className="space-y-1 text-xs pr-2">
              {activity.slice(0, 10).map((e) => (
                <li
                  key={e.id}
                  className="rounded-md border border-border/40 bg-muted/20 px-2 py-1.5 space-y-0.5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium truncate">{e.summary}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {formatRelative(e.at)}
                    </span>
                  </div>
                  {e.detail && (
                    <p className="text-[11px] text-muted-foreground truncate">{e.detail}</p>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </Card>
  );
};
