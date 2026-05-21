import { useEffect, useMemo, useState } from "react";
import { format, parseISO, differenceInCalendarDays, isToday } from "date-fns";
import {
  BookMarked,
  Flame,
  Calendar,
  TrendingUp,
  RotateCw,
  Sparkles,
  CheckCircle2,
  Timer,
  Trophy,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SectionCard, StudioPageShell } from "./_shared";
import {
  useDays,
  useDayEntries,
  useAllEntries,
  useDueRevisions,
  useDayByDate,
  useEnsureDay,
  useUpdateEntry,
} from "@/features/dsa-journal/api";
import Heatmap from "@/features/dsa-journal/components/Heatmap";
import Analytics from "@/features/dsa-journal/components/Analytics";
import RevisionsBoard from "@/features/dsa-journal/components/RevisionsBoard";
import PracticeSheet from "@/features/dsa-journal/components/PracticeSheet";
import GoalsRing from "@/features/dsa-journal/components/GoalsRing";
import TopicMastery from "@/features/dsa-journal/components/TopicMastery";
import DifficultyMix from "@/features/dsa-journal/components/DifficultyMix";
import ActivityInsights from "@/features/dsa-journal/components/ActivityInsights";
import DateNavigator from "@/features/dsa-journal/components/DateNavigator";
import SessionBar, { groupBySession } from "@/features/dsa-journal/components/SessionBar";
import DaySummaryStrip from "@/features/dsa-journal/components/DaySummaryStrip";
import TimeOfDayChart from "@/features/dsa-journal/components/TimeOfDayChart";
import SessionInsights from "@/features/dsa-journal/components/SessionInsights";
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
        title="DSA Tracker"
        description="Track every DSA problem you solve, schedule revisions, and watch your mastery grow."
        canonicalPath="/learn/dsa-tracker"
      >
        <SectionCard
          icon={BookMarked}
          title="DSA Tracker"
          subtitle="Your daily DSA solve log — free for students."
          accent="text-violet-400"
        >
          <div className="text-center py-10 space-y-3">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Sign in to start tracking every problem you solve in a clean
              spreadsheet view. Log multiple study sessions across the day,
              back-date entries, and let spaced revisions resurface weak topics.
            </p>
            <Button asChild>
              <Link to="/login">Sign in to start tracking</Link>
            </Button>
          </div>
        </SectionCard>
      </StudioPageShell>
    );
  }

  return <DsaTrackerSignedIn />;
}

function DsaTrackerSignedIn() {
  const days = useDays();
  const allEntries = useAllEntries();
  const due = useDueRevisions();
  const ensureDay = useEnsureDay();
  const updateEntry = useUpdateEntry();

  // Active date for the Log tab.
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [activeTab, setActiveTab] = useState("log");

  const dayQuery = useDayByDate(selectedDate);
  const selectedDayId = dayQuery.data?.id ?? null;
  const dayEntries = useDayEntries(selectedDayId);

  // Active session + timer (per-day, kept in localStorage so refresh survives)
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [timerStartedAt, setTimerStartedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`dsa-tracker:session:${selectedDate}`);
      if (raw) {
        const v = JSON.parse(raw);
        setActiveSession(v.label ?? null);
        setTimerStartedAt(v.timerStartedAt ?? null);
      } else {
        setActiveSession(null);
        setTimerStartedAt(null);
      }
    } catch {
      /* ignore */
    }
  }, [selectedDate]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `dsa-tracker:session:${selectedDate}`,
        JSON.stringify({ label: activeSession, timerStartedAt }),
      );
    } catch {
      /* ignore */
    }
  }, [selectedDate, activeSession, timerStartedAt]);

  // Re-render every minute so the timer label updates.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!timerStartedAt) return;
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [timerStartedAt]);

  const [filters, setFilters] = useState<FilterState>(defaultFilters);

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

  const todayCount = useMemo(() => {
    const t = format(new Date(), "yyyy-MM-dd");
    return countsByDate.get(t) ?? 0;
  }, [countsByDate]);

  const advanced = useMemo(() => {
    const all = allEntries.data ?? [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const recent = all.filter((e) => new Date(e.created_at) >= cutoff);
    const cleanRate = recent.length
      ? Math.round((recent.filter((e) => e.solved_clean).length / recent.length) * 100)
      : 0;
    const timed = recent.filter((e) => e.time_taken_min != null);
    const avgTime = timed.length
      ? Math.round(timed.reduce((s, e) => s + (e.time_taken_min ?? 0), 0) / timed.length)
      : 0;
    const mastered = all.filter((e) => e.mastered_at).length;
    const confEntries = all.filter((e) => e.confidence != null);
    const avgConf = confEntries.length
      ? +(confEntries.reduce((s, e) => s + (e.confidence ?? 0), 0) / confEntries.length).toFixed(1)
      : 0;
    return { cleanRate, avgTime, mastered, avgConf };
  }, [allEntries.data]);

  const filtered = useMemo(
    () => applyFilters(allEntries.data ?? [], filters),
    [allEntries.data, filters],
  );

  const presets: { label: string; active: boolean; apply: () => void }[] = [
    { label: "★ Favorites", active: filters.favoritesOnly, apply: () => setFilters({ ...defaultFilters, favoritesOnly: true }) },
    { label: "Stuck only", active: filters.status === "stuck", apply: () => setFilters({ ...defaultFilters, status: "stuck" }) },
    { label: "Due soon", active: filters.sort === "due-soon", apply: () => setFilters({ ...defaultFilters, sort: "due-soon" }) },
    { label: "✓ Mastered", active: filters.masteredOnly, apply: () => setFilters({ ...defaultFilters, masteredOnly: true }) },
    { label: "Hardest first", active: filters.sort === "hardest", apply: () => setFilters({ ...defaultFilters, sort: "hardest" }) },
  ];

  // ---------- Log tab handlers ----------

  const ensureSelectedDay = async () => {
    if (selectedDayId) return selectedDayId;
    const row = await ensureDay.mutateAsync(selectedDate);
    return row.id;
  };

  const handleStartTimer = async () => {
    if (!activeSession) return;
    await ensureSelectedDay();
    setTimerStartedAt(new Date().toISOString());
  };

  const handleStopTimer = async () => {
    if (!timerStartedAt) return;
    const endIso = new Date().toISOString();
    const startMs = new Date(timerStartedAt).getTime();
    const endMs = Date.parse(endIso);
    const elapsedMin = Math.max(1, Math.round((endMs - startMs) / 60000));

    // Auto-stamp ended_at + time_taken_min on entries from this timer window.
    const active = (dayEntries.data ?? []).filter(
      (e) =>
        e.session_label === activeSession &&
        e.started_at &&
        e.started_at >= timerStartedAt &&
        !e.ended_at,
    );
    await Promise.all(
      active.map((e) =>
        updateEntry.mutateAsync({
          id: e.id,
          patch: {
            ended_at: endIso,
            time_taken_min:
              e.time_taken_min ??
              Math.max(1, Math.round(elapsedMin / Math.max(1, active.length))),
          },
        }),
      ),
    );
    setTimerStartedAt(null);
  };

  const groups = useMemo(
    () => groupBySession((dayEntries.data ?? []) as any),
    [dayEntries.data],
  );
  const visibleGroups = activeSession
    ? groups.filter((g) => g.label === activeSession)
    : groups;
  // If active session has no group yet, render an empty section for it.
  const showEmptyActive =
    activeSession && !groups.some((g) => g.label === activeSession);

  const openDate = (iso: string) => {
    setSelectedDate(iso);
    setActiveTab("log");
  };

  return (
    <StudioPageShell
      title="DSA Tracker"
      description="Track every DSA problem you solve, schedule revisions, and watch your mastery grow."
      canonicalPath="/learn/dsa-tracker"
    >
      <SectionCard
        icon={BookMarked}
        title="DSA Tracker"
        subtitle="Spreadsheet-style solve tracker — multi-session, back-datable, spaced-revision ready."
        accent="text-violet-400"
        badge="Free"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile icon={Flame} label="Streak" value={`${streak}d`} accent="text-orange-400" />
          <StatTile icon={Calendar} label="This week" value={weekCount} accent="text-sky-400" />
          <StatTile icon={RotateCw} label="Due revisions" value={due.data?.length ?? 0} accent="text-amber-400" />
          <StatTile icon={TrendingUp} label="Total logged" value={allEntries.data?.length ?? 0} accent="text-emerald-400" />
          <StatTile icon={CheckCircle2} label="Clean rate (30d)" value={`${advanced.cleanRate}%`} accent="text-emerald-400" />
          <StatTile icon={Timer} label="Avg time (30d)" value={advanced.avgTime ? `${advanced.avgTime}m` : "—"} accent="text-sky-400" />
          <StatTile icon={Trophy} label="Mastered" value={advanced.mastered} accent="text-violet-400" />
          <StatTile icon={Gauge} label="Confidence" value={advanced.avgConf ? `${advanced.avgConf}/5` : "—"} accent="text-rose-400" />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <GoalsRing todayCount={todayCount} weekCount={weekCount} />
          <DifficultyMix entries={allEntries.data ?? []} />
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <ExportMenu
            entries={filtered.length ? filtered : allEntries.data ?? []}
            todayEntries={(dayEntries.data ?? []) as any}
            todayDate={selectedDate}
          />
          <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 ml-auto">
            <Sparkles className="h-3 w-3" /> Tip: paste a LeetCode link — title auto-fills.
          </div>
        </div>
      </SectionCard>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full md:w-fit">
          <TabsTrigger value="log">Log</TabsTrigger>
          <TabsTrigger value="revisions">Revisions ({due.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <DateNavigator value={selectedDate} onChange={setSelectedDate} />
            <DaySummaryStrip entries={(dayEntries.data ?? []) as any} />
          </div>

          <SessionBar
            entries={(dayEntries.data ?? []) as any}
            activeLabel={activeSession}
            onChangeActive={setActiveSession}
            timerStartedAt={timerStartedAt}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
          />

          {dayEntries.isLoading || ensureDay.isPending ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="space-y-4">
              {visibleGroups.length === 0 && !showEmptyActive && (
                <PracticeSheet
                  entries={[]}
                  dayId={selectedDayId ?? undefined}
                  showAddRow={!!selectedDayId || isToday(parseISO(selectedDate))}
                  showDateCol={false}
                  sessionLabel={activeSession}
                  sessionStartedAt={timerStartedAt}
                  emptyHint={
                    selectedDayId
                      ? "No entries for this date yet — pick a session and add your first solve."
                      : "Add your first solve to start logging this date."
                  }
                />
              )}

              {visibleGroups.map((g) => (
                <div key={g.label} className="space-y-1">
                  <SessionHeader group={g} />
                  <PracticeSheet
                    entries={g.entries as any}
                    dayId={selectedDayId ?? undefined}
                    showAddRow={activeSession === g.label}
                    showDateCol={false}
                    sessionLabel={g.label}
                    sessionStartedAt={
                      activeSession === g.label ? timerStartedAt : null
                    }
                  />
                </div>
              ))}

              {showEmptyActive && (
                <div className="space-y-1">
                  <SessionHeader
                    group={{
                      label: activeSession!,
                      entries: [],
                      startISO: timerStartedAt,
                      endISO: null,
                      totalMin: 0,
                      solved: 0,
                    }}
                  />
                  <PracticeSheet
                    entries={[]}
                    dayId={selectedDayId ?? undefined}
                    showAddRow={true}
                    showDateCol={false}
                    sessionLabel={activeSession}
                    sessionStartedAt={timerStartedAt}
                    emptyHint={`First problem of the ${activeSession} session — add it below.`}
                  />
                </div>
              )}
            </div>
          )}

          {!selectedDayId && !dayEntries.isLoading && (
            <div className="text-xs text-muted-foreground">
              <Button
                size="sm"
                variant="outline"
                onClick={() => ensureSelectedDay()}
                disabled={ensureDay.isPending}
              >
                Start logging {isToday(parseISO(selectedDate)) ? "today" : format(parseISO(selectedDate), "MMM d")}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="revisions">
          <RevisionsBoard />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Heatmap days={days.data ?? []} countsByDate={countsByDate} onCellClick={openDate} />
          <TopicMastery
            entries={allEntries.data ?? []}
            onPick={(topic) => setFilters({ ...defaultFilters, topic })}
          />
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={p.apply}
                className={
                  "h-7 px-2.5 rounded-md text-xs border transition " +
                  (p.active
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-card/40 border-border/40 text-muted-foreground hover:text-foreground")
                }
              >
                {p.label}
              </button>
            ))}
          </div>
          <FiltersBar value={filters} onChange={setFilters} entries={allEntries.data ?? []} />
          <div className="text-xs text-muted-foreground">
            Showing {filtered.length} of {allEntries.data?.length ?? 0} entries
          </div>
          <PracticeSheet
            entries={filtered}
            showAddRow={false}
            showDateCol={true}
            loading={allEntries.isLoading}
            emptyHint="No entries match your filters — try clearing them."
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ActivityInsights entries={allEntries.data ?? []} />
            <SessionInsights entries={allEntries.data ?? []} />
            <TimeOfDayChart entries={allEntries.data ?? []} />
          </div>
          <Analytics entries={allEntries.data ?? []} />
        </TabsContent>
      </Tabs>
    </StudioPageShell>
  );
}

function SessionHeader({ group }: { group: ReturnType<typeof groupBySession>[number] }) {
  const fmtTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—";
  return (
    <div className="flex items-center gap-2 text-xs px-1">
      <span className="font-semibold text-foreground">{group.label}</span>
      <span className="text-muted-foreground">
        {fmtTime(group.startISO)}
        {group.endISO ? ` – ${fmtTime(group.endISO)}` : group.startISO ? " – ongoing" : ""}
      </span>
      <span className="text-border">·</span>
      <span className="text-muted-foreground">
        {group.entries.length} problem{group.entries.length === 1 ? "" : "s"} ·{" "}
        {group.totalMin}m
      </span>
    </div>
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
      <div className="min-w-0">
        <div className="text-lg font-semibold leading-none truncate">{value}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{label}</div>
      </div>
    </div>
  );
}
