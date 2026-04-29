import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, SkipForward, ArrowRight, Loader2 } from "lucide-react";
import type { PlanTask, PlanTaskStatus } from "@/hooks/useStudyPlan";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: PlanTask[];
  onUpdate: (taskId: string, status: PlanTaskStatus) => Promise<void> | void;
  onCarryOver: (taskId: string) => Promise<void> | void;
}

const todayIso = () => {
  const t = new Date(); t.setHours(0,0,0,0); return t.toISOString().slice(0,10);
};

const tomorrowIso = () => {
  const t = new Date(); t.setHours(0,0,0,0); t.setDate(t.getDate()+1);
  return t.toISOString().slice(0,10);
};

export const DailyCheckInDialog = ({ open, onOpenChange, tasks, onUpdate, onCarryOver }: Props) => {
  const today = todayIso();
  const tomorrow = tomorrowIso();
  const unfinished = useMemo(
    () => tasks.filter(
      (t) => t.day_date === today && (t.status === "pending" || t.status === "in_progress" || t.status === "partial")
    ),
    [tasks, today]
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  if (unfinished.length === 0) return null;

  const handle = async (taskId: string, action: "done" | "skipped" | "carry") => {
    setBusyId(taskId);
    try {
      if (action === "carry") await onCarryOver(taskId);
      else await onUpdate(taskId, action);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Daily check-in</DialogTitle>
          <DialogDescription>
            How did today go? Mark each task or roll it into tomorrow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {unfinished.map((t) => (
            <div key={t.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium flex-1 min-w-0 truncate">{t.title}</span>
                <Badge variant="outline" className="text-xs">{t.difficulty}</Badge>
                <span className="text-xs text-muted-foreground">{t.est_minutes}m</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <Button
                  size="sm" variant="outline" disabled={busyId === t.id}
                  onClick={() => handle(t.id, "done")}
                  className="text-green-600 dark:text-green-400 border-green-500/30 hover:bg-green-500/10"
                >
                  {busyId === t.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                  Done
                </Button>
                <Button
                  size="sm" variant="outline" disabled={busyId === t.id}
                  onClick={() => handle(t.id, "skipped")}
                >
                  <SkipForward className="h-3 w-3 mr-1" /> Skip
                </Button>
                <Button
                  size="sm" variant="outline" disabled={busyId === t.id}
                  onClick={() => handle(t.id, "carry")}
                >
                  <ArrowRight className="h-3 w-3 mr-1" /> Carry to {new Date(tomorrow).toLocaleDateString(undefined, { weekday: "short" })}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
