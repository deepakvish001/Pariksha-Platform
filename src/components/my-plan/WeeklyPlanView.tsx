import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanTask } from "@/hooks/useStudyPlan";

interface Props {
  tasks: PlanTask[];
  onToggle: (taskId: string, status: PlanTask["status"]) => void;
}

const difficultyClass = (d: string) =>
  d === "easy" ? "bg-green-500/15 text-green-500"
  : d === "hard" ? "bg-red-500/15 text-red-500"
  : "bg-amber-500/15 text-amber-500";

const dayLabel = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

export const WeeklyPlanView = ({ tasks, onToggle }: Props) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);

  const grouped = useMemo(() => {
    const map = new Map<string, PlanTask[]>();
    for (const t of tasks) {
      if (t.day_date < todayIso) continue;
      if (!map.has(t.day_date)) map.set(t.day_date, []);
      map.get(t.day_date)!.push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [tasks, todayIso]);

  const [openDays, setOpenDays] = useState<Set<string>>(new Set([todayIso]));

  if (grouped.length === 0) return null;

  const toggleDay = (d: string) =>
    setOpenDays((cur) => {
      const next = new Set(cur);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-3">Upcoming days</h2>
      <div className="space-y-2">
        {grouped.map(([day, dayTasks]) => {
          const open = openDays.has(day);
          const total = dayTasks.reduce((s, t) => s + t.est_minutes, 0);
          const done = dayTasks.filter((t) => t.status === "done").length;
          const isToday = day === todayIso;
          return (
            <Collapsible key={day} open={open} onOpenChange={() => toggleDay(day)}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
                    <span className="font-medium text-sm">
                      {isToday ? "Today" : dayLabel(day)}
                    </span>
                    {isToday && <Badge variant="default" className="text-xs h-5">Today</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {done}/{dayTasks.length} · {total} min
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 pr-2 py-1 space-y-1">
                {dayTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 py-1">
                    <Checkbox
                      checked={t.status === "done"}
                      onCheckedChange={(c) => onToggle(t.id, c ? "done" : "pending")}
                    />
                    <span className={cn("text-sm flex-1", t.status === "done" && "line-through opacity-60")}>
                      {t.title}
                    </span>
                    <Badge variant="outline" className={cn("text-xs", difficultyClass(t.difficulty))}>
                      {t.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{t.est_minutes}m</span>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </Card>
  );
};
