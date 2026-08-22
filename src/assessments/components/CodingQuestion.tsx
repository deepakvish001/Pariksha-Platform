import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MonacoEditor, type MonacoEditorHandle } from "@/components/coding/MonacoEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { LANGUAGES, type LangId } from "@/data/codingProblemsData";
import { useCodeRunner, type RunResult, type SubmitResult, type CaseResult } from "@/hooks/useCodeRunner";
import {
  Play, Send, RotateCcw, WandSparkles, CheckCircle2, XCircle, Loader2, AlertTriangle,
  ChevronDown, ChevronRight, Settings2, Copy, Check, Lightbulb, FileText, History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { PaperQuestion } from "../hooks/usePaper";
import { useEditorPrefs } from "../hooks/useEditorPrefs";

interface Props {
  question: PaperQuestion;
  value: Record<string, unknown> | undefined;
  onChange: (v: Record<string, unknown>) => void;
  isPreview: boolean;
}

const CODING_LANGS = LANGUAGES.filter((l) => l.id !== "sql");
const LANG_EXT: Record<string, string> = {
  python: "py", cpp: "cpp", java: "java", javascript: "js",
  typescript: "ts", c: "c", go: "go",
};

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

interface CodingMeta {
  difficulty?: string;
  constraints?: string[] | string;
  hints?: string[];
  explanation?: string;
}

export function CodingQuestion({ question, value, onChange, isPreview }: Props) {
  const samples = useMemo(
    () => (question.sample_tests ?? []).map((t) => ({ input: t.input, expected: t.expected_output })),
    [question.sample_tests]
  );
  const meta = (question.meta as CodingMeta | null) ?? {};
  const hints = Array.isArray(meta.hints) ? meta.hints : [];
  const constraints = Array.isArray(meta.constraints)
    ? meta.constraints
    : typeof meta.constraints === "string"
    ? meta.constraints.split(/\n+/).filter(Boolean)
    : [];
  const difficulty = meta.difficulty;

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
  const [activeCase, setActiveCase] = useState(0);
  const [openCaseIdx, setOpenCaseIdx] = useState<number | null>(null);
  const { prefs: editorPrefs, update: updateEditorPrefs } = useEditorPrefs();
  const [leftTab, setLeftTab] = useState<"description" | "hints" | "submissions">("description");
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<MonacoEditorHandle>(null);
  const { run, submit, isRunning, isSubmitting } = useCodeRunner();

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

  const handleRun = useCallback(async () => {
    if (!code.trim()) return toast.error("Write some code first");
    setActiveTab("result");
    try {
      const stdin = samples[activeCase]?.input ?? samples[0]?.input ?? "";
      const res = await run({
        source_code: code,
        language_id: langInfo.judge0Id,
        language: lang,
        stdin,
        problem_slug: `assessment-${question.id}`,
      });
      setRunResult(res);
      onChange({
        code, language: lang, language_id: langInfo.judge0Id,
        last_run_result: res, last_submit_result: submitResult,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Run failed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, lang, langInfo, samples, activeCase, question.id]);

  const handleSubmit = useCallback(async () => {
    if (!code.trim()) return toast.error("Write some code first");
    if (samples.length === 0) {
      toast.message("No sample tests — your code will be saved for review.");
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
        code, language: lang, language_id: langInfo.judge0Id,
        last_run_result: runResult, last_submit_result: res,
      });
      if (res.verdict === "ACCEPTED") {
        toast.success(`Accepted — ${res.passed}/${res.total} tests passed`);
      } else {
        toast.message(`${res.verdict} · ${res.passed}/${res.total} tests passed`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submit failed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, lang, langInfo, samples, question.id]);

  // ⌘/Ctrl + Enter and ⌘/Ctrl + Shift + Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          if (!isPreview) handleSubmit();
        } else {
          handleRun();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleRun, handleSubmit, isPreview]);

  const difficultyTone =
    difficulty?.toLowerCase() === "easy"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : difficulty?.toLowerCase() === "hard"
      ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
      : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";

  const acceptedAccent = submitResult?.verdict === "ACCEPTED";

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          "h-[calc(100vh-9rem)] min-h-[560px] rounded-xl border bg-card overflow-hidden shadow-sm",
          acceptedAccent ? "border-emerald-500/40" : "border-border"
        )}
      >
        <ResizablePanelGroup direction="horizontal">
          {/* Left: problem panel with tabs */}
          <ResizablePanel defaultSize={42} minSize={28}>
            <div className="h-full flex flex-col bg-card">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-sm font-semibold truncate">{question.title}</h2>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {difficulty && (
                    <Badge variant="outline" className={cn("text-[10px] capitalize", difficultyTone)}>
                      {difficulty}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px]">{question.points} pts</Badge>
                </div>
              </div>

              <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as typeof leftTab)} className="flex-1 min-h-0 flex flex-col">
                <TabsList className="rounded-none justify-start px-2 h-9 bg-muted/20 border-b border-border gap-0.5">
                  <TabsTrigger value="description" className="text-xs h-7 gap-1.5">
                    <FileText className="h-3 w-3" /> Description
                  </TabsTrigger>
                  {hints.length > 0 && (
                    <TabsTrigger value="hints" className="text-xs h-7 gap-1.5">
                      <Lightbulb className="h-3 w-3" /> Hints
                      <span className="text-[9px] px-1 rounded bg-muted text-muted-foreground tabular-nums">{hints.length}</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="submissions" className="text-xs h-7 gap-1.5">
                    <History className="h-3 w-3" /> Submissions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="flex-1 min-h-0 overflow-y-auto px-4 py-4 m-0 space-y-5">
                  {question.body_md && (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:my-2 prose-pre:bg-muted/60 prose-code:text-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.body_md}</ReactMarkdown>
                    </div>
                  )}
                  {samples.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Examples</h3>
                      {samples.map((t, i) => (
                        <ExampleCard key={i} index={i + 1} input={t.input} expected={t.expected} />
                      ))}
                    </div>
                  )}
                  {constraints.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Constraints</h3>
                      <ul className="text-xs space-y-1.5 pl-4 list-disc marker:text-muted-foreground">
                        {constraints.map((c, i) => (
                          <li key={i} className="font-mono">{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                {hints.length > 0 && (
                  <TabsContent value="hints" className="flex-1 min-h-0 overflow-y-auto px-4 py-4 m-0 space-y-3">
                    {hints.map((h, i) => (
                      <HintBlock key={i} index={i + 1} hint={h} />
                    ))}
                  </TabsContent>
                )}

                <TabsContent value="submissions" className="flex-1 min-h-0 overflow-y-auto px-4 py-4 m-0 space-y-2 text-xs">
                  {submitResult ? (
                    <div className="rounded-md border border-border p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5">
                          <VerdictDot verdict={submitResult.verdict} />
                          {submitResult.verdict}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {submitResult.passed}/{submitResult.total} cases
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        Language: <span className="font-mono">{lang}</span>
                        {submitResult.runtime_ms > 0 && ` · ${submitResult.runtime_ms} ms`}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No submissions yet. Hit Submit to grade your solution.</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: editor + results */}
          <ResizablePanel defaultSize={58} minSize={36}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={62} minSize={30}>
                <div className="h-full flex flex-col">
                  <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2 bg-muted/30">
                    <div className="flex items-center gap-1.5">
                      <Select value={lang} onValueChange={(v) => setLang(v as LangId)}>
                        <SelectTrigger className="h-8 w-[160px] text-xs font-medium">
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
                      <div className="h-5 w-px bg-border mx-1" />
                      <IconBtn tip="Reset to starter" onClick={resetCode}><RotateCcw className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn tip="Format (Shift+Alt+F)" onClick={() => editorRef.current?.format()}>
                        <WandSparkles className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn
                        tip={copied ? "Copied!" : "Copy code"}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(code);
                            setCopied(true);
                            window.setTimeout(() => setCopied(false), 1500);
                          } catch {
                            toast.error("Couldn't copy");
                          }
                        }}
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </IconBtn>
                      <IconBtn
                        tip={`Download .${LANG_EXT[lang] ?? lang}`}
                        onClick={() => {
                          const ext = LANG_EXT[lang] ?? lang;
                          const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `solution.${ext}`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </IconBtn>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Editor settings">
                            <Settings2 className="h-3.5 w-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-56">
                          <p className="text-xs font-semibold mb-3">Editor settings</p>
                          <div className="space-y-3 text-xs">
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-muted-foreground">Font size</span>
                                <span className="font-mono tabular-nums">{editorPrefs.fontSize}px</span>
                              </div>
                              <input
                                type="range"
                                min={11}
                                max={20}
                                value={editorPrefs.fontSize}
                                onChange={(e) => updateEditorPrefs({ fontSize: Number(e.target.value) })}
                                className="w-full accent-primary"
                              />
                              <p className="text-[10px] text-muted-foreground mt-1">Saved across questions.</p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm" variant="outline" onClick={handleRun}
                        disabled={isRunning || isSubmitting} className="h-8 gap-1.5"
                      >
                        {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                        Run
                        <kbd className="hidden md:inline px-1 py-0.5 rounded bg-muted text-[9px] font-mono ml-1 opacity-70">⌘↵</kbd>
                      </Button>
                      <Button
                        size="sm" onClick={handleSubmit}
                        disabled={isRunning || isSubmitting || isPreview}
                        title={isPreview ? "Submit disabled in preview" : "Submit your solution"}
                        className="h-8 gap-1.5 bg-gradient-to-r from-primary to-primary/80 font-semibold"
                      >
                        {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        Submit
                        <kbd className="hidden md:inline px-1 py-0.5 rounded bg-white/15 text-[9px] font-mono ml-1 opacity-90">⌘⇧↵</kbd>
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <MonacoEditor
                      ref={editorRef}
                      value={code}
                      onChange={setCode}
                      language={langInfo.monaco}
                      fontSize={editorPrefs.fontSize}
                    />
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={38} minSize={20}>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "tests" | "result")} className="h-full flex flex-col">
                  <TabsList className="rounded-none justify-start px-3 h-9 bg-muted/30 border-b border-border gap-1">
                    <TabsTrigger value="tests" className="text-xs h-7">Testcase</TabsTrigger>
                    <TabsTrigger value="result" className="text-xs h-7 gap-1.5">
                      Result
                      {submitResult && <VerdictDot verdict={submitResult.verdict} />}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="tests" className="flex-1 min-h-0 overflow-y-auto p-3 m-0">
                    {samples.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No sample tests provided for this problem.</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {samples.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveCase(i)}
                              className={cn(
                                "text-[11px] h-7 px-2.5 rounded-md border font-medium transition",
                                activeCase === i
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              Case {i + 1}
                            </button>
                          ))}
                        </div>
                        <div className="space-y-2 text-xs">
                          <Section title="Input">
                            <pre className="font-mono whitespace-pre-wrap break-words bg-muted/50 rounded-md p-2.5 border border-border">{samples[activeCase]?.input || "—"}</pre>
                          </Section>
                          <Section title="Expected output">
                            <pre className="font-mono whitespace-pre-wrap break-words bg-muted/50 rounded-md p-2.5 border border-border">{samples[activeCase]?.expected || "—"}</pre>
                          </Section>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="result" className="flex-1 min-h-0 overflow-y-auto p-3 m-0">
                    {submitResult ? (
                      <SubmitResultView result={submitResult} openIdx={openCaseIdx} onToggle={setOpenCaseIdx} />
                    ) : runResult ? (
                      <RunResultView result={runResult} expected={samples[activeCase]?.expected} />
                    ) : (
                      <EmptyResult />
                    )}
                  </TabsContent>
                </Tabs>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  );
}

function IconBtn({ tip, onClick, children }: { tip: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClick} aria-label={tip}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

function VerdictDot({ verdict }: { verdict: string }) {
  const ok = verdict === "ACCEPTED";
  return <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-amber-500")} />;
}

function EmptyResult() {
  return (
    <div className="h-full grid place-items-center text-center text-xs text-muted-foreground">
      <div className="space-y-2 max-w-xs">
        <Play className="h-6 w-6 mx-auto text-muted-foreground/60" />
        <p>
          Hit <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">⌘↵</kbd> to run on the
          selected case, or <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">⌘⇧↵</kbd>
          {" "}to submit against all cases.
        </p>
      </div>
    </div>
  );
}

function ExampleCard({ index, input, expected }: { index: number; input: string; expected: string }) {
  const [copied, setCopied] = useState<"in" | "out" | null>(null);
  const copy = async (text: string, which: "in" | "out") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1200);
    } catch { /* noop */ }
  };
  return (
    <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
      <div className="px-3 py-1.5 text-[11px] font-semibold border-b border-border bg-muted/50">
        Example {index}
      </div>
      <div className="grid grid-cols-1 gap-px bg-border">
        <CopyBlock label="Input" value={input} copied={copied === "in"} onCopy={() => copy(input, "in")} />
        <CopyBlock label="Output" value={expected} copied={copied === "out"} onCopy={() => copy(expected, "out")} />
      </div>
    </div>
  );
}

function CopyBlock({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="bg-card p-3 group relative">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
        <button onClick={onCopy} className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 grid place-items-center rounded hover:bg-muted" aria-label={copied ? "Copied" : `Copy ${label.toLowerCase()}`}>
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
        </button>
      </div>
      <pre className="text-xs font-mono whitespace-pre-wrap break-words">{value || "—"}</pre>
    </div>
  );
}

function HintBlock({ index, hint }: { index: number; hint: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-border bg-muted/20 overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-muted/40">
        <span className="flex items-center gap-2 font-medium">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Hint {index}
        </span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 text-xs prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{hint}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

function RunResultView({ result, expected }: { result: RunResult; expected?: string }) {
  const failed = result.status?.id !== 3;
  const matches = expected != null && (result.stdout ?? "").trim() === expected.trim();
  return (
    <div className="space-y-2.5 text-xs">
      <div className={cn(
        "rounded-md border px-3 py-2 flex items-center justify-between",
        failed
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : matches
          ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300"
      )}>
        <span className="font-semibold flex items-center gap-1.5">
          {failed ? <XCircle className="h-3.5 w-3.5" /> : matches ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          {failed ? (result.status?.description ?? "Error") : matches ? "Output matches" : "Ran — output differs"}
        </span>
        <div className="flex items-center gap-3 text-muted-foreground tabular-nums">
          {typeof result.time === "number" && <span>{(result.time * 1000).toFixed(0)} ms</span>}
          {typeof result.memory === "number" && <span>{Math.round(result.memory / 1024)} MB</span>}
        </div>
      </div>
      {result.stdout && (
        <Section title="Your output">
          <pre className="font-mono whitespace-pre-wrap break-words bg-muted/50 rounded-md p-2.5 border border-border">{result.stdout}</pre>
        </Section>
      )}
      {result.stderr && (
        <Section title="Stderr">
          <pre className="font-mono whitespace-pre-wrap break-words bg-destructive/10 text-destructive rounded-md p-2.5 border border-destructive/30">{result.stderr}</pre>
        </Section>
      )}
      {result.compile_output && (
        <Section title="Compile output">
          <pre className="font-mono whitespace-pre-wrap break-words bg-amber-500/10 rounded-md p-2.5 border border-amber-500/30">{result.compile_output}</pre>
        </Section>
      )}
    </div>
  );
}

function SubmitResultView({ result, openIdx, onToggle }: { result: SubmitResult; openIdx: number | null; onToggle: (idx: number | null) => void }) {
  const accepted = result.verdict === "ACCEPTED";
  const pct = result.total > 0 ? (result.passed / result.total) * 100 : 0;
  return (
    <div className="space-y-3 text-xs">
      <div className={cn(
        "rounded-lg border p-3 space-y-2",
        accepted
          ? "border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5"
          : "border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-amber-500/5"
      )}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          {accepted ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="h-4 w-4" /> Accepted
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <AlertTriangle className="h-4 w-4" /> {result.verdict}
            </div>
          )}
          <div className="flex items-center gap-3 text-muted-foreground tabular-nums text-[11px]">
            <span className="font-semibold text-foreground">{result.passed}/{result.total}</span>
            <span>cases</span>
            {result.runtime_ms > 0 && <span>· {result.runtime_ms} ms</span>}
            {result.memory_kb > 0 && <span>· {Math.round(result.memory_kb / 1024)} MB</span>}
          </div>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>

      {result.case_results && result.case_results.length > 0 && (
        <div className="space-y-1.5">
          {result.case_results.map((c, i) => (
            <CaseRow key={i} c={c} open={openIdx === i} onToggle={() => onToggle(openIdx === i ? null : i)} />
          ))}
        </div>
      )}

      {result.failing_case && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
          <div className="text-[10px] uppercase tracking-wide text-destructive font-bold">
            First failing case · #{result.failing_case.index + 1}
          </div>
          <Section title="Input">
            <pre className="font-mono whitespace-pre-wrap break-words bg-card rounded p-2 border border-border">{result.failing_case.input}</pre>
          </Section>
          <div className="grid grid-cols-2 gap-2">
            <Section title="Your output">
              <pre className="font-mono whitespace-pre-wrap break-words bg-card rounded p-2 border border-destructive/20">{result.failing_case.output || "—"}</pre>
            </Section>
            <Section title="Expected">
              <pre className="font-mono whitespace-pre-wrap break-words bg-card rounded p-2 border border-emerald-500/30">{result.failing_case.expected}</pre>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

function CaseRow({ c, open, onToggle }: { c: CaseResult; open: boolean; onToggle: () => void }) {
  return (
    <div className={cn(
      "rounded-md border transition-colors",
      c.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"
    )}>
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs hover:bg-muted/30 rounded-md">
        <div className="flex items-center gap-2">
          {c.passed
            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            : <XCircle className="h-3.5 w-3.5 text-destructive" />}
          <span className="font-semibold">Case {c.index + 1}</span>
          <Badge variant="outline" className="text-[10px] py-0">{c.status_label}</Badge>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="tabular-nums">{c.time_ms} ms</span>
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-border p-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-card/50">
          <Section title="Input">
            <pre className="font-mono whitespace-pre-wrap break-words bg-muted/50 rounded p-2 max-h-32 overflow-auto">{c.input || "—"}</pre>
          </Section>
          <Section title="Your output">
            <pre className="font-mono whitespace-pre-wrap break-words bg-muted/50 rounded p-2 max-h-32 overflow-auto">{c.stdout || c.stderr || "—"}</pre>
          </Section>
          <Section title="Expected">
            <pre className="font-mono whitespace-pre-wrap break-words bg-muted/50 rounded p-2 max-h-32 overflow-auto">{c.expected || "—"}</pre>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 font-semibold">{title}</div>
      {children}
    </div>
  );
}
