import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarClock, Loader2 } from "lucide-react";
import type { PlanTask } from "@/hooks/useStudyPlan";
import { toast } from "@/hooks/use-toast";

interface Props {
  tasks: PlanTask[];
  onCatchUp: () => Promise<number>;
}

const todayIso = () => {
  const t = new Date(); t.setHours(0,0,0,0); return t.toISOString().slice(0,10);
};

export const CatchUpButton = ({ tasks, onCatchUp }: Props) => {
  const [busy, setBusy] = useState(false);
  const today = todayIso();
  const overdue = useMemo(
    () => tasks.filter(
      (t) => t.day_date < today && (t.status === "pending" || t.status === "in_progress")
    ),
    [tasks, today]
  );

  if (overdue.length === 0) return null;

  const handle = async () => {
    setBusy(true);
    try {
      const n = await onCatchUp();
      toast({
        title: "Caught up",
        description: `${n} overdue task${n === 1 ? "" : "s"} rescheduled across the next 14 days.`,
      });
    } catch (e) {
      toast({
        title: "Couldn't catch up", variant: "destructive",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handle} disabled={busy}>
      {busy ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CalendarClock className="h-3.5 w-3.5 mr-1.5" />}
      Catch up ({overdue.length})
    </Button>
  );
};
