import { useMemo, useState } from "react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { BookMarked, Plus, Flame, Calendar, TrendingUp, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SectionCard, StudioPageShell } from "./_shared";
import {
  useDays,
  useDayEntries,
  useAllEntries,
  useDueRevisions,
  useTodayDay,
} from "@/features/dsa-journal/api";
import EntryForm from "@/features/dsa-journal/components/EntryForm";
import EntryCard from "@/features/dsa-journal/components/EntryCard";
import Heatmap from "@/features/dsa-journal/components/Heatmap";
import Analytics from "@/features/dsa-journal/components/Analytics";
import ReviseDialog from "@/features/dsa-journal/components/ReviseDialog";
import type { JournalEntry } from "@/features/dsa-journal/types";

export default function JournalPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <StudioPageShell
        title="DSA Practice Journal"
        description="Log every DSA problem you solve, schedule revisions, and watch your mastery grow."
        canonicalPath="/learn/dsa-studio/journal"
      >
        <SectionCard
          icon={BookMarked}
          title="DSA Practice Journal"
          subtitle="Track every problem, every attempt, every revision — free for students."
          accent="text-violet-400"
        >
          <div className="text-center py-10 space-y-3">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Sign in to start your daily DSA log. Capture problems, mistakes,
              learnings, and let spaced revisions bring weak topics back at the
              right time.
            </p>
            <Button asChild>
              <Link to="/login">Sign in to start logging</Link>
            </Button>
          </div>
        </SectionCard>
      </StudioPageShell>
    );
  }

  return <JournalSignedIn />;
}

function JournalSignedIn() {
  const days = useDays();
  const allEntries = useAllEntries();
  const due = useDueRevisions();
  const { todayRow, today, ensureToday, ensuring } = useTodayDay();
  const todayEntries = useDayEntries(todayRow?.id ?? null);

  const [addOpen, setAddOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [reviseEntry, setReviseEntry] = useState<JournalEntry | null>(null);

  const onAdd = async () => {
    const row = todayRow ?? (await ensureToday());
    if (row) setAddOpen(true);
  };

  // Streak: walk back from today over `days` while consecutive.
  const streak = useMemo(() => {
    if (!days.data) return 0;
    const set = new Set(days.data.map((d) => d.log_date));
    let count = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!set.has(format(cursor, "yyyy-MM-dd"))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (set.has(format(cursor, "yyyy-MM-dd"))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [days.data]);

  const countsByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of allEntries.data ?? []) {
      const d = e.day?.log_date ?? e.created_at.slice(0, 10);
      m.set(d, (m.get(d) ?? 0) + 1);
    }
    return m;
  }, [allEntries.data]);

  const weekCount = useMemo(() => {
    let n = 0;
    countsByDate.forEach((v, k) => {
      const diff = differenceInCalendarDays(new Date(), parseISO(k));
      if (diff >= 0 && diff < 7) n += v;
    });
    return n;
  }, [countsByDate]);

  return (
    <StudioPageShell
      title="DSA Practice Journal"
      description="Log every DSA problem you solve, schedule revisions, and watch your mastery grow."
      canonicalPath="/learn/dsa-studio/journal"
    >
      <SectionCard
        icon={BookMarked}
        title="DSA Practice Journal"
        subtitle="Log every problem you solve, then let spaced revisions bring them back at the right time."
        accent="text-violet-400"
        badge="Free"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile icon={Flame} label="Streak" value={`${streak}d`} accent="text-orange-400" />
          <StatTile icon={Calendar} label="This week" value={weekCount} accent="text-sky-400" />
          <StatTile
            icon={RotateCw}
            label="Due revisions"
            value={due.data?.length ?? 0}
            accent="text-amber-400"
          />
          <StatTile
            icon={TrendingUp}
            label="Total logged"
            value={allEntries.data?.length ?? 0}
            accent="text-emerald-400"
          />
        </div>

        <div className="mt-4">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <Button onClick={onAdd} disabled={ensuring} className="gap-2">
              <Plus className="h-4 w-4" /> Log a problem
            </Button>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Log a problem — {today}</DialogTitle>
              </DialogHeader>
              {todayRow && (
                <EntryForm
                  dayId={todayRow.id}
                  onDone={() => setAddOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </SectionCard>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full md:w-fit">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="due">
            Due ({due.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-3">
          {todayEntries.isLoading ? (
            <Skeleton className="h-24" />
          ) : !todayEntries.data || todayEntries.data.length === 0 ? (
            <EmptyState
              title="No problems logged today yet"
              hint="Hit Log a problem to capture your first solve."
            />
          ) : (
            todayEntries.data.map((e) => <EntryCard key={e.id} entry={e} />)
          )}
        </TabsContent>

        <TabsContent value="due" className="space-y-3">
          {due.isLoading ? (
            <Skeleton className="h-24" />
          ) : !due.data || due.data.length === 0 ? (
            <EmptyState
              title="No revisions due"
              hint="When entries become due, they'll show up here."
            />
          ) : (
            due.data.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{e.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Due {e.next_revision_at} · {e.topic ?? "—"} ·{" "}
                    {e.pattern ?? "—"}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReviseEntry(e)}
                >
                  <RotateCw className="h-3 w-3 mr-1" /> Revise
                </Button>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Heatmap days={days.data ?? []} countsByDate={countsByDate} />
          <div className="space-y-2">
            {(days.data ?? []).map((d) => (
              <DayBlock
                key={d.id}
                date={d.log_date}
                expanded={selectedDayId === d.id}
                onToggle={() =>
                  setSelectedDayId(selectedDayId === d.id ? null : d.id)
                }
                dayId={d.id}
              />
            ))}
            {days.data && days.data.length === 0 && (
              <EmptyState
                title="No days logged yet"
                hint="Your daily entries will appear here as you log problems."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics entries={allEntries.data ?? []} />
        </TabsContent>
      </Tabs>

      {reviseEntry && (
        <ReviseDialog
          open={!!reviseEntry}
          onOpenChange={(o) => !o && setReviseEntry(null)}
          entry={reviseEntry}
        />
      )}
    </StudioPageShell>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg bg-card/60 border border-border/40 flex items-center justify-center ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-lg font-semibold leading-none">{value}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}

function DayBlock({
  date,
  dayId,
  expanded,
  onToggle,
}: {
  date: string;
  dayId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const entries = useDayEntries(expanded ? dayId : null);
  return (
    <div className="rounded-xl border border-border/40 bg-card/30">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="text-sm font-medium">{date}</div>
        <div className="text-xs text-muted-foreground">
          {expanded ? "Hide" : "Show"} entries
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {entries.isLoading ? (
            <Skeleton className="h-16" />
          ) : entries.data && entries.data.length > 0 ? (
            entries.data.map((e) => <EntryCard key={e.id} entry={e} />)
          ) : (
            <div className="text-xs text-muted-foreground px-2 py-3">
              Nothing logged on this day.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
