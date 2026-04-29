import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanTask } from "@/hooks/useStudyPlan";

interface Props {
  tasks: PlanTask[];
  onToggle: (taskId: string, status: PlanTask["status"]) => void;
}

const difficultyClass = (d: string) =>
  d === "easy" ? "bg-green-500/15 text-green-500 border-green-500/30"
  : d === "hard" ? "bg-red-500/15 text-red-500 border-red-500/30"
  : "bg-amber-500/15 text-amber-500 border-amber-500/30";

const todayKey = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t.toISOString().slice(0, 10);
};

export const TodayTasksList = ({ tasks, onToggle }: Props) => {
  const today = todayKey();
  const todays = useMemo(() => tasks.filter((t) => t.day_date === today), [tasks, today]);
  const totalMinutes = todays.reduce((sum, t) => sum + t.est_minutes, 0);
  const doneMinutes = todays.filter((t) => t.status === "done").reduce((s, t) => s + t.est_minutes, 0);

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

      <div className="space-y-2">
        {todays.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border border-border p-3 transition-colors",
              t.status === "done" && "opacity-60 bg-muted/30"
            )}
          >
            <Checkbox
              checked={t.status === "done"}
              onCheckedChange={(c) => onToggle(t.id, c ? "done" : "pending")}
              className="mt-1"
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
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {t.est_minutes} min
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
