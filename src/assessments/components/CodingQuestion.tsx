import { useEffect, useMemo, useRef, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MonacoEditor, type MonacoEditorHandle } from "@/components/coding/MonacoEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LANGUAGES, type LangId } from "@/data/codingProblemsData";
import { useCodeRunner, type RunResult, type SubmitResult, type CaseResult } from "@/hooks/useCodeRunner";
import { Play, Send, RotateCcw, WandSparkles, CheckCircle2, XCircle, Loader2, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { PaperQuestion } from "../hooks/usePaper";

interface Props {
  question: PaperQuestion;
  value: Record<string, unknown> | undefined;
  onChange: (v: Record<string, unknown>) => void;
  isPreview: boolean;
}

// Coding language pool (exclude SQL — that's a separate question type)
const CODING_LANGS = LANGUAGES.filter((l) => l.id !== "sql");

function pickInitialLang(question: PaperQuestion, value: Record<string, unknown> | undefined): LangId {
  const fromAnswer = value?.language as LangId | undefined;
  if (fromAnswer && CODING_LANGS.some((l) => l.id === fromAnswer)) return fromAnswer;
  const hint = (question.language ?? "").toLowerCase();
  const direct = CODING_LANGS.find((l) => l.id === hint || l.monaco === hint);
  if (direct) return direct.id;
  if (hint.includes("c++") || hint === "cpp") return "cpp";
  if (hint.includes("node") || hint.includes("js")) return "javascript";
  if (hint.includes("ts")) return "typescript";
  return "python";
}

export function CodingQuestion({ question, value, onChange, isPreview }: Props) {
  const samples = useMemo(
    () => (question.sample_tests ?? []).map((t) => ({ input: t.input, expected: t.expected_output })),
    [question.sample_tests]
  );

  const [lang, setLang] = useState<LangId>(() => pickInitialLang(question, value));
  const langInfo = useMemo(() => CODING_LANGS.find((l) => l.id === lang)!, [lang]);
  const starter = question.starter_code ?? "";
  const [code, setCode] = useState<string>(() => (value?.code as string | undefined) ?? starter);
  const [runResult, setRunResult] = useState<RunResult | null>(
    (value?.last_run_result as RunResult | undefined) ?? null
  );
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(
    (value?.last_submit_result as SubmitResult | undefined) ?? null
  );
  const [activeTab, setActiveTab] = useState<"tests" | "result">("tests");
  const [openCaseIdx, setOpenCaseIdx] = useState<number | null>(null);
  const editorRef = useRef<MonacoEditorHandle>(null);
  const { run, submit, isRunning, isSubmitting } = useCodeRunner();

  // Persist when code / lang changes (debounced via parent autosave)
  useEffect(() => {
    onChange({
      code,
      language: lang,
      language_id: langInfo.judge0Id,
      last_run_result: runResult,
      last_submit_result: submitResult,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, lang]);

  const resetCode = () => {
    if (!confirm("Reset your code to the starter template?")) return;
    setCode(starter);
  };

  const handleRun = async () => {
    if (!code.trim()) return toast.error("Write some code first");
    setActiveTab("result");
    try {
      const stdin = samples[0]?.input ?? "";
      const res = await run({
        source_code: code,
        language_id: langInfo.judge0Id,
        language: lang,
        stdin,
        problem_slug: `assessment-${question.id}`,
      });
      setRunResult(res);
      onChange({
        code,
        language: lang,
        language_id: langInfo.judge0Id,
        last_run_result: res,
        last_submit_result: submitResult,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Run failed");
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) return toast.error("Write some code first");
    if (samples.length === 0) {
      toast.message("No sample tests on this question — your code will be saved and reviewed.");
      onChange({
        code,
        language: lang,
        language_id: langInfo.judge0Id,
        last_run_result: runResult,
        last_submit_result: submitResult,
      });
      return;
    }
    setActiveTab("result");
    try {
      const res = await submit({
        source_code: code,
        language: lang,
        language_id: langInfo.judge0Id,
        problem_slug: `assessment-${question.id}`,
        tests: samples,
      });
      setSubmitResult(res);
      onChange({
        code,
        language: lang,
        language_id: langInfo.judge0Id,
        last_run_result: runResult,
        last_submit_result: res,
      });
      if (res.verdict === "ACCEPTED") {
        toast.success(`Accepted — ${res.passed}/${res.total} tests passed`);
      } else {
        toast.message(`${res.verdict} · ${res.passed}/${res.total} tests passed`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submit failed");
    }
  };

  return (
    <div className="h-[calc(100vh-9rem)] min-h-[520px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        {/* Left: problem statement */}
        <ResizablePanel defaultSize={42} minSize={28}>
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-[hsl(var(--border))] flex items-center justify-between gap-2 bg-[hsl(var(--muted))]/30">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="uppercase text-[10px]">Coding</Badge>
                <h2 className="text-sm font-semibold truncate">{question.title}</h2>
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">{question.points} pts</Badge>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
              {question.body_md && (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                  {question.body_md}
                </div>
              )}
              {samples.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Examples</h3>
                  {samples.map((t, i) => (
                    <div key={i} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 overflow-hidden">
                      <div className="px-3 py-1.5 text-[11px] font-medium border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/60">
                        Example {i + 1}
                      </div>
                      <div className="grid grid-cols-1 gap-px bg-[hsl(var(--border))]">
                        <div className="bg-[hsl(var(--card))] p-3">
                          <div className="text-[10px] uppercase text-muted-foreground mb-1">Input</div>
                          <pre className="text-xs font-mono whitespace-pre-wrap break-words">{t.input || "—"}</pre>
                        </div>
                        <div className="bg-[hsl(var(--card))] p-3">
                          <div className="text-[10px] uppercase text-muted-foreground mb-1">Expected output</div>
                          <pre className="text-xs font-mono whitespace-pre-wrap break-words">{t.expected || "—"}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: editor + results */}
        <ResizablePanel defaultSize={58} minSize={36}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={62} minSize={30}>
              <div className="h-full flex flex-col">
                <div className="px-3 py-2 border-b border-[hsl(var(--border))] flex items-center justify-between gap-2 bg-[hsl(var(--muted))]/30">
                  <div className="flex items-center gap-2">
                    <Select value={lang} onValueChange={(v) => setLang(v as LangId)}>
                      <SelectTrigger className="h-8 w-[160px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CODING_LANGS.map((l) => (
                          <SelectItem key={l.id} value={l.id} className="text-xs">
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={resetCode} title="Reset to starter">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => editorRef.current?.format()}
                      title="Format code"
                    >
                      <WandSparkles className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRun}
                      disabled={isRunning || isSubmitting}
                      className="h-8"
                    >
                      {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
                      Run
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={isRunning || isSubmitting || isPreview}
                      title={isPreview ? "Submit disabled in preview mode" : "Submit your solution"}
                      className="h-8"
                    >
                      {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                      Submit
                    </Button>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <MonacoEditor
                    ref={editorRef}
                    value={code}
                    onChange={setCode}
                    language={langInfo.monaco}
                  />
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={38} minSize={20}>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "tests" | "result")} className="h-full flex flex-col">
                <TabsList className="rounded-none justify-start px-3 h-9 bg-[hsl(var(--muted))]/30 border-b border-[hsl(var(--border))]">
                  <TabsTrigger value="tests" className="text-xs h-7">Testcases</TabsTrigger>
                  <TabsTrigger value="result" className="text-xs h-7 gap-1.5">
                    Result
                    {submitResult && <VerdictDot verdict={submitResult.verdict} />}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="tests" className="flex-1 min-h-0 overflow-y-auto p-3 m-0 space-y-2">
                  {samples.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No sample tests provided for this problem.</p>
                  ) : (
                    samples.map((t, i) => (
                      <div key={i} className="rounded-md border border-[hsl(var(--border))] p-2.5 text-xs">
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                          Case {i + 1} — Input
                        </div>
                        <pre className="font-mono whitespace-pre-wrap break-words bg-[hsl(var(--muted))]/40 rounded p-2">{t.input || "—"}</pre>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-2 mb-1">
                          Expected output
                        </div>
                        <pre className="font-mono whitespace-pre-wrap break-words bg-[hsl(var(--muted))]/40 rounded p-2">{t.expected || "—"}</pre>
                      </div>
                    ))
                  )}
                </TabsContent>
                <TabsContent value="result" className="flex-1 min-h-0 overflow-y-auto p-3 m-0">
                  {submitResult ? (
                    <SubmitResultView
                      result={submitResult}
                      openIdx={openCaseIdx}
                      onToggle={setOpenCaseIdx}
                    />
                  ) : runResult ? (
                    <RunResultView result={runResult} />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Hit <kbd className="px-1.5 py-0.5 rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[10px]">Run</kbd> to test your code, or <kbd className="px-1.5 py-0.5 rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[10px]">Submit</kbd> to grade all cases.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function VerdictDot({ verdict }: { verdict: string }) {
  const ok = verdict === "ACCEPTED";
  return <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-amber-500")} />;
}

function RunResultView({ result }: { result: RunResult }) {
  const failed = result.status?.id !== 3; // Judge0: 3 = Accepted
  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-2">
        {failed ? (
          <Badge variant="destructive" className="text-[10px]">{result.status?.description ?? "Error"}</Badge>
        ) : (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-[10px]">
            Ran successfully
          </Badge>
        )}
        {typeof result.time === "number" && (
          <span className="text-muted-foreground tabular-nums">{(result.time * 1000).toFixed(0)} ms</span>
        )}
        {typeof result.memory === "number" && (
          <span className="text-muted-foreground tabular-nums">{Math.round(result.memory / 1024)} MB</span>
        )}
      </div>
      {result.stdout && (
        <Section title="Stdout">
          <pre className="font-mono whitespace-pre-wrap break-words bg-[hsl(var(--muted))]/40 rounded p-2">{result.stdout}</pre>
        </Section>
      )}
      {result.stderr && (
        <Section title="Stderr">
          <pre className="font-mono whitespace-pre-wrap break-words bg-destructive/10 text-destructive rounded p-2">{result.stderr}</pre>
        </Section>
      )}
      {result.compile_output && (
        <Section title="Compile output">
          <pre className="font-mono whitespace-pre-wrap break-words bg-amber-500/10 rounded p-2">{result.compile_output}</pre>
        </Section>
      )}
    </div>
  );
}

function SubmitResultView({
  result,
  openIdx,
  onToggle,
}: {
  result: SubmitResult;
  openIdx: number | null;
  onToggle: (idx: number | null) => void;
}) {
  const accepted = result.verdict === "ACCEPTED";
  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center gap-3 flex-wrap">
        {accepted ? (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="h-4 w-4" /> Accepted
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
            <AlertTriangle className="h-4 w-4" /> {result.verdict}
          </div>
        )}
        <span className="text-muted-foreground tabular-nums">
          {result.passed}/{result.total} cases
        </span>
        {result.runtime_ms > 0 && (
          <span className="text-muted-foreground tabular-nums">Runtime {result.runtime_ms} ms</span>
        )}
        {result.memory_kb > 0 && (
          <span className="text-muted-foreground tabular-nums">Memory {Math.round(result.memory_kb / 1024)} MB</span>
        )}
      </div>

      {result.case_results && result.case_results.length > 0 && (
        <div className="space-y-1.5">
          {result.case_results.map((c, i) => (
            <CaseRow key={i} c={c} open={openIdx === i} onToggle={() => onToggle(openIdx === i ? null : i)} />
          ))}
        </div>
      )}

      {result.failing_case && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wide text-destructive font-semibold">
            Failing case #{result.failing_case.index + 1}
          </div>
          <Section title="Input">
            <pre className="font-mono whitespace-pre-wrap break-words bg-[hsl(var(--card))] rounded p-2">{result.failing_case.input}</pre>
          </Section>
          <div className="grid grid-cols-2 gap-2">
            <Section title="Your output">
              <pre className="font-mono whitespace-pre-wrap break-words bg-[hsl(var(--card))] rounded p-2">{result.failing_case.output || "—"}</pre>
            </Section>
            <Section title="Expected">
              <pre className="font-mono whitespace-pre-wrap break-words bg-[hsl(var(--card))] rounded p-2">{result.failing_case.expected}</pre>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

function CaseRow({ c, open, onToggle }: { c: CaseResult; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-md border border-[hsl(var(--border))]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs hover:bg-[hsl(var(--muted))]/40"
      >
        <div className="flex items-center gap-2">
          {c.passed ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className="font-medium">Case {c.index + 1}</span>
          <Badge variant="outline" className="text-[10px] py-0">{c.status_label}</Badge>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="tabular-nums">{c.time_ms} ms</span>
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-[hsl(var(--border))] p-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <Section title="Input">
            <pre className="font-mono whitespace-pre-wrap break-words bg-[hsl(var(--muted))]/40 rounded p-2 max-h-32 overflow-auto">{c.input || "—"}</pre>
          </Section>
          <Section title="Your output">
            <pre className="font-mono whitespace-pre-wrap break-words bg-[hsl(var(--muted))]/40 rounded p-2 max-h-32 overflow-auto">{c.stdout || c.stderr || "—"}</pre>
          </Section>
          <Section title="Expected">
            <pre className="font-mono whitespace-pre-wrap break-words bg-[hsl(var(--muted))]/40 rounded p-2 max-h-32 overflow-auto">{c.expected || "—"}</pre>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{title}</div>
      {children}
    </div>
  );
}
