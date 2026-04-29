import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { usePagedCodingSubmissions } from "@/hooks/useCodingSubmissions";
import { usePagedCodeRuns, type CodeRunRow } from "@/hooks/useCodeRuns";
import { useAuth } from "@/contexts/AuthContext";
import { useCodeRunner, RunCancelledError } from "@/hooks/useCodeRunner";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isValid, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Code2,
  ExternalLink,
  Eye,
  Play,
  Loader2,
  X,
  Copy,
  Check,
  Calendar as CalendarIcon,
  FilterX,
  Inbox,
  Trophy,
} from "lucide-react";

const PAGE_SIZE = 20;
const VERDICT_OPTIONS = [
  "Accepted",
  "Wrong Answer",
  "Time Limit Exceeded",
  "Compile Error",
  "Runtime Error",
];
const LANGUAGE_OPTIONS = ["python", "javascript", "typescript", "java", "cpp", "c"];

const verdictClass = (v: string) => {
  if (v === "Accepted") return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
  if (v === "Wrong Answer") return "bg-red-500/15 text-red-500 border-red-500/30";
  if (v === "Time Limit Exceeded") return "bg-amber-500/15 text-amber-500 border-amber-500/30";
  if (v === "Compile Error") return "bg-orange-500/15 text-orange-500 border-orange-500/30";
  return "bg-muted text-muted-foreground border-border";
};

const Pager = ({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) => {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page > 1) onPage(page - 1);
            }}
            className={page === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        {pages.map((p) => (
          <PaginationItem key={p}>
            <PaginationLink
              href="#"
              isActive={p === page}
              onClick={(e) => {
                e.preventDefault();
                onPage(p);
              }}
            >
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page < totalPages) onPage(page + 1);
            }}
            className={page === totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

const RowSkeleton = () => (
  <Card className="p-3">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  </Card>
);

const LARGE_COPY_THRESHOLD = 20_000; // ~20KB triggers loading state

const CopyButton = ({ text, label }: { text: string; label?: string }) => {
  const [state, setState] = useState<"idle" | "copying" | "copied" | "error">("idle");
  const onCopy = async () => {
    if (!text) return;
    const isLarge = text.length > LARGE_COPY_THRESHOLD;
    if (isLarge) setState("copying");
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      toast.success(`${label ?? "Content"} copied`, {
        description: `${text.length.toLocaleString()} characters`,
      });
      setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("error");
      toast.error("Copy failed");
      setTimeout(() => setState("idle"), 1800);
    }
  };
  const Icon =
    state === "copying" ? Loader2 : state === "copied" ? Check : Copy;
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-6 px-2 text-xs"
      onClick={onCopy}
      disabled={!text || state === "copying"}
    >
      <Icon className={`h-3 w-3 mr-1 ${state === "copying" ? "animate-spin" : ""}`} />
      {state === "copying"
        ? "Copying…"
        : state === "copied"
        ? "Copied"
        : state === "error"
        ? "Failed"
        : label ?? "Copy"}
      {text && text.length > LARGE_COPY_THRESHOLD && state === "idle" && (
        <span className="ml-1 text-muted-foreground">({Math.round(text.length / 1024)}KB)</span>
      )}
    </Button>
  );
};

export function SubmissionsAndRunsBody({ forcedTab }: { forcedTab?: "submissions" | "runs" } = {}) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // localStorage key for "last-used filters" (per-user). Reapplied only when the
  // current URL has none of the filter params present (so a fresh deep-link or
  // a "Clear all" reset still wins).
  const PREFS_KEY = user ? `byteskill:submissions-history:prefs:${user.id}` : null;
  const FILTER_KEYS = ["q", "verdict", "lang", "from", "to", "tab", "sort"] as const;

  // ---- Hydrate persisted filter prefs into the URL on first mount ---------
  // This runs only when no filter param is in the URL — so a shared link or a
  // post-"Clear all" navigation always wins over saved prefs.
  const hydratedPrefsRef = useRef(false);
  useEffect(() => {
    if (hydratedPrefsRef.current || !PREFS_KEY) return;
    hydratedPrefsRef.current = true;
    const hasAnyFilterParam = FILTER_KEYS.some((k) => searchParams.has(k));
    if (hasAnyFilterParam) return;
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, string | null>;
      const next = new URLSearchParams(searchParams);
      let dirty = false;
      for (const k of FILTER_KEYS) {
        const v = saved[k];
        if (v && typeof v === "string" && v !== "all") {
          next.set(k, v);
          dirty = true;
        }
      }
      if (dirty) setSearchParams(next, { replace: true });
    } catch {
      /* ignore corrupt prefs */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PREFS_KEY]);

  // URL-backed state
  const search = searchParams.get("q") ?? "";
  const verdict = searchParams.get("verdict") ?? "all";
  const language = searchParams.get("lang") ?? "all";
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";
  const tab = forcedTab ?? (searchParams.get("tab") ?? "submissions");
  const rawSort = searchParams.get("sort") ?? "newest";
  const sort = (["newest", "oldest", "best_score"] as const).includes(rawSort as never)
    ? (rawSort as "newest" | "oldest" | "best_score")
    : "newest";
  const subPage = Math.max(1, parseInt(searchParams.get("subPage") ?? "1", 10) || 1);
  const runPage = Math.max(1, parseInt(searchParams.get("runPage") ?? "1", 10) || 1);

  // Validate persisted dates so a stale/corrupt URL value doesn't break the
  // calendar component.
  const fromDate = useMemo(() => {
    if (!dateFrom) return undefined;
    const d = parseISO(dateFrom);
    return isValid(d) ? d : undefined;
  }, [dateFrom]);
  const toDate = useMemo(() => {
    if (!dateTo) return undefined;
    const d = parseISO(dateTo);
    return isValid(d) ? d : undefined;
  }, [dateTo]);

  // Debounce search input for snappier typing
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    // Sync external URL changes (e.g., Clear button) into the input
    setSearchInput(search);
  }, [search]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ q: searchInput || null, subPage: null, runPage: null });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === "" || v === "all") next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next, { replace: true });
  };

  // Persist filter prefs whenever they change (after hydration). We snapshot
  // only the filter-shaped keys — pagination, the open drawer, etc. don't
  // belong in saved prefs.
  useEffect(() => {
    if (!hydratedPrefsRef.current || !PREFS_KEY) return;
    try {
      const snapshot: Record<string, string> = {};
      for (const k of FILTER_KEYS) {
        const v = searchParams.get(k);
        if (v && v !== "all") snapshot[k] = v;
      }
      if (Object.keys(snapshot).length === 0) {
        localStorage.removeItem(PREFS_KEY);
      } else {
        localStorage.setItem(PREFS_KEY, JSON.stringify(snapshot));
      }
    } catch {
      /* ignore quota errors */
    }
  }, [search, verdict, language, dateFrom, dateTo, tab, sort, PREFS_KEY, searchParams]);

  const { submissions, total: subTotal, loading: subsLoading, refetch: refetchSubs } =
    usePagedCodingSubmissions({
      page: subPage,
      pageSize: PAGE_SIZE,
      search,
      verdict,
      language,
      dateFrom,
      dateTo,
      sort,
    });
  const { runs, total: runTotal, loading: runsLoading, refetch: refetchRuns } =
    usePagedCodeRuns({
      page: runPage,
      pageSize: PAGE_SIZE,
      search,
      language,
      dateFrom,
      dateTo,
      sort,
    });

  const { run, isRunning, cancelRun } = useCodeRunner();
  const { toast: legacyToast } = useToast();
  const [detailRunId, setDetailRunId] = useState<string | null>(searchParams.get("drawer"));
  const [rerunningId, setRerunningId] = useState<string | null>(null);
  const [lastRerunError, setLastRerunError] = useState<{ id: string; message: string } | null>(null);
  const [lastCancelledId, setLastCancelledId] = useState<string | null>(null);

  // Persist open drawer id to URL so it survives refresh / pagination
  useEffect(() => {
    const cur = searchParams.get("drawer");
    if (detailRunId && cur !== detailRunId) {
      updateParams({ drawer: detailRunId });
    } else if (!detailRunId && cur) {
      updateParams({ drawer: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailRunId]);

  // Resolve the run object for the persisted drawer id from currently-loaded runs
  const detailRun = useMemo(
    () => (detailRunId ? runs.find((r) => r.id === detailRunId) ?? null : null),
    [detailRunId, runs],
  );

  const subTotalPages = useMemo(() => Math.max(1, Math.ceil(subTotal / PAGE_SIZE)), [subTotal]);
  const runTotalPages = useMemo(() => Math.max(1, Math.ceil(runTotal / PAGE_SIZE)), [runTotal]);

  const handleRerun = async (r: CodeRunRow) => {
    setRerunningId(r.id);
    setLastRerunError(null);
    setLastCancelledId(null);
    try {
      const result = await run({
        source_code: r.source_code,
        language_id: r.language_id,
        language: r.language,
        stdin: r.stdin,
        problem_slug: r.problem_slug,
      });
      legacyToast({
        title: `Re-run: ${result.status?.description ?? "Done"}`,
        description: `${r.problem_slug} • ${result.time ? `${Math.round(result.time * 1000)} ms` : "—"}`,
      });
      await refetchRuns();
    } catch (e) {
      if (e instanceof RunCancelledError) {
        setLastCancelledId(r.id);
        toast.info("Re-run cancelled", {
          description: `${r.problem_slug} • run ${r.id.slice(0, 8)}`,
        });
      } else {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setLastRerunError({ id: r.id, message: msg });
        legacyToast({ title: "Re-run failed", description: msg, variant: "destructive" });
      }
    } finally {
      setRerunningId(null);
    }
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams(), { replace: true });
    setDetailRunId(null);
    if (PREFS_KEY) {
      try {
        localStorage.removeItem(PREFS_KEY);
      } catch {
        /* ignore */
      }
    }
    toast.success("Filters cleared", {
      description: "Search, verdict, language, dates, tab, and pages reset to defaults.",
    });
  };

  const setDateRange = (next: { from?: Date; to?: Date }) => {
    const fromStr = next.from ? format(next.from, "yyyy-MM-dd") : null;
    const toStr = next.to ? format(next.to, "yyyy-MM-dd") : null;
    updateParams({ from: fromStr, to: toStr, subPage: null, runPage: null });
  };

  const dateRangeLabel = (() => {
    if (fromDate && toDate) return `${format(fromDate, "MMM d")} – ${format(toDate, "MMM d, yyyy")}`;
    if (fromDate) return `From ${format(fromDate, "MMM d, yyyy")}`;
    if (toDate) return `Until ${format(toDate, "MMM d, yyyy")}`;
    return "Any date";
  })();

  const hasActiveFilters =
    !!search ||
    verdict !== "all" ||
    language !== "all" ||
    !!dateFrom ||
    !!dateTo ||
    tab !== "submissions" ||
    sort !== "newest" ||
    subPage !== 1 ||
    runPage !== 1 ||
    !!detailRunId;

  if (!user) {
    return null;
  }

  return (
    <div className={forcedTab ? "space-y-4" : "container max-w-6xl py-6 sm:py-10 space-y-6"}>
      {!forcedTab && (
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Submissions & Runs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your full coding history across all problems.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/library/problems/leaderboard">
              <Trophy className="h-4 w-4" />
              Global Leaderboard
            </Link>
          </Button>
        </header>
      )}

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search by problem name, verdict, or code…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
          aria-label="Search submissions and runs"
        />
        <Select
          value={verdict}
          onValueChange={(v) => updateParams({ verdict: v, subPage: null })}
        >
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Verdict" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All verdicts</SelectItem>
            {VERDICT_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select
          value={language}
          onValueChange={(v) => updateParams({ lang: v, subPage: null, runPage: null })}
        >
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Language" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All languages</SelectItem>
            {LANGUAGE_OPTIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(v) => updateParams({ sort: v === "newest" ? null : v, subPage: null, runPage: null })}
        >
          <SelectTrigger className="w-[160px]" aria-label="Sort order">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="best_score">Best score</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className={cn(
                "h-10 justify-start font-normal",
                !fromDate && !toDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRangeLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex flex-col sm:flex-row">
              <div className="border-b sm:border-b-0 sm:border-r">
                <p className="px-3 pt-3 pb-1 text-xs font-semibold text-muted-foreground">From</p>
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={(d) => setDateRange({ from: d ?? undefined, to: toDate })}
                  disabled={(d) => (toDate ? d > toDate : false) || d > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </div>
              <div>
                <p className="px-3 pt-3 pb-1 text-xs font-semibold text-muted-foreground">To</p>
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={(d) => setDateRange({ from: fromDate, to: d ?? undefined })}
                  disabled={(d) => (fromDate ? d < fromDate : false) || d > new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </div>
            </div>
            {(fromDate || toDate) && (
              <div className="flex justify-end p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  <FilterX className="h-3.5 w-3.5 mr-1" /> Clear dates
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" /> Clear all filters
          </Button>
        )}
      </div>

      {/* Active filter chips — one-click removal */}
      {(search || verdict !== "all" || language !== "all" || sort !== "newest" || dateFrom || dateTo) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Active filters:</span>
          {search && (
            <Badge variant="secondary" className="gap-1 pr-1">
              <span className="text-[11px]">Search: “{search}”</span>
              <button
                type="button"
                aria-label="Clear search filter"
                onClick={() => {
                  setSearchInput("");
                  updateParams({ q: null, subPage: null, runPage: null });
                }}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {verdict !== "all" && (
            <Badge variant="secondary" className="gap-1 pr-1" title="Verdict filtering applies to submissions only — runs are unaffected.">
              <span className="text-[11px]">
                Verdict: {verdict}
                <span className="ml-1 opacity-70">(submissions only)</span>
              </span>
              <button
                type="button"
                aria-label="Clear verdict filter"
                onClick={() => updateParams({ verdict: null, subPage: null })}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {language !== "all" && (
            <Badge variant="secondary" className="gap-1 pr-1">
              <span className="text-[11px]">Language: {language}</span>
              <button
                type="button"
                aria-label="Clear language filter"
                onClick={() => updateParams({ lang: null, subPage: null, runPage: null })}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {sort !== "newest" && (
            <Badge variant="secondary" className="gap-1 pr-1">
              <span className="text-[11px]">
                Sort: {sort === "oldest" ? "Oldest first" : "Best score"}
              </span>
              <button
                type="button"
                aria-label="Reset sort to newest"
                onClick={() => updateParams({ sort: null, subPage: null, runPage: null })}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(dateFrom || dateTo) && (
            <Badge variant="secondary" className="gap-1 pr-1">
              <span className="text-[11px]">Date: {dateRangeLabel}</span>
              <button
                type="button"
                aria-label="Clear date range filter"
                onClick={() => setDateRange({ from: undefined, to: undefined })}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => forcedTab ? undefined : updateParams({ tab: v === "submissions" ? null : v })}>
        {!forcedTab && (
          <TabsList>
            <TabsTrigger value="submissions">
              Submissions ({subTotal})
            </TabsTrigger>
            <TabsTrigger value="runs">
              Runs ({runTotal})
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="submissions" className="mt-4 space-y-2">
          {subsLoading ? (
            <>{Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}</>
          ) : submissions.length === 0 ? (
            <Card className="p-10 text-center space-y-3">
              <Inbox className="h-10 w-10 mx-auto text-muted-foreground" />
              <div className="space-y-1.5">
                <p className="font-medium">No submissions match your filters</p>
                {hasActiveFilters ? (
                  <div className="text-sm text-muted-foreground space-y-1.5">
                    <p>None of your submissions match the current filters:</p>
                    <ul className="text-xs inline-flex flex-wrap gap-x-3 gap-y-1 justify-center">
                      {search && <li>• search “{search}”</li>}
                      {verdict !== "all" && <li>• verdict = {verdict}</li>}
                      {language !== "all" && <li>• language = {language}</li>}
                      {sort !== "newest" && (
                        <li>• sort = {sort === "oldest" ? "oldest" : "best score"}</li>
                      )}
                      {(dateFrom || dateTo) && <li>• date {dateRangeLabel}</li>}
                    </ul>
                    <p className="text-xs">
                      Remove a chip above, or clear individual filters below.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Solve a problem from the Coding Library to see it here.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {search && (
                  <Button variant="outline" size="sm" onClick={() => { setSearchInput(""); updateParams({ q: null, subPage: null }); }}>
                    <X className="h-3.5 w-3.5 mr-1" /> Clear search
                  </Button>
                )}
                {verdict !== "all" && (
                  <Button variant="outline" size="sm" onClick={() => updateParams({ verdict: null, subPage: null })}>
                    <X className="h-3.5 w-3.5 mr-1" /> Clear verdict
                  </Button>
                )}
                {(dateFrom || dateTo) && (
                  <Button variant="outline" size="sm" onClick={() => setDateRange({ from: undefined, to: undefined })}>
                    <X className="h-3.5 w-3.5 mr-1" /> Clear dates
                  </Button>
                )}
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    <FilterX className="h-3.5 w-3.5 mr-1" /> Reset all
                  </Button>
                )}
                <Button size="sm" asChild>
                  <Link to="/library/problems">Browse problems</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {submissions.map((s) => (
                <Card key={s.id} className="p-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline" className={verdictClass(s.verdict)}>
                        {s.verdict}
                      </Badge>
                      <Link
                        to={`/library/problems/${s.problem_slug}`}
                        className="text-sm font-medium hover:underline truncate flex items-center gap-1"
                      >
                        {s.problem_slug} <ExternalLink className="h-3 w-3" />
                      </Link>
                      <span className="text-xs text-muted-foreground">{s.language}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.passed_tests}/{s.total_tests} tests
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {s.runtime_ms !== null && <span>{s.runtime_ms} ms</span>}
                      {s.memory_kb !== null && <span>{(s.memory_kb / 1024).toFixed(1)} MB</span>}
                      <span>{new Date(s.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              ))}
              <Pager
                page={subPage}
                totalPages={subTotalPages}
                onPage={(p) => updateParams({ subPage: p === 1 ? null : String(p) })}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="runs" className="mt-4 space-y-2">
          {runsLoading ? (
            <>{Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}</>
          ) : runs.length === 0 ? (
            <Card className="p-10 text-center space-y-3">
              <Inbox className="h-10 w-10 mx-auto text-muted-foreground" />
              <div className="space-y-1.5">
                <p className="font-medium">No runs match your filters</p>
                {hasActiveFilters ? (
                  <div className="text-sm text-muted-foreground space-y-1.5">
                    <p>None of your runs match the current filters:</p>
                    <ul className="text-xs inline-flex flex-wrap gap-x-3 gap-y-1 justify-center">
                      {search && <li>• search “{search}”</li>}
                      {language !== "all" && <li>• language = {language}</li>}
                      {sort !== "newest" && (
                        <li>• sort = {sort === "oldest" ? "oldest" : "best score"}</li>
                      )}
                      {(dateFrom || dateTo) && <li>• date {dateRangeLabel}</li>}
                    </ul>
                    <p className="text-xs">
                      Note: verdict filter only affects submissions. Remove a chip above or clear individual filters below.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Use “Run” in the editor to see your test runs here.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {search && (
                  <Button variant="outline" size="sm" onClick={() => { setSearchInput(""); updateParams({ q: null, runPage: null }); }}>
                    <X className="h-3.5 w-3.5 mr-1" /> Clear search
                  </Button>
                )}
                {language !== "all" && (
                  <Button variant="outline" size="sm" onClick={() => updateParams({ lang: null, subPage: null, runPage: null })}>
                    <X className="h-3.5 w-3.5 mr-1" /> Clear language
                  </Button>
                )}
                {(dateFrom || dateTo) && (
                  <Button variant="outline" size="sm" onClick={() => setDateRange({ from: undefined, to: undefined })}>
                    <X className="h-3.5 w-3.5 mr-1" /> Clear dates
                  </Button>
                )}
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    <FilterX className="h-3.5 w-3.5 mr-1" /> Reset all
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <>
              {runs.map((r) => {
                const isThisRunning = isRunning && rerunningId === r.id;
                return (
                  <Card key={r.id} className="p-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant="outline" className="text-xs">{r.status ?? "Unknown"}</Badge>
                        <Link
                          to={`/library/problems/${r.problem_slug}`}
                          className="text-sm font-medium hover:underline truncate flex items-center gap-1"
                        >
                          {r.problem_slug} <ExternalLink className="h-3 w-3" />
                        </Link>
                        <span className="text-xs text-muted-foreground">{r.language}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {r.time_ms !== null && <span>{r.time_ms} ms</span>}
                        {r.memory_kb !== null && <span>{(r.memory_kb / 1024).toFixed(1)} MB</span>}
                        <span>{new Date(r.created_at).toLocaleString()}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2"
                          onClick={() => setDetailRunId(r.id)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Details
                        </Button>
                        {isThisRunning ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2"
                            onClick={cancelRun}
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Cancel
                          </Button>
                        ) : lastRerunError?.id === r.id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 border-destructive/40 text-destructive hover:text-destructive"
                            disabled={isRunning}
                            onClick={() => handleRerun(r)}
                          >
                            {isRunning ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <Play className="h-3.5 w-3.5 mr-1" />
                            )}
                            {isRunning ? "Retrying…" : "Retry"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2"
                            disabled={isRunning}
                            onClick={() => handleRerun(r)}
                          >
                            <Play className="h-3.5 w-3.5 mr-1" />
                            Re-run
                          </Button>
                        )}
                      </div>
                    </div>
                    {lastRerunError?.id === r.id && (
                      <p className="mt-2 text-xs text-destructive truncate">
                        Re-run failed: {lastRerunError.message}
                      </p>
                    )}
                    {lastCancelledId === r.id && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Re-run cancelled • {r.problem_slug} • run {r.id.slice(0, 8)}
                      </p>
                    )}
                  </Card>
                );
              })}
              <Pager
                page={runPage}
                totalPages={runTotalPages}
                onPage={(p) => updateParams({ runPage: p === 1 ? null : String(p) })}
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={!!detailRunId} onOpenChange={(o) => !o && setDetailRunId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {!detailRun && detailRunId && !runsLoading && (
            <div className="py-12 text-center space-y-4">
              <Eye className="h-10 w-10 mx-auto text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Run not found</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This run (<span className="font-mono">{detailRunId.slice(0, 8)}</span>) is no
                  longer available. It may have been deleted, or it isn't on the current page of
                  your filtered results.
                </p>
              </div>
              <Button variant="outline" onClick={() => setDetailRunId(null)}>
                <X className="h-4 w-4 mr-1" /> Close
              </Button>
            </div>
          )}
          {!detailRun && detailRunId && runsLoading && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Loading run…
            </div>
          )}
          {detailRun && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Badge variant="outline">{detailRun.status ?? "Unknown"}</Badge>
                  <span className="truncate">{detailRun.problem_slug}</span>
                </SheetTitle>
                <SheetDescription>
                  {detailRun.language} • {new Date(detailRun.created_at).toLocaleString()}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <Card className="p-3">
                    <p className="text-muted-foreground">Time</p>
                    <p className="text-sm font-semibold">
                      {detailRun.time_ms !== null ? `${detailRun.time_ms} ms` : "—"}
                    </p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-muted-foreground">Memory</p>
                    <p className="text-sm font-semibold">
                      {detailRun.memory_kb !== null
                        ? `${(detailRun.memory_kb / 1024).toFixed(1)} MB`
                        : "—"}
                    </p>
                  </Card>
                </div>

                <div className="flex gap-2 flex-wrap items-center">
                  {isRunning && rerunningId === detailRun.id ? (
                    <Button size="sm" variant="destructive" onClick={cancelRun}>
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel re-run
                    </Button>
                  ) : lastRerunError?.id === detailRun.id ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRerun(detailRun)}
                      disabled={isRunning}
                    >
                      {isRunning ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5 mr-1" />
                      )}
                      {isRunning ? "Retrying…" : "Retry re-run"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleRerun(detailRun)}
                      disabled={isRunning}
                    >
                      <Play className="h-3.5 w-3.5 mr-1" />
                      Re-run with same stdin
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/library/problems/${detailRun.problem_slug}`}>
                      Open problem <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
                {lastRerunError?.id === detailRun.id && (
                  <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-destructive">
                    Re-run failed: {lastRerunError.message}
                  </div>
                )}
                {lastCancelledId === detailRun.id && !isRunning && (
                  <div className="rounded border border-border bg-muted/30 p-2 text-muted-foreground">
                    Re-run cancelled • {detailRun.problem_slug} • run {detailRun.id.slice(0, 8)}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-muted-foreground">Source code</p>
                    <CopyButton text={detailRun.source_code || ""} />
                  </div>
                  <pre className="bg-muted/50 p-2 rounded border overflow-x-auto max-h-72">
                    {detailRun.source_code || "(empty)"}
                  </pre>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-muted-foreground">Stdin</p>
                    <CopyButton text={detailRun.stdin || ""} />
                  </div>
                  <pre className="bg-muted/50 p-2 rounded border overflow-x-auto">
                    {detailRun.stdin || "(empty)"}
                  </pre>
                </div>
                {detailRun.stdout && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-muted-foreground">Stdout</p>
                      <CopyButton text={detailRun.stdout} />
                    </div>
                    <pre className="bg-muted/50 p-2 rounded border overflow-x-auto">{detailRun.stdout}</pre>
                  </div>
                )}
                {detailRun.stderr && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-destructive">Stderr</p>
                      <CopyButton text={detailRun.stderr} />
                    </div>
                    <pre className="bg-destructive/10 p-2 rounded border border-destructive/30 overflow-x-auto">
                      {detailRun.stderr}
                    </pre>
                  </div>
                )}
                {detailRun.compile_output && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-amber-500">Compile output</p>
                      <CopyButton text={detailRun.compile_output} />
                    </div>
                    <pre className="bg-muted/50 p-2 rounded border overflow-x-auto">
                      {detailRun.compile_output}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function SubmissionsHistory() {
  return <SubmissionsAndRunsBody />;
}
