import { useEffect, useMemo, useRef, useState } from "react";
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
  Columns3,
  RotateCcw,
  Keyboard,
  Rows3,
  Rows2,
  Focus,
  Trophy,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CODING_PROBLEMS,
  ALL_TOPICS,
  type Difficulty,
} from "@/data/codingProblemsData";
import { useDbCodingProblems } from "@/hooks/useCodingProblems";
import { useCodingAttemptStats } from "@/hooks/useCodingAttemptStats";
import { useCodingProblemBookmarks } from "@/hooks/useCodingProblemBookmarks";
import { ProblemStatsHeader } from "@/components/library/coding/ProblemStatsHeader";
import { ProblemFiltersBar, type SortKey, type ViewMode } from "@/components/library/coding/ProblemFiltersBar";

import { RandomMenu } from "@/components/library/coding/RandomMenu";
import { BulkActionsBar } from "@/components/library/coding/BulkActionsBar";
import { TopicBadgesWithOverflow } from "@/components/library/coding/TopicBadgesWithOverflow";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PROBLEM_COLUMNS,
  useCodingProblemsTablePrefs,
  type ProblemColumnId,
} from "@/hooks/useCodingProblemsTablePrefs";
import {
  SortableResizableHeader,
  type SortDir,
} from "@/components/library/coding/SortableResizableHeader";
import {
  RecommendationStrip,
  ShowRecommendationsChip,
} from "@/components/library/coding/RecommendationStrip";
import { TopicMasteryChips } from "@/components/library/coding/TopicMasteryChips";
import { SavedFiltersMenu } from "@/components/library/coding/SavedFiltersMenu";
import { ShortcutsCheatSheet } from "@/components/library/coding/ShortcutsCheatSheet";
import { useSavedFilterPresets } from "@/hooks/useSavedFilterPresets";
import { useListingFocusMode } from "@/hooks/useListingFocusMode";
import { useDailyChallenge } from "@/hooks/useDailyChallenge";
import { DailyChallengeCard } from "@/components/library/coding/DailyChallengeCard";
import { DailyChallengeCelebration } from "@/components/library/coding/DailyChallengeCelebration";
import { WeeklyReviewInline } from "@/components/library/coding/WeeklyReviewInline";
import { SmartFilterChips, type SmartChip } from "@/components/library/coding/SmartFilterChips";
import { TopicProgressRing } from "@/components/library/coding/TopicProgressRing";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  // Grid mode has been retired — table is the only valid view.
  const view: ViewMode = "table";
  const bookmarked = params.get("bm") === "1";
  const rawPage = params.get("page");
  const parsedPage = rawPage !== null ? parseInt(rawPage, 10) : NaN;
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  // Persist & restore scroll position + page for /library/problems so refresh
  // returns the user to the same spot.
  const SCROLL_KEY = "parikshaa:coding-problems-scroll";
  const PAGE_KEY = "parikshaa:coding-problems-last-page";

  // Tracks whether the user has actively changed filters/page in this session
  // (vs. the initial mount restoring previous state). Used so a fresh refresh
  // restores scroll, but applying a filter / paginating jumps to the top.
  const userInteractedRef = useRef(false);
  // Forward-ref so the mount-only effect (declared above tablePrefs) can read
  // the saved per-list sort without re-running.
  const tablePrefsRef = useRef<ReturnType<typeof useCodingProblemsTablePrefs> | null>(null);
  const filterSig = `${search}|${difficulty}|${selectedTopics.join(",")}|${status}|${sort}|${bookmarked ? 1 : 0}|${page}`;

  // On first mount: validate URL params (strip invalid view/page) and hydrate
  // last page + scroll + saved sort from storage.
  useEffect(() => {
    try {
      const next = new URLSearchParams(params);
      let dirty = false;

      // Strip invalid view (only "table" is valid now; "grid" was retired)
      if (next.has("view")) {
        next.delete("view");
        dirty = true;
      }

      // Validate page: must be a positive integer string
      if (next.has("page")) {
        const raw = next.get("page");
        const n = raw !== null ? parseInt(raw, 10) : NaN;
        if (!Number.isFinite(n) || n < 1 || String(n) !== raw) {
          next.delete("page");
          dirty = true;
        }
      }

      // If no ?page=, hydrate from last-page memory.
      if (!next.has("page")) {
        const saved = localStorage.getItem(PAGE_KEY);
        const n = saved ? parseInt(saved, 10) : NaN;
        if (Number.isFinite(n) && n > 1) {
          next.set("page", String(n));
          dirty = true;
        }
      }

      // If no ?sort=, hydrate from saved per-list sort (3-state)
      if (!next.has("sort")) {
        const savedSort = tablePrefsRef.current?.getSavedSort("__list__");
        if (savedSort && savedSort !== "default") {
          next.set("sort", savedSort);
          dirty = true;
        }
      }

      if (dirty) setParams(next, { replace: true });
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

  // After the user changes any filter or paginates, jump back to the top so
  // they always see the first results — but only after the initial mount, so
  // a refresh still restores their previous scroll position.
  useEffect(() => {
    if (!userInteractedRef.current) {
      userInteractedRef.current = true;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSig]);

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
  // setSort is defined further below — it needs access to tablePrefs for undo.
  const setView = (v: ViewMode) => updateParams({ view: v });

  // Persisted column visibility & widths (responsive — survives refresh).
  const tablePrefs = useCodingProblemsTablePrefs();
  tablePrefsRef.current = tablePrefs;
  const { focusMode, toggle: toggleFocusMode } = useListingFocusMode();

  // Tracks whether we've finished initial sort hydration so we don't fire
  // a "Sort changed" toast for the URL/localStorage restoration on mount.
  const sortHydratedRef = useRef(false);
  useEffect(() => {
    // Mark hydrated on the next tick after first render commits.
    sortHydratedRef.current = true;
  }, []);

  const setSort = (v: SortKey) => {
    const prev = sort;
    updateParams({ sort: v, page: "1" });
    if (!sortHydratedRef.current) return;
    if (prev === v) return;
    const labelOf = (k: SortKey): string => {
      const map: Partial<Record<SortKey, string>> = {
        default: "Default",
        title: "Title (A→Z)",
        recent: "Most recent",
        "diff-asc": "Difficulty (Easy→Hard)",
        "diff-desc": "Difficulty (Hard→Easy)",
        "status-asc": "Status (Solved first)",
        "status-desc": "Status (Todo first)",
        "accept-asc": "Acceptance (Low→High)",
        "accept-desc": "Acceptance (High→Low)",
        "attempts-asc": "Attempts (Low→High)",
        "attempts-desc": "Attempts (High→Low)",
      };
      return map[k] ?? k;
    };
    toast.success(`Sorted by ${labelOf(v)}`, {
      duration: 6000,
      action: {
        label: "Undo",
        onClick: () => updateParams({ sort: prev, page: "1" }),
      },
    });
  };

  // Persist sort (3-state) per list slug whenever it changes.
  useEffect(() => {
    tablePrefs.setSavedSort("__list__", sort);
  }, [sort, tablePrefs]);

  // Map a column id to its current sort direction (asc/desc/null) and a
  // 3-state cycler that updates the existing `sort` URL param.
  type ColumnSortable = "status" | "difficulty" | "acceptance" | "attempts";
  const columnSortKeys: Record<ColumnSortable, [SortKey, SortKey]> = {
    status: ["status-asc", "status-desc"],
    difficulty: ["diff-asc", "diff-desc"],
    acceptance: ["accept-asc", "accept-desc"],
    attempts: ["attempts-asc", "attempts-desc"],
  };
  const dirOf = (col: ColumnSortable): SortDir => {
    const [asc, desc] = columnSortKeys[col];
    if (sort === asc) return "asc";
    if (sort === desc) return "desc";
    return null;
  };
  const cycleColumnSort = (col: ColumnSortable) => {
    const [asc, desc] = columnSortKeys[col];
    if (sort === asc) setSort(desc);
    else if (sort === desc) setSort("default");
    else setSort(asc);
  };
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
  const { data: dbProblems = [] } = useDbCodingProblems();
  // Merge admin-published DB problems with the bundled static array.
  // DB row wins on conflict so admin edits override the static baseline.
  const ALL_PROBLEMS = useMemo(() => {
    const bySlug = new Map<string, (typeof CODING_PROBLEMS)[number]>();
    for (const p of CODING_PROBLEMS) bySlug.set(p.slug, p);
    for (const p of dbProblems) bySlug.set(p.slug, p);
    return Array.from(bySlug.values());
  }, [dbProblems]);
  const daily = useDailyChallenge(solved);
  const { bookmarks, toggle: toggleBookmark, isBookmarked } = useCodingProblemBookmarks();


  // Per-topic stats for the progress ring
  const topicStats = useMemo(() => {
    const totals = new Map<string, number>();
    const solvedMap = new Map<string, number>();
    const attemptedMap = new Map<string, number>();
    for (const p of ALL_PROBLEMS) {
      for (const t of p.topics) {
        totals.set(t, (totals.get(t) ?? 0) + 1);
        if (solved.has(p.slug)) solvedMap.set(t, (solvedMap.get(t) ?? 0) + 1);
        else if (attempted.has(p.slug)) attemptedMap.set(t, (attemptedMap.get(t) ?? 0) + 1);
      }
    }
    return { totals, solvedMap, attemptedMap };
  }, [solved, attempted, ALL_PROBLEMS]);

  // Identify weak topics: solved < 30% (and at least 1 attempt or unsolved problems)
  const weakTopics = useMemo(() => {
    const out: string[] = [];
    for (const [topic, total] of topicStats.totals) {
      const s = topicStats.solvedMap.get(topic) ?? 0;
      if (total >= 3 && s / total < 0.3) out.push(topic);
    }
    return out;
  }, [topicStats]);


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
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  // Saved filter presets (localStorage).
  const { presets, save: savePreset, remove: removePreset, rename: renamePreset } =
    useSavedFilterPresets();
  // Active row index for keyboard navigation (j/k/enter). -1 = none.
  const [activeRowIdx, setActiveRowIdx] = useState<number>(-1);
  const tableRef = useRef<HTMLDivElement | null>(null);

  // Build a fully-encoded shareable URL from current params (not raw window URL)
  const buildShareUrl = () => {
    const next = new URLSearchParams();
    if (search.trim()) next.set("q", search.trim());
    if (difficulty !== "all") next.set("diff", difficulty);
    if (selectedTopics.length > 0) next.set("topics", selectedTopics.join(","));
    if (status !== "all") next.set("status", status);
    if (sort !== "default") next.set("sort", sort);
    // view is always "table" now (grid retired) — no need to encode
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

  // Build only the query string (no origin) for saved presets.
  const buildCurrentQuery = (): string => {
    const next = new URLSearchParams();
    if (search.trim()) next.set("q", search.trim());
    if (difficulty !== "all") next.set("diff", difficulty);
    if (selectedTopics.length > 0) next.set("topics", selectedTopics.join(","));
    if (status !== "all") next.set("status", status);
    if (sort !== "default") next.set("sort", sort);
    if (bookmarked) next.set("bm", "1");
    if (page > 1) next.set("page", String(page));
    return next.toString();
  };

  // Apply a saved preset's query string by replacing current params.
  const applyPresetQuery = (qs: string) => {
    setParams(new URLSearchParams(qs), { replace: true });
  };

  // Show only weak topics: replace selection with the provided list.
  const showOnlyWeakTopics = (weak: string[]) => {
    if (weak.length === 0) return;
    updateParams({ topics: weak.join(","), page: "1" });
    toast.success(`Filtered to ${weak.length} weak topic${weak.length === 1 ? "" : "s"}`, {
      description: "Showing topics where your solve rate is below 50%.",
    });
  };

  // Density toggle (compact ↔ comfortable)
  const toggleDensity = () => {
    const next = tablePrefs.density === "compact" ? "comfortable" : "compact";
    tablePrefs.setDensity(next);
    toast.success(`Density: ${next}`);
  };

  // Padding helper for cells based on density
  const cellPadY = tablePrefs.density === "compact" ? "py-1.5" : "py-2.5";
  const rowTextSize = tablePrefs.density === "compact" ? "text-xs" : "text-sm";

  // Keyboard shortcuts: /, b, d, s, ?, Esc, ←, →
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editable =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable;

      // "/" focuses the search even when not editable
      if (e.key === "/" && !editable) {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Search" i], input[type="search"]',
        );
        el?.focus();
        el?.select();
        return;
      }

      if (e.key === "?" && !editable) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (e.key === "Escape") {
        if (selectionMode) {
          exitSelection();
        }
        return;
      }

      if (editable) return;

      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setBookmarked(!bookmarked);
        return;
      }
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        toggleDensity();
        return;
      }
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        if (selectionMode) exitSelection();
        else setSelectionMode(true);
        return;
      }
      if (e.key === "ArrowLeft" && safePageRef.current > 1) {
        e.preventDefault();
        setPage(safePageRef.current - 1);
        return;
      }
      if (e.key === "ArrowRight" && safePageRef.current < totalPagesRef.current) {
        e.preventDefault();
        setPage(safePageRef.current + 1);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarked, selectionMode, tablePrefs.density]);

  // Refs to keep keyboard handler closure-free for paging.
  const safePageRef = useRef(1);
  const totalPagesRef = useRef(1);

  // Filter
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = ALL_PROBLEMS.filter((p) => {
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
    const acceptanceOf = (slug: string) => {
      const s = perProblem.get(slug);
      if (!s || s.attempts === 0) return -1; // unattempted sorts to bottom for asc
      return Math.round(((s.accepted ?? 0) / s.attempts) * 100);
    };
    const statusRank = (slug: string) => {
      // Solved (0) → Attempted (1) → Not started (2)
      if (solved.has(slug)) return 0;
      if (attempted.has(slug)) return 1;
      return 2;
    };
    const attemptsOf = (slug: string) => perProblem.get(slug)?.attempts ?? 0;

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
    } else if (sort === "status-asc") {
      list = [...list].sort((a, b) => statusRank(a.slug) - statusRank(b.slug));
    } else if (sort === "status-desc") {
      list = [...list].sort((a, b) => statusRank(b.slug) - statusRank(a.slug));
    } else if (sort === "accept-asc") {
      list = [...list].sort((a, b) => acceptanceOf(a.slug) - acceptanceOf(b.slug));
    } else if (sort === "accept-desc") {
      list = [...list].sort((a, b) => acceptanceOf(b.slug) - acceptanceOf(a.slug));
    } else if (sort === "attempts-asc") {
      list = [...list].sort((a, b) => attemptsOf(a.slug) - attemptsOf(b.slug));
    } else if (sort === "attempts-desc") {
      list = [...list].sort((a, b) => attemptsOf(b.slug) - attemptsOf(a.slug));
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
    ALL_PROBLEMS,
  ]);

  // Pagination
  const PAGE_SIZE = 50;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Keep refs in sync for the keyboard ←/→ pagination shortcut.
  useEffect(() => {
    safePageRef.current = safePage;
    totalPagesRef.current = totalPages;
  }, [safePage, totalPages]);

  // Stats
  const counts = useMemo(() => {
    const total = ALL_PROBLEMS.length;
    const easy = ALL_PROBLEMS.filter((p) => p.difficulty === "Easy").length;
    const medium = ALL_PROBLEMS.filter((p) => p.difficulty === "Medium").length;
    const hard = ALL_PROBLEMS.filter((p) => p.difficulty === "Hard").length;
    const inSet = (d: Difficulty) =>
      ALL_PROBLEMS.filter((p) => p.difficulty === d && solved.has(p.slug)).length;
    return {
      total,
      easy,
      medium,
      hard,
      solvedEasy: inSet("Easy"),
      solvedMedium: inSet("Medium"),
      solvedHard: inSet("Hard"),
    };
  }, [solved, ALL_PROBLEMS]);

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
    return best ? ALL_PROBLEMS.find((p) => p.slug === best!.slug) : undefined;
  }, [perProblem, solved, ALL_PROBLEMS]);

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
        <title>Coding Problems — Practice with Real-Time Code Execution | Parikshaa</title>
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
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={focusMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleFocusMode}
                  className="gap-1.5 h-9"
                  aria-pressed={focusMode}
                >
                  <Focus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {focusMode ? "Focus on" : "Focus"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {focusMode
                  ? "Show recommendations, stats, and topic mastery again."
                  : "Hide ancillary panels and concentrate on the table."}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button asChild variant="outline" size="sm" className="gap-1.5 h-9">
            <Link to="/library/problems/leaderboard">
              <Trophy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Leaderboard</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleShareFilters} className="gap-1.5 h-9">
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share filters</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-9"
                title="Show or hide table columns"
              >
                <Columns3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PROBLEM_COLUMNS.filter((c) => c.togglable).map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={tablePrefs.isVisible(c.id)}
                  onCheckedChange={() => tablePrefs.toggleVisible(c.id)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Row density</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={tablePrefs.density === "comfortable"}
                onCheckedChange={() => tablePrefs.setDensity("comfortable")}
                onSelect={(e) => e.preventDefault()}
              >
                <Rows3 className="h-3.5 w-3.5 mr-2" />
                Comfortable
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={tablePrefs.density === "compact"}
                onCheckedChange={() => tablePrefs.setDensity("compact")}
                onSelect={(e) => e.preventDefault()}
              >
                <Rows2 className="h-3.5 w-3.5 mr-2" />
                Compact
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  // Snapshot in-memory prefs so Undo can restore directly into
                  // table state — no page reload needed.
                  const snap = tablePrefs.snapshot();
                  tablePrefs.resetAll();
                  toast.success("Columns reset", {
                    description: "Visibility and widths restored to defaults.",
                    duration: 8000,
                    action: {
                      label: "Undo",
                      onClick: () => {
                        tablePrefs.restoreSnapshot(snap);
                        toast.success("Columns restored", {
                          description: "Your previous visibility and widths are back.",
                        });
                      },
                    },
                  });
                }}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-2" />
                Reset columns & widths
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <SavedFiltersMenu
            presets={presets}
            buildCurrentQuery={buildCurrentQuery}
            onApply={applyPresetQuery}
            onSave={savePreset}
            onRemove={removePreset}
            onRename={renamePreset}
          />
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleDensity}
                  className="gap-1.5 h-9"
                  aria-label="Toggle row density"
                >
                  {tablePrefs.density === "compact" ? (
                    <Rows3 className="h-3.5 w-3.5" />
                  ) : (
                    <Rows2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {tablePrefs.density === "compact" ? "Comfortable rows" : "Compact rows"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShortcutsOpen(true)}
                  className="gap-1.5 h-9"
                  aria-label="Keyboard shortcuts"
                >
                  <Keyboard className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Keyboard shortcuts (?)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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

      {/* Daily Challenge */}
      {!focusMode && <DailyChallengeCard daily={daily} />}

      {/* Weekly summary + topic progress ring */}
      {!focusMode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <WeeklyReviewInline
            completedDates={new Set(daily.recentCompletions.map((c) => c.date))}
            className="mb-0"
          />
          <TopicProgressRing
            topics={ALL_TOPICS}
            totalsByTopic={topicStats.totals}
            solvedByTopic={topicStats.solvedMap}
            attemptedByTopic={topicStats.attemptedMap}
            streak={daily.streak}
          />
        </div>
      )}

      {/* Smart recommendations */}
      {!focusMode && (
        <>
          <ShowRecommendationsChip dismissedKey="library-problems" />
          <RecommendationStrip
            stats={{ solved, attempted, perProblem, loading }}
            bookmarks={bookmarks}
            dismissedKey="library-problems"
          />
        </>
      )}

      {/* Stats */}
      {!focusMode && (
        <ProblemStatsHeader
          counts={counts}
          totalSolved={solved.size}
          weekSolved={weekSolved}
          prevWeekSolved={prevWeekSolved}
          continueProblem={continueProblem}
          loading={loading}
        />
      )}

      {/* Filters */}
      <Card className="p-4 mb-4 sticky top-2 z-10 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Filters
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShareFilters}
            className="gap-1.5 h-7 px-2 text-xs"
            title="Copy a shareable link with the current search, topics, status, sort, view, and page"
          >
            <Link2 className="h-3.5 w-3.5" />
            Copy shareable link
          </Button>
        </div>
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
        {!focusMode && (
          <div className="mt-3 pt-3 border-t border-border/60 space-y-3">
            {(() => {
              const chips: SmartChip[] = [
                {
                  key: "todo",
                  label: "Not started",
                  active: status === "todo",
                  tone: "default",
                  onClick: () => setStatus(status === "todo" ? "all" : "todo"),
                },
                {
                  key: "attempted",
                  label: "Attempted",
                  active: status === "attempted",
                  tone: "amber",
                  onClick: () => setStatus(status === "attempted" ? "all" : "attempted"),
                },
                {
                  key: "solved",
                  label: "Solved",
                  active: status === "solved",
                  tone: "emerald",
                  onClick: () => setStatus(status === "solved" ? "all" : "solved"),
                },
                {
                  key: "easy",
                  label: "Easy",
                  active: difficulty === "Easy",
                  tone: "emerald",
                  onClick: () => setDifficulty(difficulty === "Easy" ? "all" : "Easy"),
                },
                {
                  key: "medium",
                  label: "Medium",
                  active: difficulty === "Medium",
                  tone: "amber",
                  onClick: () => setDifficulty(difficulty === "Medium" ? "all" : "Medium"),
                },
                {
                  key: "hard",
                  label: "Hard",
                  active: difficulty === "Hard",
                  tone: "rose",
                  onClick: () => setDifficulty(difficulty === "Hard" ? "all" : "Hard"),
                },
                {
                  key: "weak",
                  label: "Weak topics",
                  count: weakTopics.length,
                  active:
                    weakTopics.length > 0 &&
                    selectedTopics.length > 0 &&
                    selectedTopics.every((t) => weakTopics.includes(t)),
                  tone: "rose",
                  onClick: () => showOnlyWeakTopics(weakTopics),
                },
                {
                  key: "bookmarked",
                  label: "Bookmarked",
                  count: bookmarks.size,
                  active: bookmarked,
                  tone: "primary",
                  onClick: () => setBookmarked(!bookmarked),
                },
              ];
              const activeChips = chips.filter((c) => c.active).length;
              return (
                <SmartFilterChips
                  chips={chips}
                  activeCount={activeChips}
                  onClearAll={() => {
                    if (status !== "all") setStatus("all");
                    if (difficulty !== "all") setDifficulty("all");
                    if (bookmarked) setBookmarked(false);
                  }}
                />
              );
            })()}
            <TopicMasteryChips
              topics={ALL_TOPICS}
              selectedTopics={selectedTopics}
              onToggle={toggleTopic}
              onShowOnlyWeak={showOnlyWeakTopics}
              stats={{ solved, attempted, perProblem, loading }}
            />
          </div>
        )}
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
        // Table-shaped skeleton — preserves the exact final colgroup widths so
        // the sortable/resizable header doesn't jump when data arrives.
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
              <colgroup>
                {selectionMode && <col style={{ width: "44px" }} />}
                {PROBLEM_COLUMNS.map((c) =>
                  tablePrefs.isVisible(c.id) ? (
                    <col key={c.id} style={{ width: `${tablePrefs.widthOf(c.id)}px` }} />
                  ) : null,
                )}
              </colgroup>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-b">
                  {selectionMode && <TableHead className="w-[44px]" />}
                  {PROBLEM_COLUMNS.filter((c) => tablePrefs.isVisible(c.id)).map((c) => (
                    <TableHead key={c.id} className="text-xs font-medium text-muted-foreground">
                      {c.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {selectionMode && (
                      <TableCell className="py-2.5">
                        <Skeleton className="h-4 w-4 rounded" />
                      </TableCell>
                    )}
                    {PROBLEM_COLUMNS.filter((c) => tablePrefs.isVisible(c.id)).map((c) => (
                      <TableCell key={c.id} className="py-2.5">
                        <Skeleton
                          className={cn(
                            "h-4",
                            c.id === "title" ? "w-3/4" :
                            c.id === "topics" ? "w-2/3" :
                            c.id === "row" || c.id === "status" || c.id === "bookmark" ? "w-4" :
                            "w-12",
                          )}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
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
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
              <colgroup>
                {selectionMode && <col style={{ width: "44px" }} />}
                {PROBLEM_COLUMNS.map((c) =>
                  tablePrefs.isVisible(c.id) ? (
                    <col key={c.id} style={{ width: `${tablePrefs.widthOf(c.id)}px` }} />
                  ) : null,
                )}
              </colgroup>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-b">
                  {selectionMode && (
                    <TableHead className="w-[44px]">
                      <Checkbox
                        aria-label="Select all"
                        checked={
                          pageSlice.length > 0 &&
                          pageSlice.every((p) => selected.has(p.slug))
                        }
                        onCheckedChange={(v) => {
                          if (v) selectAllVisible();
                          else
                            pageSlice.forEach((p) => {
                              if (selected.has(p.slug)) toggleSelected(p.slug);
                            });
                        }}
                        aria-label="Select all on page"
                      />
                    </TableHead>
                  )}
                  {tablePrefs.isVisible("row") && (
                    <SortableResizableHeader
                      columnId="row"
                      label="#"
                      align="center"
                      width={tablePrefs.widthOf("row")}
                      resizable
                      onResize={(px) => tablePrefs.setWidth("row", px)}
                    />
                  )}
                  {tablePrefs.isVisible("status") && (
                    <SortableResizableHeader
                      columnId="status"
                      label="Status"
                      width={tablePrefs.widthOf("status")}
                      sortable
                      sortDir={dirOf("status")}
                      onSortClick={() => cycleColumnSort("status")}
                      resizable
                      onResize={(px) => tablePrefs.setWidth("status", px)}
                    />
                  )}
                  {tablePrefs.isVisible("title") && (
                    <SortableResizableHeader
                      columnId="title"
                      label="Title"
                      width={tablePrefs.widthOf("title")}
                      resizable
                      onResize={(px) => tablePrefs.setWidth("title", px)}
                    />
                  )}
                  {tablePrefs.isVisible("topics") && (
                    <SortableResizableHeader
                      columnId="topics"
                      label="Topics"
                      width={tablePrefs.widthOf("topics")}
                      className="hidden md:table-cell"
                      resizable
                      onResize={(px) => tablePrefs.setWidth("topics", px)}
                    />
                  )}
                  {tablePrefs.isVisible("difficulty") && (
                    <SortableResizableHeader
                      columnId="difficulty"
                      label="Difficulty"
                      width={tablePrefs.widthOf("difficulty")}
                      sortable
                      sortDir={dirOf("difficulty")}
                      onSortClick={() => cycleColumnSort("difficulty")}
                      resizable
                      onResize={(px) => tablePrefs.setWidth("difficulty", px)}
                    />
                  )}
                  {tablePrefs.isVisible("acceptance") && (
                    <SortableResizableHeader
                      columnId="acceptance"
                      label="Acceptance"
                      align="right"
                      width={tablePrefs.widthOf("acceptance")}
                      className="hidden lg:table-cell"
                      sortable
                      sortDir={dirOf("acceptance")}
                      onSortClick={() => cycleColumnSort("acceptance")}
                      resizable
                      onResize={(px) => tablePrefs.setWidth("acceptance", px)}
                    />
                  )}
                  {tablePrefs.isVisible("attempts") && (
                    <SortableResizableHeader
                      columnId="attempts"
                      label="Attempts"
                      align="right"
                      width={tablePrefs.widthOf("attempts")}
                      className="hidden sm:table-cell"
                      sortable
                      sortDir={dirOf("attempts")}
                      onSortClick={() => cycleColumnSort("attempts")}
                      resizable
                      onResize={(px) => tablePrefs.setWidth("attempts", px)}
                    />
                  )}
                  {tablePrefs.isVisible("bookmark") && (
                    <SortableResizableHeader
                      columnId="bookmark"
                      label=""
                      width={tablePrefs.widthOf("bookmark")}
                    />
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageSlice.map((p, idx) => {
                  const isSolved = solved.has(p.slug);
                  const isAttempted = attempted.has(p.slug);
                  const stats = perProblem.get(p.slug);
                  const bm = isBookmarked(p.slug);
                  const isSel = selected.has(p.slug);
                  const acceptance =
                    stats && stats.attempts > 0
                      ? Math.round(((stats.accepted ?? 0) / stats.attempts) * 100)
                      : null;
                  const rowNumber = (safePage - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <TableRow
                      key={p.slug}
                      data-selected={isSel}
                      className={cn(
                        "group transition-colors",
                        isSel && "bg-primary/5",
                      )}
                    >
                      {selectionMode && (
                        <TableCell className={`${cellPadY}`}>
                          <Checkbox
                            checked={isSel}
                            onCheckedChange={() => toggleSelected(p.slug)}
                            aria-label="Select problem"
                          />
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("row") && (
                        <TableCell className={`${cellPadY} text-center text-xs text-muted-foreground tabular-nums`}>
                          {rowNumber}
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("status") && (
                        <TableCell className={`${cellPadY}`}>
                          {isSolved ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Solved" />
                          ) : isAttempted ? (
                            <CircleDot className="h-4 w-4 text-amber-500" aria-label="Attempted" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/40" aria-label="Not started" />
                          )}
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("title") && (
                        <TableCell className={`${cellPadY} min-w-0`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Link
                              to={`/library/problems/${p.slug}`}
                              className="font-medium hover:text-primary transition-colors block truncate"
                            >
                              {p.title}
                            </Link>
                          </div>
                          {/* Mobile-only inline topics */}
                          <div className="md:hidden mt-1 flex flex-wrap gap-1">
                            {p.topics.slice(0, 2).map((t) => (
                              <Badge
                                key={t}
                                variant="secondary"
                                className="text-[10px] font-normal px-1.5 py-0"
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("topics") && (
                        <TableCell className={`hidden md:table-cell ${cellPadY}`}>
                          <TopicBadgesWithOverflow topics={p.topics} visibleCount={3} />
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("difficulty") && (
                        <TableCell className={`${cellPadY}`}>
                          <Badge
                            variant="outline"
                            className={cn("font-medium", difficultyClass(p.difficulty))}
                          >
                            {p.difficulty}
                          </Badge>
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("acceptance") && (
                        <TableCell className={`hidden lg:table-cell ${cellPadY} text-right text-xs tabular-nums text-muted-foreground`}>
                          {acceptance !== null ? `${acceptance}%` : "—"}
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("attempts") && (
                        <TableCell className={`hidden sm:table-cell ${cellPadY} text-right text-xs text-muted-foreground tabular-nums`}>
                          {stats?.attempts ?? 0}
                        </TableCell>
                      )}
                      {tablePrefs.isVisible("bookmark") && (
                        <TableCell className={`${cellPadY}`}>
                          <button
                            type="button"
                            onClick={() => toggleBookmark(p.slug)}
                            className="p-1 rounded hover:bg-muted/50 transition-colors"
                            aria-label={bm ? "Remove bookmark" : "Bookmark"}
                          >
                            <Star
                              className={cn(
                                "h-4 w-4 transition-colors",
                                bm
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/40 hover:text-amber-400",
                              )}
                            />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
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


      <DailyChallengeCelebration
        open={daily.justCompleted}
        onClose={daily.acknowledgeCelebration}
        problem={daily.problem}
        streak={daily.streak}
        weeklyDone={Math.min(
          7,
          new Set(daily.recentCompletions.map((c) => c.date)).size,
        )}
        weeklyTarget={7}
      />

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

      <ShortcutsCheatSheet
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        shortcuts={[
          { keys: ["?"], description: "Show keyboard shortcuts" },
          { keys: ["/"], description: "Focus search" },
          { keys: ["b"], description: "Toggle bookmarked-only filter" },
          { keys: ["d"], description: "Toggle row density" },
          { keys: ["s"], description: "Toggle selection mode" },
          { keys: ["Esc"], description: "Clear selection / close" },
          { keys: ["←"], description: "Previous page" },
          { keys: ["→"], description: "Next page" },
        ]}
      />
    </div>
  );
};

export default CodingProblems;
