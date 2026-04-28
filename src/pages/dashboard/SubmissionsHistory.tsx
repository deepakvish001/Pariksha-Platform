import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { usePagedCodingSubmissions } from "@/hooks/useCodingSubmissions";
import { usePagedCodeRuns, type CodeRunRow } from "@/hooks/useCodeRuns";
import { useAuth } from "@/contexts/AuthContext";
import { useCodeRunner, RunCancelledError } from "@/hooks/useCodeRunner";
import { useToast } from "@/hooks/use-toast";
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
import { Code2, ExternalLink, Eye, Play, Loader2, X, Copy, Check } from "lucide-react";

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

const CopyButton = ({ text, label }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-6 px-2 text-xs"
      onClick={onCopy}
      disabled={!text}
    >
      {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
      {copied ? "Copied" : label ?? "Copy"}
    </Button>
  );
};

export default function SubmissionsHistory() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-backed state
  const search = searchParams.get("q") ?? "";
  const verdict = searchParams.get("verdict") ?? "all";
  const language = searchParams.get("lang") ?? "all";
  const tab = searchParams.get("tab") ?? "submissions";
  const subPage = Math.max(1, parseInt(searchParams.get("subPage") ?? "1", 10) || 1);
  const runPage = Math.max(1, parseInt(searchParams.get("runPage") ?? "1", 10) || 1);

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

  const { submissions, total: subTotal, loading: subsLoading, refetch: refetchSubs } =
    usePagedCodingSubmissions({ page: subPage, pageSize: PAGE_SIZE, search, verdict, language });
  const { runs, total: runTotal, loading: runsLoading, refetch: refetchRuns } =
    usePagedCodeRuns({ page: runPage, pageSize: PAGE_SIZE, search, language });

  const { run, isRunning, cancelRun } = useCodeRunner();
  const { toast } = useToast();
  const [detailRun, setDetailRun] = useState<CodeRunRow | null>(null);
  const [rerunningId, setRerunningId] = useState<string | null>(null);

  const subTotalPages = useMemo(() => Math.max(1, Math.ceil(subTotal / PAGE_SIZE)), [subTotal]);
  const runTotalPages = useMemo(() => Math.max(1, Math.ceil(runTotal / PAGE_SIZE)), [runTotal]);

  const handleRerun = async (r: CodeRunRow) => {
    setRerunningId(r.id);
    try {
      const result = await run({
        source_code: r.source_code,
        language_id: r.language_id,
        language: r.language,
        stdin: r.stdin,
        problem_slug: r.problem_slug,
      });
      toast({
        title: `Re-run: ${result.status?.description ?? "Done"}`,
        description: `${r.problem_slug} • ${result.time ? `${Math.round(result.time * 1000)} ms` : "—"}`,
      });
      await refetchRuns();
    } catch (e) {
      if (e instanceof RunCancelledError) {
        toast({ title: "Re-run cancelled", description: r.problem_slug });
      } else {
        toast({
          title: "Re-run failed",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive",
        });
      }
    } finally {
      setRerunningId(null);
    }
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
        {(search || verdict !== "all" || language !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchInput("");
              setSearchParams(new URLSearchParams(tab === "runs" ? { tab } : {}), { replace: true });
            }}
          >
            <X className="h-4 w-4 mr-1" /> Clear
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
                          onClick={() => setDetailRun(r)}
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

      <Sheet open={!!detailRun} onOpenChange={(o) => !o && setDetailRun(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
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

                <div className="flex gap-2 flex-wrap">
                  {isRunning && rerunningId === detailRun.id ? (
                    <Button size="sm" variant="destructive" onClick={cancelRun}>
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel re-run
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
