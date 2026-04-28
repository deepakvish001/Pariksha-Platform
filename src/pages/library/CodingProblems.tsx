import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  CircleDot,
  Code2,
  Filter,
  Star,
  ChevronLeft,
  ChevronRight,
  Share2,
  CheckSquare,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CODING_PROBLEMS,
  ALL_TOPICS,
  type Difficulty,
} from "@/data/codingProblemsData";
import { useCodingAttemptStats } from "@/hooks/useCodingAttemptStats";
import { useCodingProblemBookmarks } from "@/hooks/useCodingProblemBookmarks";
import { ProblemStatsHeader } from "@/components/library/coding/ProblemStatsHeader";
import { ProblemFiltersBar, type SortKey, type ViewMode } from "@/components/library/coding/ProblemFiltersBar";
import { ProblemCard } from "@/components/library/coding/ProblemCard";
import { RandomMenu } from "@/components/library/coding/RandomMenu";
import { BulkActionsBar } from "@/components/library/coding/BulkActionsBar";
import { useCodingSelection } from "@/hooks/useCodingSelection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const difficultyClass = (d: Difficulty) =>
  d === "Easy"
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : d === "Medium"
      ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
      : "text-rose-500 bg-rose-500/10 border-rose-500/20";

const DIFF_ORDER: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 };

const CodingProblems = () => {
  const [params, setParams] = useSearchParams();

  // Read URL state with sensible defaults
  const search = params.get("q") ?? "";
  const difficulty = params.get("diff") ?? "all";
  const selectedTopics = (params.get("topics") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const status = params.get("status") ?? "all";
  const sort = (params.get("sort") as SortKey) || "default";
  const view = (params.get("view") as ViewMode) || "table";
  const bookmarked = params.get("bm") === "1";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  // Persist & restore scroll position + page for /library/problems so refresh
  // returns the user to the same spot.
  const SCROLL_KEY = "byteskill:coding-problems-scroll";
  const PAGE_KEY = "byteskill:coding-problems-last-page";

  // On first mount: if URL has no ?page=, hydrate from last-page memory.
  useEffect(() => {
    try {
      if (!params.get("page")) {
        const saved = localStorage.getItem(PAGE_KEY);
        const n = saved ? parseInt(saved, 10) : NaN;
        if (Number.isFinite(n) && n > 1) {
          const next = new URLSearchParams(params);
          next.set("page", String(n));
          setParams(next, { replace: true });
        }
      }
    } catch {
      /* ignore */
    }
    // Restore scroll on next frame so layout has settled.
    try {
      const y = parseInt(sessionStorage.getItem(SCROLL_KEY) ?? "", 10);
      if (Number.isFinite(y) && y > 0) {
        requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "auto" }));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save current page whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(PAGE_KEY, String(page));
    } catch {
      /* ignore */
    }
  }, [page]);

  // Save scroll position (throttled via rAF) and on unload.
  useEffect(() => {
    let ticking = false;
    const save = () => {
      try {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      } catch {
        /* ignore */
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(save);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", save);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", save);
      save();
    };
  }, []);

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      const isDefaultView = k === "view" && v === "table";
      if (
        v === null ||
        v === "" ||
        v === "all" ||
        v === "default" ||
        isDefaultView ||
        (k === "page" && v === "1")
      ) {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    }
    setParams(next, { replace: true });
  };

  const setSearch = (v: string) => updateParams({ q: v, page: "1" });
  const setDifficulty = (v: string) => updateParams({ diff: v, page: "1" });
  const setStatus = (v: string) => updateParams({ status: v, page: "1" });
  const setSort = (v: SortKey) => updateParams({ sort: v, page: "1" });
  const setView = (v: ViewMode) => updateParams({ view: v });
  const setBookmarked = (v: boolean) => updateParams({ bm: v ? "1" : null, page: "1" });
  const setPage = (n: number) => updateParams({ page: String(n) });

  const toggleTopic = (t: string) => {
    const set = new Set(selectedTopics);
    if (set.has(t)) set.delete(t);
    else set.add(t);
    updateParams({ topics: Array.from(set).join(","), page: "1" });
  };

  const clearAll = () => {
    setParams(new URLSearchParams(), { replace: true });
    toast.success("Filters cleared", {
      description: "Search, difficulty, topics, status, sort, and bookmarks reset.",
    });
  };

  const { solved, attempted, perProblem, loading } = useCodingAttemptStats();
  const { bookmarks, toggle: toggleBookmark, isBookmarked } = useCodingProblemBookmarks();

  // Persisted selection (bulk actions) — survives refresh and pagination
  const {
    selectionMode,
    setSelectionMode,
    selected,
    toggleSelected,
    addMany,
    clearSelection,
    exitSelection,
  } = useCodingSelection();

  const [confirmUnbookmark, setConfirmUnbookmark] = useState(false);

  // Build a fully-encoded shareable URL from current params (not raw window URL)
  const buildShareUrl = () => {
    const next = new URLSearchParams();
    if (search.trim()) next.set("q", search.trim());
    if (difficulty !== "all") next.set("diff", difficulty);
    if (selectedTopics.length > 0) next.set("topics", selectedTopics.join(","));
    if (status !== "all") next.set("status", status);
    if (sort !== "default") next.set("sort", sort);
    if (view !== "table") next.set("view", view);
    if (bookmarked) next.set("bm", "1");
    if (page > 1) next.set("page", String(page));
    const qs = next.toString();
    const { origin, pathname } = window.location;
    return qs ? `${origin}${pathname}?${qs}` : `${origin}${pathname}`;
  };

  const handleShareFilters = async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", {
        description: "Shareable URL with current filters copied to clipboard.",
      });
    } catch {
      toast.error("Couldn't copy link", { description: url });
    }
  };

  // Filter
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = CODING_PROBLEMS.filter((p) => {
      if (q) {
        const hay = `${p.title} ${p.slug} ${p.topics.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (difficulty !== "all" && p.difficulty !== difficulty) return false;
      if (selectedTopics.length > 0 && !selectedTopics.every((t) => p.topics.includes(t))) return false;
      if (status === "solved" && !solved.has(p.slug)) return false;
      if (status === "attempted" && (!attempted.has(p.slug) || solved.has(p.slug))) return false;
      if (status === "todo" && attempted.has(p.slug)) return false;
      if (bookmarked && !bookmarks.has(p.slug)) return false;
      return true;
    });

    // Sort
    if (sort === "title") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "diff-asc") {
      list = [...list].sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]);
    } else if (sort === "diff-desc") {
      list = [...list].sort((a, b) => DIFF_ORDER[b.difficulty] - DIFF_ORDER[a.difficulty]);
    } else if (sort === "recent") {
      list = [...list].sort((a, b) => {
        const la = perProblem.get(a.slug)?.lastAttempt ?? "";
        const lb = perProblem.get(b.slug)?.lastAttempt ?? "";
        return lb.localeCompare(la);
      });
    }
    return list;
  }, [
    debouncedSearch,
    difficulty,
    selectedTopics.join(","),
    status,
    sort,
    bookmarked,
    bookmarks,
    solved,
    attempted,
    perProblem,
  ]);

  // Pagination
  const PAGE_SIZE = view === "grid" ? 24 : 50;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Stats
  const counts = useMemo(() => {
    const total = CODING_PROBLEMS.length;
    const easy = CODING_PROBLEMS.filter((p) => p.difficulty === "Easy").length;
    const medium = CODING_PROBLEMS.filter((p) => p.difficulty === "Medium").length;
    const hard = CODING_PROBLEMS.filter((p) => p.difficulty === "Hard").length;
    const inSet = (d: Difficulty) =>
      CODING_PROBLEMS.filter((p) => p.difficulty === d && solved.has(p.slug)).length;
    return {
      total,
      easy,
      medium,
      hard,
      solvedEasy: inSet("Easy"),
      solvedMedium: inSet("Medium"),
      solvedHard: inSet("Hard"),
    };
  }, [solved]);

  const { weekSolved, prevWeekSolved } = useMemo(() => {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    let w = 0;
    let pw = 0;
    perProblem.forEach((s) => {
      if (!s.solvedAt) return;
      const t = new Date(s.solvedAt).getTime();
      if (now - t < week) w += 1;
      else if (now - t < 2 * week) pw += 1;
    });
    return { weekSolved: w, prevWeekSolved: pw };
  }, [perProblem]);

  const continueProblem = useMemo(() => {
    let best: { slug: string; t: string } | null = null;
    perProblem.forEach((s, slug) => {
      if (solved.has(slug)) return;
      if (!s.lastAttempt) return;
      if (!best || s.lastAttempt > best.t) best = { slug, t: s.lastAttempt };
    });
    return best ? CODING_PROBLEMS.find((p) => p.slug === best!.slug) : undefined;
  }, [perProblem, solved]);

  const activeFilterCount =
    (debouncedSearch ? 1 : 0) +
    (difficulty !== "all" ? 1 : 0) +
    (status !== "all" ? 1 : 0) +
    (sort !== "default" ? 1 : 0) +
    (bookmarked ? 1 : 0) +
    selectedTopics.length;

  // Bulk action handlers
  const selectAllVisible = () => {
    addMany(pageSlice.map((p) => p.slug));
  };
  const bulkBookmark = () => {
    let added = 0;
    selected.forEach((slug) => {
      if (!isBookmarked(slug)) {
        toggleBookmark(slug);
        added += 1;
      }
    });
    toast.success(`Bookmarked ${added} ${added === 1 ? "problem" : "problems"}`);
    clearSelection();
  };
  const performBulkUnbookmark = () => {
    const removedSlugs: string[] = [];
    selected.forEach((slug) => {
      if (isBookmarked(slug)) {
        toggleBookmark(slug);
        removedSlugs.push(slug);
      }
    });
    const removed = removedSlugs.length;
    clearSelection();
    setConfirmUnbookmark(false);

    toast.success(`Removed ${removed} ${removed === 1 ? "bookmark" : "bookmarks"}`, {
      duration: 8000,
      action: removed > 0
        ? {
            label: "Undo",
            onClick: () => {
              removedSlugs.forEach((slug) => {
                if (!isBookmarked(slug)) toggleBookmark(slug);
              });
              toast.success(
                `Restored ${removed} ${removed === 1 ? "bookmark" : "bookmarks"}`,
              );
            },
          }
        : undefined,
    });
  };
  const bulkUnbookmark = () => {
    // Count how many are actually bookmarked to decide whether to confirm
    let count = 0;
    selected.forEach((slug) => {
      if (isBookmarked(slug)) count += 1;
    });
    if (count === 0) {
      toast.info("None of the selected problems are bookmarked.");
      return;
    }
    setConfirmUnbookmark(true);
  };
  const unbookmarkCount = (() => {
    let c = 0;
    selected.forEach((slug) => {
      if (isBookmarked(slug)) c += 1;
    });
    return c;
  })();

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
      <Helmet>
        <title>Coding Problems — Practice with Real-Time Code Execution | Byteskill</title>
        <meta
          name="description"
          content="Solve LeetCode-style coding problems in Python, C++, Java, JavaScript, TypeScript, C, and Go with real code execution and submission tracking."
        />
      </Helmet>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-wrap items-start justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Code2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Coding Problems</h1>
            <p className="text-sm text-muted-foreground">
              Solve, run, and submit with real code execution
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleShareFilters} className="gap-1.5 h-9">
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share filters</span>
          </Button>
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            onClick={() => (selectionMode ? exitSelection() : setSelectionMode(true))}
            className="gap-1.5 h-9"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {selectionMode ? "Done" : "Select"}
          </Button>
          <RandomMenu filtered={filtered} />
        </div>
      </motion.div>

      {/* Stats */}
      <ProblemStatsHeader
        counts={counts}
        totalSolved={solved.size}
        weekSolved={weekSolved}
        prevWeekSolved={prevWeekSolved}
        continueProblem={continueProblem}
      />

      {/* Filters */}
      <Card className="p-4 mb-4 sticky top-2 z-10 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <ProblemFiltersBar
          search={search}
          onSearch={setSearch}
          difficulty={difficulty}
          onDifficulty={setDifficulty}
          topics={ALL_TOPICS}
          selectedTopics={selectedTopics}
          onToggleTopic={toggleTopic}
          onClearTopics={() => updateParams({ topics: null, page: "1" })}
          status={status}
          onStatus={setStatus}
          sort={sort}
          onSort={setSort}
          view={view}
          onView={setView}
          bookmarked={bookmarked}
          onBookmarked={setBookmarked}
          activeCount={activeFilterCount}
          onClearAll={clearAll}
        />
      </Card>

      {/* Bulk actions */}
      {selectionMode && (
        <BulkActionsBar
          selectedCount={selected.size}
          onSelectAllVisible={selectAllVisible}
          onBookmarkSelected={bulkBookmark}
          onUnbookmarkSelected={bulkUnbookmark}
          onClearSelection={clearSelection}
        />
      )}

      {/* Result meta */}
      <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
        <span>
          Showing <span className="text-foreground font-medium">{pageSlice.length}</span> of{" "}
          <span className="text-foreground font-medium">{filtered.length}</span> problems
        </span>
        {totalPages > 1 && (
          <span>
            Page {safePage} / {totalPages}
          </span>
        )}
      </div>

      {/* Body */}
      {loading && filtered.length === 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <Card>
            <div className="p-3 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </Card>
        )
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Filter className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-base font-medium">No problems match your filters</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Try removing a filter or clearing all to start over.
          </p>
          <Button variant="outline" onClick={clearAll}>
            Reset filters
          </Button>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {pageSlice.map((p, idx) => (
            <ProblemCard
              key={p.slug}
              problem={p}
              isSolved={solved.has(p.slug)}
              isAttempted={attempted.has(p.slug)}
              isBookmarked={isBookmarked(p.slug)}
              stats={perProblem.get(p.slug)}
              onToggleBookmark={toggleBookmark}
              index={idx}
              selectionMode={selectionMode}
              selected={selected.has(p.slug)}
              onToggleSelected={toggleSelected}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {selectionMode && <TableHead className="w-[40px]"></TableHead>}
                <TableHead className="w-[50px]">Status</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Topics</TableHead>
                <TableHead className="w-[110px]">Difficulty</TableHead>
                <TableHead className="hidden sm:table-cell w-[100px] text-right">Attempts</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageSlice.map((p) => {
                const isSolved = solved.has(p.slug);
                const isAttempted = attempted.has(p.slug);
                const stats = perProblem.get(p.slug);
                const bm = isBookmarked(p.slug);
                return (
                  <TableRow key={p.slug} className="group" data-selected={selected.has(p.slug)}>
                    {selectionMode && (
                      <TableCell>
                        <Checkbox
                          checked={selected.has(p.slug)}
                          onCheckedChange={() => toggleSelected(p.slug)}
                          aria-label="Select problem"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      {isSolved ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : isAttempted ? (
                        <CircleDot className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/library/problems/${p.slug}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {p.title}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.topics.slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs font-normal">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", difficultyClass(p.difficulty))}>
                        {p.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right text-xs text-muted-foreground">
                      {stats?.attempts ?? 0}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => toggleBookmark(p.slug)}
                        className="p-1 rounded hover:bg-muted/50"
                        aria-label={bm ? "Remove bookmark" : "Bookmark"}
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            bm
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/40 hover:text-amber-400",
                          )}
                        />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            {safePage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <AlertDialog open={confirmUnbookmark} onOpenChange={setConfirmUnbookmark}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove bookmarks?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove bookmarks from{" "}
              <span className="font-semibold text-foreground">{unbookmarkCount}</span>{" "}
              {unbookmarkCount === 1 ? "problem" : "problems"}. You can re-bookmark them
              individually later, but this can't be undone in bulk.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performBulkUnbookmark}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove {unbookmarkCount}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CodingProblems;
