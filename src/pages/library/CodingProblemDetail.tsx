import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Play,
  Send,
  RotateCcw,
  Loader2,
  Lightbulb,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProblemBySlug,
  LANGUAGES,
  getLanguageById,
  type LangId,
} from "@/data/codingProblemsData";
import { MonacoEditor } from "@/components/coding/MonacoEditor";
import { VerdictBadge } from "@/components/coding/VerdictBadge";
import { useCodeRunner, type RunResult, type SubmitResult } from "@/hooks/useCodeRunner";
import { useCodeDraft } from "@/hooks/useCodeDraft";
import { useCodingSubmissions } from "@/hooks/useCodingSubmissions";
import { useCodeRuns } from "@/hooks/useCodeRuns";
import { useCodingProblemBookmarks } from "@/hooks/useCodingProblemBookmarks";
import { LoginPromptDialog } from "@/components/LoginPromptDialog";
import { ProblemDetailHeader } from "@/components/library/coding/ProblemDetailHeader";
import { AttemptTimeline } from "@/components/library/coding/AttemptTimeline";
import { SubmissionDetailsDrawer } from "@/components/library/coding/SubmissionDetailsDrawer";
import type { CodeSubmissionRow } from "@/hooks/useCodingSubmissions";
import { cn } from "@/lib/utils";

const difficultyClass = (d: string) =>
  d === "Easy"
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : d === "Medium"
      ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
      : "text-rose-500 bg-rose-500/10 border-rose-500/20";

const CodingProblemDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const problem = useMemo(() => (slug ? getProblemBySlug(slug) : undefined), [slug]);

  const [language, setLanguage] = useState<LangId>("python");
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [activeBottomTab, setActiveBottomTab] = useState<"testcase" | "output">("testcase");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [openHints, setOpenHints] = useState<Record<number, boolean>>({});
  const [detailSubmission, setDetailSubmission] = useState<CodeSubmissionRow | null>(null);

  const { run, submit, isRunning, isSubmitting } = useCodeRunner();
  const { draft, draftLoaded, saveDraft } = useCodeDraft(slug ?? "", language);
  const { submissions, refetch: refetchSubmissions } = useCodingSubmissions(slug);
  const { runs, refetch: refetchRuns } = useCodeRuns(slug);
  const { isBookmarked, toggle: toggleBookmark } = useCodingProblemBookmarks();

  // Derived per-problem stats
  const problemStats = useMemo(() => {
    const attempts = submissions.length;
    const accepted = submissions.filter((s) => s.verdict === "Accepted");
    const isSolved = accepted.length > 0;
    const isAttempted = attempts > 0;
    // earliest accepted = solvedAt
    let solvedAt: string | null = null;
    for (const a of accepted) {
      if (!solvedAt || a.created_at < solvedAt) solvedAt = a.created_at;
    }
    return { attempts, isSolved, isAttempted, solvedAt };
  }, [submissions]);

  // Initialize code from draft or starter
  useEffect(() => {
    if (!problem || !draftLoaded) return;
    setCode(draft && draft.length > 0 ? draft : problem.starterCode[language]);
  }, [problem, language, draft, draftLoaded]);

  // Initialize stdin to first sample test
  useEffect(() => {
    if (problem && problem.sampleTests[0]) {
      setStdin(problem.sampleTests[0].input);
    }
  }, [problem]);

  if (!problem) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Problem not found.</p>
        <Button asChild variant="outline">
          <Link to="/library/problems">Back to problems</Link>
        </Button>
      </div>
    );
  }

  const langInfo = getLanguageById(language);

  const handleCodeChange = (v: string) => {
    setCode(v);
    saveDraft(v);
  };

  const handleReset = () => {
    setCode(problem.starterCode[language]);
    saveDraft(problem.starterCode[language]);
    toast({ title: "Code reset", description: "Editor restored to starter template." });
  };

  const handleRun = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setRunResult(null);
    setSubmitResult(null);
    setActiveBottomTab("output");
    try {
      const result = await run({
        source_code: code,
        language_id: langInfo.judge0Id,
        stdin,
        problem_slug: slug,
        language,
      });
      setRunResult(result);
      refetchRuns();
    } catch (err) {
      toast({
        title: "Run failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setSubmitResult(null);
    setRunResult(null);
    setActiveBottomTab("output");
    try {
      const result = await submit({
        source_code: code,
        language,
        language_id: langInfo.judge0Id,
        problem_slug: problem.slug,
        tests: problem.hiddenTests,
        cpu_time_limit: problem.cpuTimeLimitSec,
        memory_limit: problem.memoryLimitKb,
      });
      setSubmitResult(result);
      refetchSubmissions();
      toast({
        title: result.verdict,
        description: `${result.passed} / ${result.total} test cases passed`,
        variant: result.verdict === "Accepted" ? "default" : "destructive",
      });
    } catch (err) {
      toast({
        title: "Submit failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const acceptedExists = submissions.some((s) => s.verdict === "Accepted");

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <Helmet>
        <title>{problem.title} — Coding Problem | Byteskill</title>
        <meta name="description" content={problem.description.slice(0, 155)} />
      </Helmet>

      {/* Top toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
            <Link to="/library/problems">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">All Problems</span>
            </Link>
          </Button>
          <div className="min-w-0 flex items-center gap-2">
            <h1 className="font-semibold text-sm sm:text-base truncate">{problem.title}</h1>
            <Badge variant="outline" className={cn("font-medium hidden sm:inline-flex", difficultyClass(problem.difficulty))}>
              {problem.difficulty}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Run</span>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            size="sm"
            className="gap-1.5"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Submit
          </Button>
        </div>
      </div>

      {/* Resizable split */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* LEFT: tabs */}
        <ResizablePanel defaultSize={45} minSize={25}>
          <Tabs defaultValue="description" className="h-full flex flex-col">
            <TabsList className="rounded-none justify-start bg-transparent border-b h-10 px-2">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="solution">Solution</TabsTrigger>
              <TabsTrigger value="submissions">
                Submissions {submissions.length > 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">({submissions.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="runs">
                Runs {runs.length > 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">({runs.length})</span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <TabsContent value="description" className="mt-0 space-y-6">
                <ProblemDetailHeader
                  isSolved={problemStats.isSolved}
                  isAttempted={problemStats.isAttempted}
                  attempts={problemStats.attempts}
                  solvedAt={problemStats.solvedAt}
                  isBookmarked={isBookmarked(problem.slug)}
                  onToggleBookmark={() => toggleBookmark(problem.slug)}
                />
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={cn("font-medium sm:hidden", difficultyClass(problem.difficulty))}>
                    {problem.difficulty}
                  </Badge>
                  {problem.topics.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.description}</ReactMarkdown>
                </div>

                {/* Examples */}
                <div className="space-y-3">
                  {problem.examples.map((ex, i) => (
                    <div key={i} className="rounded-md bg-muted/50 p-3 border">
                      <p className="text-xs font-semibold mb-1.5 uppercase tracking-wider text-muted-foreground">
                        Example {i + 1}
                      </p>
                      <div className="space-y-1.5 text-sm font-mono">
                        <p><span className="text-muted-foreground">Input:</span> {ex.input}</p>
                        <p><span className="text-muted-foreground">Output:</span> {ex.output}</p>
                        {ex.explanation && (
                          <p className="font-sans text-muted-foreground italic">
                            {ex.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                {problem.constraints.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Constraints</h3>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground font-mono">
                      {problem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hints */}
                {problem.hints.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Hints</h3>
                    {problem.hints.map((h, i) => (
                      <Collapsible
                        key={i}
                        open={openHints[i]}
                        onOpenChange={(o) => setOpenHints((s) => ({ ...s, [i]: o }))}
                      >
                        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-2.5 rounded-md hover:bg-muted/50 border text-sm">
                          {openHints[i] ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                          <span className="font-medium">Hint {i + 1}</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-3 py-2 text-sm text-muted-foreground">
                          {h}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="solution" className="mt-0">
                {!acceptedExists ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      🔒 Solve the problem first to unlock the reference solution.
                    </p>
                  </Card>
                ) : problem.referenceSolution[language] ? (
                  <pre className="text-sm bg-muted/50 p-4 rounded-md border overflow-x-auto">
                    <code>{problem.referenceSolution[language]}</code>
                  </pre>
                ) : problem.referenceSolution.python ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Reference (Python):
                    </p>
                    <pre className="text-sm bg-muted/50 p-4 rounded-md border overflow-x-auto">
                      <code>{problem.referenceSolution.python}</code>
                    </pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No reference solution available.</p>
                )}
              </TabsContent>

              <TabsContent value="submissions" className="mt-0">
                {!user ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-3">
                      Sign in to view your submission history.
                    </p>
                    <Button onClick={() => setShowLogin(true)}>Sign in</Button>
                  </Card>
                ) : submissions.length === 0 ? (
                  <AttemptTimeline submissions={[]} limit={10} />
                ) : (
                  <div className="space-y-3">
                    <AttemptTimeline
                      submissions={submissions}
                      limit={10}
                      onSelect={(s) => setDetailSubmission(s)}
                    />
                    {submissions.length > 0 && (
                      <div className="space-y-2">
                        {submissions.map((s) => (
                          <Card
                            key={s.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setDetailSubmission(s)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setDetailSubmission(s);
                              }
                            }}
                            className="p-3 hover:bg-muted/30 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                          >
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-3">
                                <VerdictBadge verdict={s.verdict} />
                                <span className="text-sm text-muted-foreground">{s.language}</span>
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
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="runs" className="mt-0">
                {!user ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground mb-3">
                      Sign in to view your run history.
                    </p>
                    <Button onClick={() => setShowLogin(true)}>Sign in</Button>
                  </Card>
                ) : runs.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No runs yet. Hit <strong>Run</strong> to test your code with custom input.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {runs.map((r) => (
                      <Collapsible key={r.id}>
                        <Card className="p-3 hover:bg-muted/30 transition-colors">
                          <CollapsibleTrigger className="w-full text-left">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-xs">
                                  {r.status ?? "Unknown"}
                                </Badge>
                                <span className="text-sm text-muted-foreground">{r.language}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {r.time_ms !== null && <span>{r.time_ms} ms</span>}
                                {r.memory_kb !== null && <span>{(r.memory_kb / 1024).toFixed(1)} MB</span>}
                                <span>{new Date(r.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3 space-y-2 text-xs">
                            {r.stdin && (
                              <div>
                                <p className="font-semibold text-muted-foreground mb-1">Stdin</p>
                                <pre className="bg-muted/50 p-2 rounded border overflow-x-auto">{r.stdin}</pre>
                              </div>
                            )}
                            {r.stdout && (
                              <div>
                                <p className="font-semibold text-muted-foreground mb-1">Stdout</p>
                                <pre className="bg-muted/50 p-2 rounded border overflow-x-auto">{r.stdout}</pre>
                              </div>
                            )}
                            {r.stderr && (
                              <div>
                                <p className="font-semibold text-destructive mb-1">Stderr</p>
                                <pre className="bg-destructive/10 p-2 rounded border border-destructive/30 overflow-x-auto">{r.stderr}</pre>
                              </div>
                            )}
                            {r.compile_output && (
                              <div>
                                <p className="font-semibold text-amber-500 mb-1">Compile output</p>
                                <pre className="bg-muted/50 p-2 rounded border overflow-x-auto">{r.compile_output}</pre>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT: editor + bottom panel */}
        <ResizablePanel defaultSize={55} minSize={30}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={65} minSize={25}>
              <div className="h-full flex flex-col">
                {/* Editor toolbar */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-muted/30">
                  <Select value={language} onValueChange={(v) => setLanguage(v as LangId)}>
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </Button>
                </div>
                <div className="flex-1 min-h-0">
                  <MonacoEditor
                    value={code}
                    onChange={handleCodeChange}
                    language={langInfo.monaco}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={35} minSize={15}>
              <Tabs
                value={activeBottomTab}
                onValueChange={(v) => setActiveBottomTab(v as "testcase" | "output")}
                className="h-full flex flex-col"
              >
                <TabsList className="rounded-none justify-start bg-transparent border-b h-10 px-2">
                  <TabsTrigger value="testcase">Test Case</TabsTrigger>
                  <TabsTrigger value="output">Output</TabsTrigger>
                </TabsList>

                <TabsContent value="testcase" className="flex-1 m-0 p-3 overflow-y-auto">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {problem.sampleTests.map((t, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setStdin(t.input)}
                        >
                          Case {i + 1}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">stdin (input passed to your program)</p>
                    <Textarea
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                      className="font-mono text-xs min-h-[120px] resize-none"
                      placeholder="Enter your test input..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="output" className="flex-1 m-0 p-3 overflow-y-auto">
                  {isRunning || isSubmitting ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isSubmitting ? "Judging against hidden test cases..." : "Running..."}
                    </div>
                  ) : submitResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <VerdictBadge verdict={submitResult.verdict} />
                        <span className="text-sm font-medium">
                          {submitResult.passed} / {submitResult.total} passed
                        </span>
                        {submitResult.runtime_ms > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {submitResult.runtime_ms} ms · {(submitResult.memory_kb / 1024).toFixed(1)} MB
                          </span>
                        )}
                      </div>

                      {submitResult.failing_case && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                          <p className="text-xs font-semibold text-destructive">
                            Failed on test case #{(submitResult.failing_case.index ?? 0) + 1}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                            <div>
                              <p className="text-muted-foreground mb-1">Input</p>
                              <pre className="bg-background p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                                {submitResult.failing_case.input}
                              </pre>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Expected</p>
                              <pre className="bg-background p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                                {submitResult.failing_case.expected}
                              </pre>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Got</p>
                              <pre className="bg-background p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                                {submitResult.failing_case.output || "(empty)"}
                              </pre>
                            </div>
                          </div>
                          {submitResult.failing_case.error && (
                            <pre className="text-xs text-destructive bg-background p-2 rounded border overflow-x-auto">
                              {submitResult.failing_case.error}
                            </pre>
                          )}
                        </div>
                      )}

                      {submitResult.stderr && !submitResult.failing_case && (
                        <pre className="text-xs text-destructive bg-destructive/5 p-3 rounded border border-destructive/30 overflow-x-auto whitespace-pre-wrap">
                          {submitResult.stderr}
                        </pre>
                      )}
                    </div>
                  ) : runResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {runResult.status.description}
                        </Badge>
                        {runResult.time !== null && <span>{Math.round(runResult.time * 1000)} ms</span>}
                        {runResult.memory !== null && <span>{(runResult.memory / 1024).toFixed(1)} MB</span>}
                      </div>
                      {runResult.stdout && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">stdout</p>
                          <pre className="text-xs bg-muted/50 p-3 rounded border overflow-x-auto whitespace-pre-wrap">
                            {runResult.stdout}
                          </pre>
                        </div>
                      )}
                      {runResult.stderr && (
                        <div>
                          <p className="text-xs text-destructive mb-1">stderr</p>
                          <pre className="text-xs bg-destructive/5 p-3 rounded border border-destructive/30 overflow-x-auto whitespace-pre-wrap">
                            {runResult.stderr}
                          </pre>
                        </div>
                      )}
                      {runResult.compile_output && (
                        <div>
                          <p className="text-xs text-orange-500 mb-1">compile output</p>
                          <pre className="text-xs bg-orange-500/5 p-3 rounded border border-orange-500/30 overflow-x-auto whitespace-pre-wrap">
                            {runResult.compile_output}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      Hit <strong>Run</strong> to test your code, or <strong>Submit</strong> to grade.
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      <LoginPromptDialog
        open={showLogin}
        onOpenChange={setShowLogin}
        message="Sign in to run and submit code, and to save your progress."
      />
    </div>
  );
};

export default CodingProblemDetail;
