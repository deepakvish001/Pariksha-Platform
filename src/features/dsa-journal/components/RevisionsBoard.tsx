import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, CheckCircle2, RotateCw, ChevronRight } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useDueRevisions, useSnoozeEntry, useMarkMastered, useAllEntries } from "../api";
import type { JournalEntry } from "../types";
import ReviseDialog from "./ReviseDialog";
import { todayISO } from "../srs";

export default function RevisionsBoard() {
  const due = useDueRevisions();
  const all = useAllEntries();
  const snooze = useSnoozeEntry();
  const master = useMarkMastered();
  const [revise, setRevise] = useState<JournalEntry | null>(null);

  const upcoming = useMemo(() => {
    const today = todayISO();
    const items = (all.data ?? []).filter(
      (e) =>
        !e.mastered_at &&
        !e.archived_at &&
        e.next_revision_at &&
        e.next_revision_at > today,
    );
    items.sort((a, b) =>
      (a.next_revision_at ?? "").localeCompare(b.next_revision_at ?? ""),
    );
    return items.slice(0, 25);
  }, [all.data]);

  const { overdue, today } = useMemo(() => {
    const t = todayISO();
    const list = due.data ?? [];
    return {
      overdue: list.filter((e) => (e.next_revision_at ?? "") < t),
      today: list.filter((e) => (e.next_revision_at ?? "") === t),
    };
  }, [due.data]);

  return (
    <div className="space-y-5">
      <Group
        title="Overdue"
        accent="text-rose-400 border-rose-500/30 bg-rose-500/5"
        items={overdue}
        empty="Nothing overdue — nice work."
        renderActions={(e) => (
          <Actions
            entry={e}
            onRevise={() => setRevise(e)}
            onSnooze={(d) => snooze.mutate({ id: e.id, days: d })}
            onMaster={() => master.mutate(e.id)}
          />
        )}
      />
      <Group
        title="Due today"
        accent="text-amber-400 border-amber-500/30 bg-amber-500/5"
        items={today}
        empty="Caught up for today!"
        renderActions={(e) => (
          <Actions
            entry={e}
            onRevise={() => setRevise(e)}
            onSnooze={(d) => snooze.mutate({ id: e.id, days: d })}
            onMaster={() => master.mutate(e.id)}
          />
        )}
      />
      <Group
        title="Upcoming"
        accent="text-sky-400 border-sky-500/20 bg-sky-500/5"
        items={upcoming}
        empty="No upcoming revisions yet."
        renderActions={(e) => (
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <CalendarClock className="h-3 w-3" /> in{" "}
            {differenceInCalendarDays(parseISO(e.next_revision_at!), new Date())}d
          </div>
        )}
      />

      {revise && (
        <ReviseDialog
          open={!!revise}
          onOpenChange={(o) => !o && setRevise(null)}
          entry={revise}
        />
      )}
    </div>
  );
}

function Group({
  title,
  items,
  empty,
  accent,
  renderActions,
}: {
  title: string;
  items: JournalEntry[];
  empty: string;
  accent: string;
  renderActions: (e: JournalEntry) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold inline-flex items-center gap-2">
          <ChevronRight className="h-3 w-3" />
          {title}
          <Badge variant="outline" className="h-5 text-[10px]">
            {items.length}
          </Badge>
        </h3>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 p-4 text-xs text-muted-foreground text-center">
          {empty}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((e) => (
            <li
              key={e.id}
              className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${accent}`}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{e.title}</div>
                <div className="text-[11px] text-muted-foreground">
                  Due {e.next_revision_at} · {e.topic ?? "—"} · {e.pattern ?? "—"}
                </div>
              </div>
              {renderActions(e)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Actions({
  entry,
  onRevise,
  onSnooze,
  onMaster,
}: {
  entry: JournalEntry;
  onRevise: () => void;
  onSnooze: (days: number) => void;
  onMaster: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="outline" onClick={onRevise}>
        <RotateCw className="h-3 w-3 mr-1" /> Revise
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onSnooze(1)} title="Snooze 1 day">
        +1d
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onSnooze(3)} title="Snooze 3 days">
        +3d
      </Button>
      <Button size="sm" variant="ghost" onClick={onMaster} title="Mark mastered">
        <CheckCircle2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
