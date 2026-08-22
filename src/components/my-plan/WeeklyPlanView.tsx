import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, GripVertical, Pencil, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { PlanTask, PlanTaskStatus } from "@/hooks/useStudyPlan";
import { BulkDayActions } from "./BulkDayActions";

interface Props {
  tasks: PlanTask[];
  onToggle: (taskId: string, status: PlanTask["status"]) => void;
  onMoveTask: (taskId: string, newDay: string) => Promise<void>;
  onBulkUpdate?: (
    taskIds: string[], status: PlanTaskStatus
  ) => Promise<Array<{ id: string; status: PlanTaskStatus; completed_at: string | null }>>;
  onRestore?: (
    snapshot: Array<{ id: string; status: PlanTaskStatus; completed_at: string | null }>
  ) => Promise<void>;
  onLogActivity?: (entry: {
    kind: "bulk_mark_done" | "bulk_mark_pending" | "bulk_undo_status";
    summary: string; detail?: string; count: number;
  }) => void;
}

const difficultyClass = (d: string) =>
  d === "easy" ? "bg-green-500/15 text-green-500"
  : d === "hard" ? "bg-red-500/15 text-red-500"
  : "bg-amber-500/15 text-amber-500";

const dayLabel = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

const todayIsoFn = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t.toISOString().slice(0, 10);
};

interface DraggableTaskProps {
  task: PlanTask;
  onToggle: Props["onToggle"];
}

const DraggableTask = ({ task, onToggle }: DraggableTaskProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: task.locked,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 py-1.5 px-1 rounded-md group",
        isDragging && "opacity-30"
      )}
    >
      {task.locked ? (
        <Lock className="h-3.5 w-3.5 text-primary" aria-label="Locked to day" />
      ) : (
        <button
          {...listeners}
          {...attributes}
          aria-label={`Drag ${task.title}`}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          type="button"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}
      <Checkbox
        checked={task.status === "done"}
        onCheckedChange={(c) => onToggle(task.id, c ? "done" : "pending")}
        aria-label={`Mark "${task.title}" as ${task.status === "done" ? "not done" : "done"}`}
      />
      <span className={cn("text-sm flex-1 min-w-0 truncate", task.status === "done" && "line-through opacity-60")}>
        {task.title}
      </span>
      <Badge variant="outline" className={cn("text-xs", difficultyClass(task.difficulty))}>
        {task.difficulty}
      </Badge>
      <span className="text-xs text-muted-foreground">{task.est_minutes}m</span>
    </div>
  );
};

interface DroppableDayProps {
  day: string;
  isToday: boolean;
  isOver: boolean;
  children: React.ReactNode;
  total: number;
  done: number;
  count: number;
  open: boolean;
  onToggleOpen: () => void;
  bulkSlot?: React.ReactNode;
}

const DroppableDay = ({ day, isToday, children, total, done, count, open, onToggleOpen, bulkSlot }: DroppableDayProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day}` });
  return (
    <Collapsible open={open} onOpenChange={onToggleOpen}>
      <div
        ref={setNodeRef}
        className={cn(
          "rounded-md transition-colors",
          isOver && "bg-primary/10 ring-1 ring-primary/40"
        )}
      >
        <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md gap-2">
          <CollapsibleTrigger className="flex items-center gap-2 flex-1 min-w-0 text-left">
            <ChevronDown className={cn("h-4 w-4 transition-transform shrink-0", open && "rotate-180")} />
            <span className="font-medium text-sm truncate">
              {isToday ? "Today" : dayLabel(day)}
            </span>
            {isToday && <Badge variant="default" className="text-xs h-5">Today</Badge>}
          </CollapsibleTrigger>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {done}/{count} · {total} min
            </span>
            {bulkSlot}
          </div>
        </div>
        <CollapsibleContent className="pl-4 pr-2 py-1 space-y-0.5 min-h-[8px]">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export const WeeklyPlanView = ({ tasks, onToggle, onMoveTask, onBulkUpdate, onRestore, onLogActivity }: Props) => {
  const todayIso = todayIsoFn();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [activeTask, setActiveTask] = useState<PlanTask | null>(null);
  const [openDays, setOpenDays] = useState<Set<string>>(new Set([todayIso]));

  const grouped = useMemo(() => {
    const map = new Map<string, PlanTask[]>();
    for (const t of tasks) {
      if (t.day_date < todayIso) continue;
      if (!map.has(t.day_date)) map.set(t.day_date, []);
      map.get(t.day_date)!.push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [tasks, todayIso]);

  if (grouped.length === 0) return null;

  const toggleDay = (d: string) =>
    setOpenDays((cur) => {
      const next = new Set(cur);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });

  const handleDragStart = (e: DragStartEvent) => {
    const t = (e.active.data.current as { task?: PlanTask } | undefined)?.task;
    if (t) setActiveTask(t);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveTask(null);
    if (!e.over) return;
    const overId = String(e.over.id);
    if (!overId.startsWith("day-")) return;
    const newDay = overId.slice(4);
    const task = (e.active.data.current as { task?: PlanTask } | undefined)?.task;
    if (!task || task.day_date === newDay) return;
    // expand the destination day
    setOpenDays((cur) => new Set(cur).add(newDay));
    try {
      await onMoveTask(task.id, newDay);
      toast({
        title: "Task moved",
        description: `Rescheduled to ${newDay === todayIso ? "Today" : dayLabel(newDay)}`,
      });
    } catch {
      toast({ title: "Couldn't move task", variant: "destructive" });
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Upcoming days</h2>
        <p className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
          <Pencil className="h-3 w-3" /> Drag tasks between days to reschedule
        </p>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="space-y-1">
          {grouped.map(([day, dayTasks]) => {
            const open = openDays.has(day);
            const total = dayTasks.reduce((s, t) => s + t.est_minutes, 0);
            const done = dayTasks.filter((t) => t.status === "done").length;
            return (
              <DroppableDay
                key={day}
                day={day}
                isToday={day === todayIso}
                isOver={false}
                total={total}
                done={done}
                count={dayTasks.length}
                open={open}
                onToggleOpen={() => toggleDay(day)}
                bulkSlot={
                  onBulkUpdate && onRestore ? (
                    <BulkDayActions
                      day={day}
                      tasks={dayTasks}
                      onBulkUpdate={onBulkUpdate}
                      onRestore={onRestore}
                      onLogActivity={onLogActivity}
                    />
                  ) : undefined
                }
              >
                {dayTasks.map((t) => (
                  <DraggableTask key={t.id} task={t} onToggle={onToggle} />
                ))}
                {open && dayTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground italic py-2">Drop tasks here</p>
                )}
              </DroppableDay>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-popover border border-border shadow-lg">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">{activeTask.title}</span>
              <Badge variant="outline" className={cn("text-xs", difficultyClass(activeTask.difficulty))}>
                {activeTask.difficulty}
              </Badge>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </Card>
  );
};
