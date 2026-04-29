import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { CheckCheck, Circle, MoreHorizontal, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PlanTask, PlanTaskStatus } from "@/hooks/useStudyPlan";

interface ActivityEntry {
  kind: "bulk_mark_done" | "bulk_mark_pending" | "bulk_undo_status";
  summary: string;
  detail?: string;
  count: number;
}

interface Props {
  day: string;
  tasks: PlanTask[];
  onBulkUpdate: (
    taskIds: string[],
    status: PlanTaskStatus
  ) => Promise<Array<{ id: string; status: PlanTaskStatus; completed_at: string | null }>>;
  onRestore: (
    snapshot: Array<{ id: string; status: PlanTaskStatus; completed_at: string | null }>
  ) => Promise<void>;
  onLogActivity?: (entry: ActivityEntry) => void;
}

const dayLabel = (iso: string, isToday: boolean) => {
  if (isToday) return "today";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

const todayIsoFn = () => {
  const t = new Date(); t.setHours(0,0,0,0); return t.toISOString().slice(0,10);
};

const STATUS_LABEL: Record<PlanTaskStatus, string> = {
  pending: "pending",
  in_progress: "in progress",
  partial: "partial",
  done: "done",
  skipped: "skipped",
};

export const BulkDayActions = ({ day, tasks, onBulkUpdate, onRestore, onLogActivity }: Props) => {
  const [pendingAction, setPendingAction] = useState<PlanTaskStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const isToday = day === todayIsoFn();

  // Eligible tasks for each action: switch the ones not already in the target status (and not skipped).
  const targetableFor = (status: PlanTaskStatus) =>
    tasks.filter((t) => t.status !== status && t.status !== "skipped");

  if (tasks.length === 0) return null;

  const apply = async (status: PlanTaskStatus) => {
    const target = targetableFor(status);
    if (target.length === 0) {
      toast({ title: "Nothing to update", description: `All tasks for ${dayLabel(day, isToday)} are already ${STATUS_LABEL[status]}.` });
      setPendingAction(null);
      return;
    }
    setBusy(true);
    try {
      const snapshot = await onBulkUpdate(target.map((t) => t.id), status);
      const verb = status === "done" ? "marked done" : "marked pending";
      const summary = `${target.length} task${target.length === 1 ? "" : "s"} ${verb}`;
      onLogActivity?.({
        kind: status === "done" ? "bulk_mark_done" : "bulk_mark_pending",
        summary,
        detail: `For ${dayLabel(day, isToday)}`,
        count: target.length,
      });
      toast({
        title: summary,
        description: `For ${dayLabel(day, isToday)}.`,
        duration: 6000,
        action: (
          <ToastAction
            altText="Undo"
            onClick={async () => {
              try {
                await onRestore(snapshot);
                onLogActivity?.({
                  kind: "bulk_undo_status",
                  summary: `Undid ${verb} for ${target.length} task${target.length === 1 ? "" : "s"}`,
                  detail: `For ${dayLabel(day, isToday)}`,
                  count: target.length,
                });
                toast({ title: "Undone", description: "Previous statuses restored." });
              } catch (e) {
                toast({
                  title: "Couldn't undo", variant: "destructive",
                  description: e instanceof Error ? e.message : "Unknown error",
                });
              }
            }}
          >
            Undo
          </ToastAction>
        ),
      });
    } catch (e) {
      toast({
        title: "Bulk update failed", variant: "destructive",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(false);
      setPendingAction(null);
    }
  };

  const target = pendingAction ? targetableFor(pendingAction) : [];
  const targetCount = target.length;
  const verb = pendingAction === "done" ? "Mark all as done" : "Mark all as pending";

  // Group target tasks by their current status for the review breakdown.
  const breakdown: Array<{ status: PlanTaskStatus; count: number }> = (["pending", "in_progress", "partial", "done"] as PlanTaskStatus[])
    .map((s) => ({ status: s, count: target.filter((t) => t.status === s).length }))
    .filter((row) => row.count > 0);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 opacity-60 hover:opacity-100"
            aria-label={`Bulk actions for ${dayLabel(day, isToday)}`}
            onClick={(e) => e.stopPropagation()}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuLabel className="text-xs">Bulk for {dayLabel(day, isToday)}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setPendingAction("done")}>
            <CheckCheck className="h-3.5 w-3.5 mr-2" /> Mark all as done
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPendingAction("pending")}>
            <Circle className="h-3.5 w-3.5 mr-2" /> Mark all as pending
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={pendingAction !== null} onOpenChange={(v) => !v && setPendingAction(null)}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{verb}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="font-semibold tabular-nums">{targetCount}</span> task{targetCount === 1 ? "" : "s"} for{" "}
                  <span className="font-medium">{dayLabel(day, isToday)}</span> will change.
                </p>
                {breakdown.length > 0 && pendingAction && (
                  <div className="rounded-lg border border-border/40 bg-muted/30 p-2 space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Review changes
                    </p>
                    <ul className="space-y-1 text-xs">
                      {breakdown.map((row) => (
                        <li key={row.status} className="flex items-center justify-between">
                          <span className="capitalize">
                            {row.count} {STATUS_LABEL[row.status]} → {STATUS_LABEL[pendingAction]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Skipped tasks aren't affected. You'll have a few seconds to undo.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingAction && apply(pendingAction)}
              disabled={targetCount === 0}
            >
              Confirm ({targetCount})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
