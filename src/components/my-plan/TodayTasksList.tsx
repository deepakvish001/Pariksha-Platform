import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock, Calendar, Sparkles, ArrowUpRight, ArrowDownRight, Minus, Info,
  ExternalLink, Lock, LockOpen, Play,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { PlanTask, PlanTaskStatus } from "@/hooks/useStudyPlan";
import { getNextRecommendation, type RecommendationMode } from "@/lib/adaptive/rerank";
import { resolveTaskLink, taskLinkLabel } from "@/lib/my-plan/taskLinks";
import { Link } from "react-router-dom";

interface Props {
  tasks: PlanTask[];
  onToggle: (taskId: string, status: PlanTaskStatus) => void;
  onLockToggle?: (taskId: string, locked: boolean) => void;
  onStartTask?: (taskId: string) => void;
  mode?: RecommendationMode;
}

const difficultyClass = (d: string) =>
  d === "easy" ? "bg-green-500/15 text-green-500 border-green-500/30"
  : d === "hard" ? "bg-red-500/15 text-red-500 border-red-500/30"
  : "bg-amber-500/15 text-amber-500 border-amber-500/30";

const statusClass = (s: PlanTaskStatus) =>
  s === "in_progress" ? "border-primary/40 bg-primary/5"
  : s === "partial" ? "border-amber-500/30 bg-amber-500/5"
  : s === "skipped" ? "opacity-50 line-through"
  : "";

const todayKey = () => {
  const t = new Date(); t.setHours(0,0,0,0); return t.toISOString().slice(0,10);
};

export const TodayTasksList = ({
  tasks, onToggle, onLockToggle, onStartTask, mode = "adaptive",
}: Props) => {
  const today = todayKey();
  const todays = useMemo(() => tasks.filter((t) => t.day_date === today), [tasks, today]);
  const totalMinutes = todays.reduce((sum, t) => sum + t.est_minutes, 0);
  const doneMinutes = todays.filter((t) => t.status === "done").reduce((s, t) => s + t.est_minutes, 0);
  const recommendation = useMemo(() => getNextRecommendation(tasks, mode), [tasks, mode]);
  const DeltaIcon = recommendation
    ? (recommendation.difficultyDelta > 0 ? ArrowUpRight : recommendation.difficultyDelta < 0 ? ArrowDownRight : Minus)
    : Minus;

  if (todays.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="font-medium">No tasks scheduled for today</p>
        <p className="text-sm text-muted-foreground">Generate a plan or check upcoming days.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold">Today's tasks</h2>
          <p className="text-sm text-muted-foreground">
            {doneMinutes} / {totalMinutes} minutes done
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" /> {totalMinutes} min planned
        </Badge>
      </div>

      {recommendation && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5 text-xs sm:text-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium flex items-center gap-2 flex-wrap">
              <span>Next up: {recommendation.task.title}</span>
              <span className="text-muted-foreground inline-flex items-center gap-0.5 font-normal">
                <DeltaIcon className="h-3 w-3" />
                {mode === "fixed" ? "fixed difficulty"
                  : recommendation.difficultyDelta > 0 ? "harder"
                  : recommendation.difficultyDelta < 0 ? "easier" : "same level"}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Why this task was recommended"
                    className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-72 text-xs space-y-2">
                  <p className="font-semibold text-sm">Why this pick?</p>
                  <p className="text-muted-foreground">{recommendation.reason}</p>
                  <div className="text-[11px] text-muted-foreground border-t pt-2">
                    Mode: <span className="font-medium capitalize">{mode}</span>
                    {" · "}
                    Difficulty change:{" "}
                    <span className="font-medium">
                      {recommendation.difficultyDelta > 0 ? "+1 step" : recommendation.difficultyDelta < 0 ? "-1 step" : "0"}
                    </span>
                  </div>
                </PopoverContent>
              </Popover>
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">{recommendation.reason}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {todays.map((t) => {
          const link = resolveTaskLink(t);
          const isExternal = link?.startsWith("http");
          return (
            <div
              key={t.id}
              id={`task-${t.id}`}
              tabIndex={0}
              className={cn(
                "flex items-start gap-3 rounded-lg border border-border p-3 transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                t.status === "done" && "opacity-60 bg-muted/30",
                statusClass(t.status)
              )}
            >
              <Checkbox
                checked={t.status === "done"}
                onCheckedChange={(c) => onToggle(t.id, c ? "done" : "pending")}
                className="mt-1"
                aria-label={`Mark "${t.title}" as ${t.status === "done" ? "not done" : "done"}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("font-medium", t.status === "done" && "line-through")}>
                    {t.title}
                  </span>
                  <Badge variant="outline" className={cn("text-xs", difficultyClass(t.difficulty))}>
                    {t.difficulty}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">{t.topic}</Badge>
                  {t.source_type && (
                    <Badge variant="outline" className="text-xs capitalize">{t.source_type}</Badge>
                  )}
                  {t.status === "in_progress" && (
                    <Badge className="text-xs bg-primary/15 text-primary border-primary/30" variant="outline">
                      in progress
                    </Badge>
                  )}
                  {t.status === "partial" && (
                    <Badge className="text-xs bg-amber-500/15 text-amber-500 border-amber-500/30" variant="outline">
                      partial
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {t.est_minutes} min
                    {t.actual_minutes ? ` · ${t.actual_minutes} actual` : ""}
                  </span>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5">
                {link && (
                  isExternal ? (
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" onClick={() => onStartTask?.(t.id)}>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">{taskLinkLabel(t)}</span>
                      </Button>
                    </a>
                  ) : (
                    <Link to={link} target="_blank">
                      <Button size="sm" variant="outline" onClick={() => onStartTask?.(t.id)}>
                        <Play className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">{taskLinkLabel(t)}</span>
                      </Button>
                    </Link>
                  )
                )}
                {onLockToggle && (
                  <Button
                    size="icon" variant="ghost"
                    className="h-7 w-7"
                    aria-label={t.locked ? "Unlock task (allow re-plan to move it)" : "Lock task to this day"}
                    title={t.locked ? "Locked — re-plan won't move this" : "Lock to this day"}
                    onClick={() => onLockToggle(t.id, !t.locked)}
                  >
                    {t.locked
                      ? <Lock className="h-3.5 w-3.5 text-primary" />
                      : <LockOpen className="h-3.5 w-3.5 text-muted-foreground" />}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
