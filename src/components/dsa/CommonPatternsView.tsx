import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Puzzle,
  ExternalLink,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Circle,
  X as XIcon,
  Filter,
  ArrowDownAZ,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDsaPatternHistory } from "@/hooks/useDsaPatternHistory";
import { useDsaPatternSettings } from "@/hooks/useDsaPatternSettings";
import { useDsaPatternAchievements } from "@/hooks/useDsaPatternAchievements";
import PatternAchievementsPanel from "./PatternAchievementsPanel";
import BadgeDetailsDrawer, { type BadgeDrawerTarget } from "./BadgeDetailsDrawer";
import {
  COMMON_PATTERNS,
  PATTERN_TOTAL,
  type CommonPattern,
  type PatternCategory,
  type PatternProblem,
} from "@/data/dsaCommonPatternsData";

const diffStyles: Record<PatternProblem["difficulty"], string> = {
  Easy: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  Medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  Hard: "text-rose-400 border-rose-500/30 bg-rose-500/10",
};

const LS_BOOKMARKS = "dsaPatterns:bookmarks:v1";
const LS_DONE = "dsaPatterns:done:v1";

const loadSet = (key: string): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const saveSet = (key: string, set: Set<string>) => {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
};

// Coarse complexity bucketing for the filter chips.
const bucketComplexity = (c: string): string => {
  const s = c.toLowerCase();
  if (s.includes("log") && s.includes("n")) return "O(n log n / log n)";
  if (s.includes("n²") || s.includes("n^2") || s.includes("v·e") || s.includes("v+e)")) {
    if (s.includes("n²") || s.includes("n^2")) return "O(n²)";
  }
  if (s.includes("2ⁿ") || s.includes("2^n") || s.includes("n!")) return "O(2ⁿ / n!)";
  if (s.includes("n²")) return "O(n²)";
  if (s.includes("v+e") || s.includes("v·e")) return "Graph V/E";
  if (s.includes("o(n)") || s.includes("o(n+e)") || s.includes("o(r×c)") || s.startsWith("build")) return "O(n)";
  if (s.includes("o(1)") || s.includes("o(h)")) return "O(1) / O(h)";
  return "Other";
};

interface UsePatternStorageReturn {
  bookmarks: Set<string>;
  done: Set<string>;
  toggleBookmark: (id: string) => void;
  toggleDone: (id: string) => void;
}

const usePatternStorage = (): UsePatternStorageReturn => {
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => loadSet(LS_BOOKMARKS));
  const [done, setDone] = useState<Set<string>>(() => loadSet(LS_DONE));

  useEffect(() => saveSet(LS_BOOKMARKS, bookmarks), [bookmarks]);
  useEffect(() => saveSet(LS_DONE, done), [done]);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_BOOKMARKS) setBookmarks(loadSet(LS_BOOKMARKS));
      if (e.key === LS_DONE) setDone(loadSet(LS_DONE));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    bookmarks,
    done,
    toggleBookmark: (id) =>
      setBookmarks((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
    toggleDone: (id) =>
      setDone((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
  };
};

export default function CommonPatternsView() {
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [activeComplexities, setActiveComplexities] = useState<Set<string>>(new Set());
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [showOnlyTodo, setShowOnlyTodo] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "done" | "in_progress" | "not_started">("all");
  const [sortMode, setSortMode] = useState<"default" | "progress_desc" | "progress_asc">("default");
  const [openPattern, setOpenPatternState] = useState<CommonPattern | null>(null);

  const [masteryFilter, setMasteryFilter] = useState<"all" | "Bronze" | "Silver" | "Gold">("all");
  const [badgeTarget, setBadgeTarget] = useState<BadgeDrawerTarget | null>(null);

  const { bookmarks, done, toggleBookmark, toggleDone } = usePatternStorage();
  const { settings, update: updateSettings } = useDsaPatternSettings();
  const history = useDsaPatternHistory(settings);
  const { feed, clearFeed } = useDsaPatternAchievements(done, history.currentStreak);

  // Log new completions to history (diff vs previous done set)
  const prevDoneRef = useRef<Set<string>>(done);
  useEffect(() => {
    const prev = prevDoneRef.current;
    done.forEach((id) => {
      if (!prev.has(id)) history.logCompletion(id);
    });
    prevDoneRef.current = new Set(done);
    // history.logCompletion is stable via useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // Deep-link sync: ?pattern=<id> opens the detail dialog
  const [searchParams, setSearchParams] = useSearchParams();
  const patternIndex = useMemo(() => {
    const m = new Map<string, CommonPattern>();
    COMMON_PATTERNS.forEach((cat) => cat.patterns.forEach((p) => m.set(p.id, p)));
    return m;
  }, []);

  const setOpenPattern = useCallback(
    (p: CommonPattern | null) => {
      setOpenPatternState(p);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (p) next.set("pattern", p.id);
          else next.delete("pattern");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Sync URL → state (initial load + back/forward navigation)
  useEffect(() => {
    const id = searchParams.get("pattern");
    const target = id ? patternIndex.get(id) ?? null : null;
    setOpenPatternState((curr) => (curr?.id === target?.id ? curr : target));
  }, [searchParams, patternIndex]);

  // Build tag + complexity universes
  const { allTags, allComplexities } = useMemo(() => {
    const tagSet = new Set<string>();
    const cxSet = new Set<string>();
    COMMON_PATTERNS.forEach((cat) =>
      cat.patterns.forEach((p) => {
        p.tags.forEach((t) => tagSet.add(t));
        cxSet.add(bucketComplexity(p.complexity));
      }),
    );
    return {
      allTags: [...tagSet].sort(),
      allComplexities: [...cxSet].sort(),
    };
  }, []);

  const toggleIn = (set: Set<string>, value: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  };

  const filtered: PatternCategory[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    return COMMON_PATTERNS.map((cat) => ({
      ...cat,
      patterns: cat.patterns.filter((p) => {
        if (activeCategories.size > 0 && !activeCategories.has(cat.id)) return false;
        if (activeTags.size > 0 && !p.tags.some((t) => activeTags.has(t))) return false;
        if (activeComplexities.size > 0 && !activeComplexities.has(bucketComplexity(p.complexity)))
          return false;
        if (showOnlyBookmarked && !bookmarks.has(p.id)) return false;
        if (showOnlyTodo && done.has(p.id)) return false;
        // Status: done | in_progress (bookmarked, not done) | not_started (neither)
        if (statusFilter !== "all") {
          const isDone = done.has(p.id);
          const isMarked = bookmarks.has(p.id);
          if (statusFilter === "done" && !isDone) return false;
          if (statusFilter === "in_progress" && !(isMarked && !isDone)) return false;
          if (statusFilter === "not_started" && (isDone || isMarked)) return false;
        }
        if (!q) return true;
        return (
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.problems.some(
            (pr) => pr.title.toLowerCase().includes(q) || pr.id.toLowerCase().includes(q),
          )
        );
      }),
    })).filter((c) => c.patterns.length > 0);
  }, [search, activeCategories, activeTags, activeComplexities, showOnlyBookmarked, showOnlyTodo, statusFilter, bookmarks, done]);

  const totalShown = filtered.reduce((s, c) => s + c.patterns.length, 0);
  const totalDone = done.size;
  const totalBookmarks = bookmarks.size;
  const overallPct = PATTERN_TOTAL > 0 ? Math.round((totalDone / PATTERN_TOTAL) * 100) : 0;

  // Per-category completion stats
  const categoryStats = useMemo(() => {
    const map = new Map<string, { done: number; total: number; pct: number }>();
    COMMON_PATTERNS.forEach((cat) => {
      const total = cat.patterns.length;
      const d = cat.patterns.reduce((n, p) => n + (done.has(p.id) ? 1 : 0), 0);
      map.set(cat.id, { done: d, total, pct: total > 0 ? Math.round((d / total) * 100) : 0 });
    });
    return map;
  }, [done]);

  // Difficulty breakdown across all linked LeetCode problems in completed patterns
  const difficultyDone = useMemo(() => {
    const counts = { Easy: 0, Medium: 0, Hard: 0 };
    COMMON_PATTERNS.forEach((cat) =>
      cat.patterns.forEach((p) => {
        if (!done.has(p.id)) return;
        p.problems.forEach((pr) => {
          counts[pr.difficulty] += 1;
        });
      }),
    );
    return counts;
  }, [done]);
  const totalProblemsDone = difficultyDone.Easy + difficultyDone.Medium + difficultyDone.Hard;
  const completedCategories = [...categoryStats.values()].filter((s) => s.pct === 100).length;

  // Apply mastery quick filter + category sort to the filtered output
  const masteryThreshold = masteryFilter === "Bronze" ? 25 : masteryFilter === "Silver" ? 50 : masteryFilter === "Gold" ? 100 : 0;
  const displayed = useMemo(() => {
    let list = filtered;
    if (masteryFilter !== "all") {
      list = list.filter((c) => (categoryStats.get(c.id)?.pct ?? 0) >= masteryThreshold);
    }
    if (sortMode === "default") return list;
    return [...list].sort((a, b) => {
      const pa = categoryStats.get(a.id)?.pct ?? 0;
      const pb = categoryStats.get(b.id)?.pct ?? 0;
      return sortMode === "progress_desc" ? pb - pa : pa - pb;
    });
  }, [filtered, sortMode, categoryStats, masteryFilter, masteryThreshold]);

  const clearFilters = () => {
    setActiveCategories(new Set());
    setActiveTags(new Set());
    setActiveComplexities(new Set());
    setShowOnlyBookmarked(false);
    setShowOnlyTodo(false);
    setStatusFilter("all");
    setSortMode("default");
    setMasteryFilter("all");
    setSearch("");
  };

  const hasActiveFilters =
    search ||
    activeCategories.size > 0 ||
    activeTags.size > 0 ||
    activeComplexities.size > 0 ||
    showOnlyBookmarked ||
    showOnlyTodo ||
    statusFilter !== "all" ||
    sortMode !== "default" ||
    masteryFilter !== "all";

  return (
    <div className="relative -mx-4 md:-mx-6">
      {/* Sticky header (sticks within DSA Studio main scroller) */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 md:px-6 py-4 space-y-4">
        {/* Title row */}
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card/40 to-card/40 p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold">
                <Puzzle className="h-5 w-5 text-emerald-400" />
                Common Patterns
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                The {PATTERN_TOTAL} reusable templates that solve 90% of interview problems —
                grouped by core technique.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                {totalShown}/{PATTERN_TOTAL} patterns
              </Badge>
              <Badge className="bg-sky-500/15 text-sky-300 border-sky-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {totalDone} done
              </Badge>
              <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">
                <BookmarkCheck className="h-3 w-3 mr-1" />
                {totalBookmarks} saved
              </Badge>
            </div>
          </div>

          {/* Overall progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Overall mastery</span>
              <span className="font-mono text-foreground">
                {totalDone}/{PATTERN_TOTAL} • <span className="text-emerald-400 font-semibold">{overallPct}%</span>
              </span>
            </div>
            <Progress
              value={overallPct}
              className="h-2 bg-muted/40"
              indicatorClassName="bg-gradient-to-r from-emerald-500 to-sky-400"
            />
            <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-muted-foreground">
              <span>
                Categories complete:{" "}
                <span className="text-foreground font-semibold">
                  {completedCategories}/{COMMON_PATTERNS.length}
                </span>
              </span>
              <span className="opacity-40">•</span>
              <span>
                LeetCode unlocked:{" "}
                <span className="text-foreground font-semibold">{totalProblemsDone}</span>
              </span>
              <span className="opacity-40">•</span>
              <span className="text-emerald-400">{difficultyDone.Easy} Easy</span>
              <span className="text-amber-400">{difficultyDone.Medium} Medium</span>
              <span className="text-rose-400">{difficultyDone.Hard} Hard</span>
            </div>
          </div>

          {/* Per-category progress grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
            {COMMON_PATTERNS.map((cat) => {
              const s = categoryStats.get(cat.id)!;
              return (
                <a
                  key={cat.id}
                  href={`#pat-${cat.id}`}
                  className="group rounded-lg border border-border/40 bg-card/40 px-2.5 py-2 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="flex items-center gap-1 min-w-0">
                      <span className="shrink-0">{cat.emoji}</span>
                      <span className="truncate text-[11px] font-medium text-foreground">
                        {cat.title}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {s.done}/{s.total}
                    </span>
                  </div>
                  <Progress
                    value={s.pct}
                    className="h-1 bg-muted/40"
                    indicatorClassName={cn(
                      s.pct === 100
                        ? "bg-emerald-500"
                        : s.pct >= 50
                          ? "bg-sky-400"
                          : s.pct > 0
                            ? "bg-amber-400"
                            : "bg-muted-foreground/30",
                    )}
                  />
                </a>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patterns, tags, or problem numbers..."
            className="pl-9 h-10 bg-card/40"
          />
        </div>

        {/* Filter rows */}
        <div className="space-y-2">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground inline-flex items-center gap-1 mr-1">
              <Filter className="h-3 w-3" /> Category
            </span>
            {COMMON_PATTERNS.map((c) => {
              const active = activeCategories.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleIn(activeCategories, c.id, setActiveCategories)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border transition-colors",
                    active
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                      : "border-border/40 bg-card/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/30",
                  )}
                >
                  <span>{c.emoji}</span>
                  <span className="font-medium">{c.title}</span>
                </button>
              );
            })}
          </div>

          {/* Complexity */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mr-1">
              Complexity
            </span>
            {allComplexities.map((cx) => {
              const active = activeComplexities.has(cx);
              return (
                <button
                  key={cx}
                  onClick={() => toggleIn(activeComplexities, cx, setActiveComplexities)}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-xs font-mono border transition-colors",
                    active
                      ? "border-sky-500/50 bg-sky-500/15 text-sky-300"
                      : "border-border/40 bg-card/40 text-muted-foreground hover:text-foreground hover:border-sky-500/30",
                  )}
                >
                  {cx}
                </button>
              );
            })}
          </div>

          {/* Tags */}
          <details className="group">
            <summary className="cursor-pointer list-none inline-flex items-center gap-1 text-[11px] uppercase tracking-wide font-semibold text-muted-foreground hover:text-foreground">
              Tags ({activeTags.size}/{allTags.length})
              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
            </summary>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {allTags.map((t) => {
                const active = activeTags.has(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleIn(activeTags, t, setActiveTags)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[11px] border transition-colors",
                      active
                        ? "border-violet-500/50 bg-violet-500/15 text-violet-300"
                        : "border-border/40 bg-card/40 text-muted-foreground hover:text-foreground hover:border-violet-500/30",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </details>

          {/* Status filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mr-1">
              Status
            </span>
            {(
              [
                { id: "all", label: "All", icon: null, color: "" },
                { id: "done", label: "Done", icon: CheckCircle2, color: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300" },
                { id: "in_progress", label: "In progress", icon: Loader2, color: "border-amber-500/50 bg-amber-500/15 text-amber-300" },
                { id: "not_started", label: "Not started", icon: Circle, color: "border-zinc-500/50 bg-zinc-500/15 text-zinc-300" },
              ] as const
            ).map((s) => {
              const active = statusFilter === s.id;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border transition-colors",
                    active
                      ? s.color || "border-primary/50 bg-primary/15 text-primary"
                      : "border-border/40 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border",
                  )}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Quick toggles + sort */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              size="sm"
              variant={showOnlyBookmarked ? "default" : "outline"}
              onClick={() => setShowOnlyBookmarked((v) => !v)}
              className="h-7 gap-1.5 text-xs"
            >
              <BookmarkCheck className="h-3.5 w-3.5" />
              Bookmarked
            </Button>
            <Button
              size="sm"
              variant={showOnlyTodo ? "default" : "outline"}
              onClick={() => setShowOnlyTodo((v) => !v)}
              className="h-7 gap-1.5 text-xs"
            >
              <Circle className="h-3.5 w-3.5" />
              To do
            </Button>

            <div className="ml-auto flex items-center gap-1">
              <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mr-1">
                Sort
              </span>
              {(
                [
                  { id: "default", label: "Default", icon: ArrowDownAZ },
                  { id: "progress_desc", label: "Highest progress", icon: TrendingDown },
                  { id: "progress_asc", label: "Lowest progress", icon: TrendingDown },
                ] as const
              ).map((s) => {
                const active = sortMode === s.id;
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSortMode(s.id)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border transition-colors",
                      active
                        ? "border-sky-500/50 bg-sky-500/15 text-sky-300"
                        : "border-border/40 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border",
                    )}
                  >
                    <Icon className={cn("h-3 w-3", s.id === "progress_asc" && "rotate-180")} />
                    {s.label}
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                className="h-7 gap-1 text-xs text-muted-foreground"
              >
                <XIcon className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable pattern list */}
      <div className="px-4 md:px-6 py-5 space-y-6">
        <PatternAchievementsPanel done={done} history={history} />

        {displayed.map((cat, ci) => (
          <section key={cat.id} id={`pat-${cat.id}`} className="space-y-3 scroll-mt-[260px]">
            <div className="flex items-end justify-between flex-wrap gap-2 pt-1">
              <div>
                <h3 className="flex items-center gap-2 text-lg md:text-xl font-bold">
                  <span className="text-2xl leading-none">{cat.emoji}</span>
                  {cat.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{cat.subtitle}</p>
              </div>
              {(() => {
                const s = categoryStats.get(cat.id);
                return (
                  <div className="flex items-center gap-2 min-w-[180px]">
                    {s && (
                      <>
                        <Progress
                          value={s.pct}
                          className="h-1.5 w-24 bg-muted/40"
                          indicatorClassName={cn(
                            s.pct === 100
                              ? "bg-emerald-500"
                              : s.pct >= 50
                                ? "bg-sky-400"
                                : s.pct > 0
                                  ? "bg-amber-400"
                                  : "bg-muted-foreground/30",
                          )}
                        />
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {s.done}/{s.total} • {s.pct}%
                        </span>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {cat.patterns.map((p, idx) => {
                const isBookmarked = bookmarks.has(p.id);
                const isDone = done.has(p.id);
                return (
                  <motion.article
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx, 5) * 0.03 + ci * 0.02 }}
                    className={cn(
                      "group rounded-xl border p-4 transition-all cursor-pointer",
                      isDone
                        ? "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10"
                        : "border-border/40 bg-card/40 hover:border-emerald-500/40 hover:bg-card/60",
                    )}
                    onClick={() => setOpenPattern(p)}
                  >
                    <header className="flex items-start gap-3 mb-2">
                      <span
                        aria-hidden
                        className="grid place-items-center h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xl shrink-0"
                      >
                        {p.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-base leading-tight flex items-center gap-2">
                          {p.title}
                          {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark pattern"}
                          aria-pressed={isBookmarked}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(p.id);
                          }}
                          className={cn(
                            "h-7 w-7 grid place-items-center rounded-md border transition-colors",
                            isBookmarked
                              ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                              : "border-border/40 text-muted-foreground hover:text-amber-300 hover:border-amber-500/40",
                          )}
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="h-3.5 w-3.5" />
                          ) : (
                            <Bookmark className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label={isDone ? "Mark as not done" : "Mark as done"}
                          aria-pressed={isDone}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDone(p.id);
                          }}
                          className={cn(
                            "h-7 w-7 grid place-items-center rounded-md border transition-colors",
                            isDone
                              ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                              : "border-border/40 text-muted-foreground hover:text-emerald-300 hover:border-emerald-500/40",
                          )}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </header>

                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {p.tags.map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="text-[10px] h-5 px-1.5 border-border/50 text-muted-foreground"
                        >
                          {t}
                        </Badge>
                      ))}
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-sky-500/30 bg-sky-500/10 text-sky-300">
                        {p.complexity}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-3">
                      {p.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                      {p.problems.slice(0, 3).map((pr) => (
                        <a
                          key={pr.id + pr.url}
                          href={pr.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition-colors hover:opacity-90",
                            diffStyles[pr.difficulty],
                          )}
                          title={`${pr.title} — ${pr.difficulty}`}
                        >
                          <span className="font-mono opacity-70">{pr.id}</span>
                          <span className="font-medium truncate max-w-[10rem]">{pr.title}</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      ))}
                      {p.problems.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] border border-border/40 text-muted-foreground">
                          +{p.problems.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400/80 group-hover:text-emerald-300">
                        Open details <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </section>
        ))}

        {displayed.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/40 bg-card/20 p-10 text-center text-muted-foreground">
            No patterns match your filters.
            <div className="mt-3">
              <Button size="sm" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <PatternDetailDialog
        pattern={openPattern}
        onClose={() => setOpenPattern(null)}
        bookmarks={bookmarks}
        done={done}
        onToggleBookmark={toggleBookmark}
        onToggleDone={toggleDone}
      />
    </div>
  );
}

interface DetailProps {
  pattern: CommonPattern | null;
  onClose: () => void;
  bookmarks: Set<string>;
  done: Set<string>;
  onToggleBookmark: (id: string) => void;
  onToggleDone: (id: string) => void;
}

function PatternDetailDialog({
  pattern,
  onClose,
  bookmarks,
  done,
  onToggleBookmark,
  onToggleDone,
}: DetailProps) {
  const open = pattern !== null;
  const isBookmarked = pattern ? bookmarks.has(pattern.id) : false;
  const isDone = pattern ? done.has(pattern.id) : false;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {pattern && (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="grid place-items-center h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-2xl shrink-0"
                >
                  {pattern.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
                    {pattern.title}
                    {isDone && (
                      <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-sm">{pattern.subtitle}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {pattern.tags.map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="text-[10px] h-5 px-1.5 border-border/50 text-muted-foreground"
                  >
                    {t}
                  </Badge>
                ))}
                <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-sky-500/30 bg-sky-500/10 text-sky-300">
                  {pattern.complexity}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isBookmarked ? "default" : "outline"}
                  onClick={() => onToggleBookmark(pattern.id)}
                  className="gap-1.5"
                >
                  {isBookmarked ? (
                    <>
                      <BookmarkCheck className="h-4 w-4" /> Bookmarked
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" /> Bookmark
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant={isDone ? "default" : "outline"}
                  onClick={() => onToggleDone(pattern.id)}
                  className="gap-1.5"
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Marked done
                    </>
                  ) : (
                    <>
                      <Circle className="h-4 w-4" /> Mark done
                    </>
                  )}
                </Button>
              </div>

              <section>
                <h4 className="text-sm font-semibold text-emerald-400 mb-1.5">How it works</h4>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {pattern.description}
                </p>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-emerald-400 mb-2">
                  LeetCode problems ({pattern.problems.length})
                </h4>
                <ul className="space-y-1.5">
                  {pattern.problems.map((pr) => (
                    <li key={pr.id + pr.url}>
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center justify-between gap-2 px-3 py-2 rounded-md border transition-colors hover:opacity-90",
                          diffStyles[pr.difficulty],
                        )}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs opacity-70">{pr.id}</span>
                          <span className="font-medium text-sm truncate">{pr.title}</span>
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className="text-[10px] border-current/30 bg-transparent"
                          >
                            {pr.difficulty}
                          </Badge>
                          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
