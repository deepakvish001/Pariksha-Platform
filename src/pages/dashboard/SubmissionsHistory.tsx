import { useEffect, useMemo, useState } from "react";
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

export default function SubmissionsHistory() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // localStorage key for "last-used filters" (per-user). Reapplied only when the
  // current URL has none of the filter params present (so a fresh deep-link or
  // a "Clear all" reset still wins).
  const PREFS_KEY = user ? `byteskill:submissions-history:prefs:${user.id}` : null;
  const FILTER_KEYS = ["q", "verdict", "lang", "from", "to", "tab"] as const;

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
  const tab = searchParams.get("tab") ?? "submissions";
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
  }, [search, verdict, language, dateFrom, dateTo, tab, PREFS_KEY, searchParams]);

  const { submissions, total: subTotal, loading: subsLoading, refetch: refetchSubs } =
    usePagedCodingSubmissions({
      page: subPage,
      pageSize: PAGE_SIZE,
      search,
      verdict,
      language,
      dateFrom,
      dateTo,
    });
  const { runs, total: runTotal, loading: runsLoading, refetch: refetchRuns } =
    usePagedCodeRuns({
      page: runPage,
      pageSize: PAGE_SIZE,
      search,
      language,
      dateFrom,
      dateTo,
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
    toast.success("Filters cleared", {
      description: "Search, verdict, language, tab, and pages reset to defaults.",
    });
  };

  if (!user) {
    return (
      <div className="container max-w-4xl py-12">
        <Card className="p-8 text-center">
          <Code2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-xl font-semibold mb-2">Sign in to view your history</h1>
          <p className="text-muted-foreground mb-4">
            Your submissions and runs are private to your account.
          </p>
          <Button asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 sm:py-10 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Submissions & Runs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your full coding history across all problems.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search problem slug or source code…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
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
        {(search ||
          verdict !== "all" ||
          language !== "all" ||
          tab !== "submissions" ||
          subPage !== 1 ||
          runPage !== 1 ||
          detailRunId) && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" /> Clear all filters
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => updateParams({ tab: v === "submissions" ? null : v })}>
        <TabsList>
          <TabsTrigger value="submissions">
            Submissions ({subTotal})
          </TabsTrigger>
          <TabsTrigger value="runs">
            Runs ({runTotal})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="mt-4 space-y-2">
          {subsLoading ? (
            <>{Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}</>
          ) : submissions.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No submissions match your filters.</Card>
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
            <Card className="p-8 text-center text-muted-foreground">No runs match your filters.</Card>
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
