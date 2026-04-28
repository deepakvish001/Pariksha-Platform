import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCodingSubmissions } from "@/hooks/useCodingSubmissions";
import { useCodeRuns } from "@/hooks/useCodeRuns";
import { useAuth } from "@/contexts/AuthContext";
import { useCodeRunner } from "@/hooks/useCodeRunner";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Code2, ExternalLink, Eye, Play, Loader2 } from "lucide-react";
import type { CodeRunRow } from "@/hooks/useCodeRuns";

const PAGE_SIZE = 20;

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

export default function SubmissionsHistory() {
  const { user } = useAuth();
  const { submissions, loading: subsLoading } = useCodingSubmissions();
  const { runs, loading: runsLoading, refetch: refetchRuns } = useCodeRuns();
  const { run, isRunning } = useCodeRunner();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [verdict, setVerdict] = useState<string>("all");
  const [language, setLanguage] = useState<string>("all");
  const [subPage, setSubPage] = useState(1);
  const [runPage, setRunPage] = useState(1);
  const [detailRun, setDetailRun] = useState<CodeRunRow | null>(null);
  const [rerunningId, setRerunningId] = useState<string | null>(null);

  const verdicts = useMemo(
    () => Array.from(new Set(submissions.map((s) => s.verdict))).sort(),
    [submissions],
  );
  const languages = useMemo(
    () => Array.from(new Set([...submissions.map((s) => s.language), ...runs.map((r) => r.language)])).sort(),
    [submissions, runs],
  );

  const q = search.toLowerCase().trim();

  const filteredSubs = useMemo(
    () =>
      submissions.filter(
        (s) =>
          (verdict === "all" || s.verdict === verdict) &&
          (language === "all" || s.language === language) &&
          (q === "" ||
            s.problem_slug.toLowerCase().includes(q) ||
            (s.source_code ?? "").toLowerCase().includes(q)),
      ),
    [submissions, verdict, language, q],
  );
  const filteredRuns = useMemo(
    () =>
      runs.filter(
        (r) =>
          (language === "all" || r.language === language) &&
          (q === "" ||
            r.problem_slug.toLowerCase().includes(q) ||
            (r.source_code ?? "").toLowerCase().includes(q)),
      ),
    [runs, language, q],
  );

  const subTotalPages = Math.max(1, Math.ceil(filteredSubs.length / PAGE_SIZE));
  const runTotalPages = Math.max(1, Math.ceil(filteredRuns.length / PAGE_SIZE));
  const safeSubPage = Math.min(subPage, subTotalPages);
  const safeRunPage = Math.min(runPage, runTotalPages);
  const pagedSubs = filteredSubs.slice((safeSubPage - 1) * PAGE_SIZE, safeSubPage * PAGE_SIZE);
  const pagedRuns = filteredRuns.slice((safeRunPage - 1) * PAGE_SIZE, safeRunPage * PAGE_SIZE);

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
      toast({
        title: "Re-run failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
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
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSubPage(1);
            setRunPage(1);
          }}
          className="max-w-sm"
        />
        <Select
          value={verdict}
          onValueChange={(v) => {
            setVerdict(v);
            setSubPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Verdict" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All verdicts</SelectItem>
            {verdicts.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select
          value={language}
          onValueChange={(v) => {
            setLanguage(v);
            setSubPage(1);
            setRunPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Language" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All languages</SelectItem>
            {languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">
            Submissions ({filteredSubs.length})
          </TabsTrigger>
          <TabsTrigger value="runs">
            Runs ({filteredRuns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="mt-4 space-y-2">
          {subsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filteredSubs.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No submissions match your filters.</Card>
          ) : (
            <>
              {pagedSubs.map((s) => (
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
              <Pager page={safeSubPage} totalPages={subTotalPages} onPage={setSubPage} />
            </>
          )}
        </TabsContent>

        <TabsContent value="runs" className="mt-4 space-y-2">
          {runsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filteredRuns.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No runs match your filters.</Card>
          ) : (
            <>
              {pagedRuns.map((r) => (
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        disabled={isRunning && rerunningId === r.id}
                        onClick={() => handleRerun(r)}
                      >
                        {isRunning && rerunningId === r.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5 mr-1" />
                        )}
                        Re-run
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              <Pager page={safeRunPage} totalPages={runTotalPages} onPage={setRunPage} />
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

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRerun(detailRun)}
                    disabled={isRunning && rerunningId === detailRun.id}
                  >
                    {isRunning && rerunningId === detailRun.id ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5 mr-1" />
                    )}
                    Re-run with same stdin
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/library/problems/${detailRun.problem_slug}`}>
                      Open problem <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>

                <div>
                  <p className="font-semibold text-muted-foreground mb-1">Source code</p>
                  <pre className="bg-muted/50 p-2 rounded border overflow-x-auto max-h-72">
                    {detailRun.source_code || "(empty)"}
                  </pre>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground mb-1">Stdin</p>
                  <pre className="bg-muted/50 p-2 rounded border overflow-x-auto">
                    {detailRun.stdin || "(empty)"}
                  </pre>
                </div>
                {detailRun.stdout && (
                  <div>
                    <p className="font-semibold text-muted-foreground mb-1">Stdout</p>
                    <pre className="bg-muted/50 p-2 rounded border overflow-x-auto">{detailRun.stdout}</pre>
                  </div>
                )}
                {detailRun.stderr && (
                  <div>
                    <p className="font-semibold text-destructive mb-1">Stderr</p>
                    <pre className="bg-destructive/10 p-2 rounded border border-destructive/30 overflow-x-auto">
                      {detailRun.stderr}
                    </pre>
                  </div>
                )}
                {detailRun.compile_output && (
                  <div>
                    <p className="font-semibold text-amber-500 mb-1">Compile output</p>
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
