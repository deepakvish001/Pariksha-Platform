import { useMemo, useState } from "react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import {
  BookMarked,
  Plus,
  Flame,
  Calendar,
  TrendingUp,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import RevisionsBoard from "@/features/dsa-journal/components/RevisionsBoard";
import {
  FiltersBar,
  applyFilters,
  defaultFilters,
  type FilterState,
} from "@/features/dsa-journal/components/FiltersBar";
import ExportMenu from "@/features/dsa-journal/components/ExportMenu";

export default function JournalPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <StudioPageShell
        title="Practice Hub"
        description="Log every DSA problem, schedule revisions, and watch your mastery grow."
        canonicalPath="/learn/dsa-studio/journal"
      >
        <SectionCard
          icon={BookMarked}
          title="Practice Hub"
          subtitle="Your daily DSA solve log — free for students."
          accent="text-violet-400"
        >
          <div className="text-center py-10 space-y-3">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Sign in to start tracking every problem you solve. Capture
              mistakes, learnings, code snippets — and let spaced revisions
              bring weak topics back at the right time.
            </p>
            <Button asChild>
              <Link to="/login">Sign in to start logging</Link>
            </Button>
          </div>
        </SectionCard>
      </StudioPageShell>
    );
  }

  return <PracticeHubSignedIn />;
}

function PracticeHubSignedIn() {
  const days = useDays();
  const allEntries = useAllEntries();
  const due = useDueRevisions();
  const { todayRow, today, ensureToday, ensuring } = useTodayDay();
  const todayEntries = useDayEntries(todayRow?.id ?? null);

  const [addOpen, setAddOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const onAdd = async () => {
    const row = todayRow ?? (await ensureToday());
    if (row) setAddOpen(true);
  };

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

  const filtered = useMemo(
    () => applyFilters(allEntries.data ?? [], filters),
    [allEntries.data, filters],
  );

  return (
    <StudioPageShell
      title="Practice Hub"
      description="Log every DSA problem, schedule revisions, and watch your mastery grow."
      canonicalPath="/learn/dsa-studio/journal"
    >
      <SectionCard
        icon={BookMarked}
        title="Practice Hub"
        subtitle="Your daily DSA solve log — capture every problem and let spaced revision do the heavy lifting."
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

        <div className="mt-4 flex items-center gap-2 flex-wrap">
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
          <ExportMenu
            entries={filtered.length ? filtered : allEntries.data ?? []}
            todayEntries={todayEntries.data ?? []}
            todayDate={today}
          />
          <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 ml-auto">
            <Sparkles className="h-3 w-3" /> Tip: paste a LeetCode link — title auto-fills.
          </div>
        </div>
      </SectionCard>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full md:w-fit">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="revisions">
            Revisions ({due.data?.length ?? 0})
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

        <TabsContent value="revisions">
          <RevisionsBoard />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Heatmap days={days.data ?? []} countsByDate={countsByDate} />
          <FiltersBar
            value={filters}
            onChange={setFilters}
            entries={allEntries.data ?? []}
          />
          <div className="text-xs text-muted-foreground">
            Showing {filtered.length} of {allEntries.data?.length ?? 0} entries
          </div>
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <EmptyState
                title="No entries match your filters"
                hint="Try clearing filters or logging more problems."
              />
            ) : (
              filtered.map((e) => <EntryCard key={e.id} entry={e} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics entries={allEntries.data ?? []} />
        </TabsContent>
      </Tabs>
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
