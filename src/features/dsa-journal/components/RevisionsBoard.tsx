import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, CheckCircle2, ChevronRight } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useDueRevisions, useSnoozeEntry, useMarkMastered, useAllEntries } from "../api";
import type { JournalEntry } from "../types";
import ReviseInline from "./ReviseInline";
import { todayISO } from "../srs";

export default function RevisionsBoard() {
  const due = useDueRevisions();
  const all = useAllEntries();
  const snooze = useSnoozeEntry();
  const master = useMarkMastered();

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

  const actions = (e: JournalEntry) => (
    <div className="flex items-center gap-1">
      <ReviseInline entry={e} />
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs"
        onClick={() => snooze.mutate({ id: e.id, days: 1 })}
        title="Snooze 1 day"
      >
        +1d
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs"
        onClick={() => snooze.mutate({ id: e.id, days: 3 })}
        title="Snooze 3 days"
      >
        +3d
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0"
        onClick={() => master.mutate(e.id)}
        title="Mark mastered"
      >
        <CheckCircle2 className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <Group
        title="Overdue"
        accent="text-rose-400 border-rose-500/30 bg-rose-500/5"
        items={overdue}
        empty="Nothing overdue — nice work."
        renderActions={actions}
      />
      <Group
        title="Due today"
        accent="text-amber-400 border-amber-500/30 bg-amber-500/5"
        items={today}
        empty="Caught up for today!"
        renderActions={actions}
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
        <div className={`rounded-xl border overflow-hidden ${accent}`}>
          <table className="w-full text-xs">
            <tbody>
              {items.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-border/20 last:border-b-0 [&>td]:px-3 [&>td]:py-2"
                >
                  <td className="min-w-0">
                    <div className="text-sm font-medium truncate">{e.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Due {e.next_revision_at} · {e.topic ?? "—"} ·{" "}
                      {e.pattern ?? "—"} · {e.difficulty ?? "—"}
                    </div>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {renderActions(e)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
