import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pause, Play, Square, Timer, Coffee } from "lucide-react";
import { useFocusSession } from "@/hooks/useFocusSession";
import { cn } from "@/lib/utils";
import type { PlanTask, PlanTaskStatus } from "@/hooks/useStudyPlan";
import { toast } from "@/hooks/use-toast";

interface Props {
  tasks: PlanTask[];
  onTaskCompleted: (taskId: string, status: PlanTaskStatus) => Promise<void> | void;
  onActualMinutes?: (taskId: string, minutes: number) => Promise<void> | void;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export const FocusTimerCard = ({ tasks, onTaskCompleted, onActualMinutes }: Props) => {
  const { state, start, pause, resume, stop } = useFocusSession();
  const todayIso = useMemo(() => {
    const t = new Date(); t.setHours(0,0,0,0); return t.toISOString().slice(0,10);
  }, []);
  const today = useMemo(
    () => tasks.filter((t) => t.day_date === todayIso && t.status !== "done" && t.status !== "skipped"),
    [tasks, todayIso]
  );
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (today.length > 0 && !selectedId && !state.taskId) {
      setSelectedId(today[0].id);
    }
  }, [today, selectedId, state.taskId]);

  const selected = today.find((t) => t.id === selectedId) ?? today[0];

  const handleStart = async () => {
    if (!selected) return;
    await start(selected.id, selected.title);
  };

  const handleStop = async () => {
    const result = await stop(async (taskId) => {
      // Auto-mark done after at least one full work cycle
      await onTaskCompleted(taskId, "done");
    });
    if (result) {
      if (onActualMinutes && result.taskId) {
        await onActualMinutes(result.taskId, result.actual_minutes);
      }
      toast({
        title: "Focus session saved",
        description: `${result.actual_minutes} min · ${result.cycles} cycle${result.cycles === 1 ? "" : "s"}`,
      });
    }
  };

  const phaseLabel = state.phase === "work" ? "Focus" : "Break";
  const PhaseIcon = state.phase === "work" ? Timer : Coffee;
  const totalSeconds = state.phase === "work" ? 25 * 60 : 5 * 60;
  const progress = ((totalSeconds - state.remaining) / totalSeconds) * 100;

  if (today.length === 0 && !state.taskId) return null;

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          <h2 className="text-base sm:text-lg font-semibold">Focus session</h2>
        </div>
        {state.active === false && state.taskId === null && (
          <span className="text-xs text-muted-foreground">25 min work · 5 min break</span>
        )}
      </div>

      {state.taskId === null ? (
        <div className="space-y-3">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger><SelectValue placeholder="Pick a task" /></SelectTrigger>
            <SelectContent>
              {today.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title} · {t.est_minutes}m
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleStart} disabled={!selected} className="w-full">
            <Play className="h-3.5 w-3.5 mr-1.5" /> Start focus
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <PhaseIcon className="h-3 w-3" /> {phaseLabel}
            </p>
            <p className="font-medium truncate">{state.taskTitle}</p>
          </div>

          <div className="text-center">
            <p className={cn(
              "text-5xl sm:text-6xl font-mono font-bold tabular-nums",
              state.phase === "break" && "text-muted-foreground"
            )}>
              {fmt(state.remaining)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Cycle {state.cyclesCompleted + (state.phase === "work" ? 1 : 0)} · {state.cyclesCompleted} completed
            </p>
          </div>

          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                state.phase === "work" ? "bg-primary" : "bg-amber-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex gap-2">
            {state.active ? (
              <Button variant="outline" onClick={pause} className="flex-1">
                <Pause className="h-3.5 w-3.5 mr-1.5" /> Pause
              </Button>
            ) : (
              <Button onClick={resume} className="flex-1">
                <Play className="h-3.5 w-3.5 mr-1.5" /> Resume
              </Button>
            )}
            <Button variant="destructive" onClick={handleStop} className="flex-1">
              <Square className="h-3.5 w-3.5 mr-1.5" /> Stop
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
