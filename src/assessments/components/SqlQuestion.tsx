import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MonacoEditor, type MonacoEditorHandle } from "@/components/coding/MonacoEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCodeRunner, type RunResult } from "@/hooks/useCodeRunner";
import {
  Play, RotateCcw, Database, Loader2, Table as TableIcon, CheckCircle2, AlertTriangle,
  WandSparkles, Settings2, Download, ChevronDown, ChevronRight, Eye, KeyRound
} from "lucide-react";
import { toast } from "sonner";
import { SqlResultDiff } from "@/components/library/coding/SqlResultDiff";
import { cn } from "@/lib/utils";
import type { PaperQuestion } from "../hooks/usePaper";
import { useEditorPrefs } from "../hooks/useEditorPrefs";

interface Props {
  question: PaperQuestion;
  value: Record<string, unknown> | undefined;
  onChange: (v: Record<string, unknown>) => void;
}

interface SqlMeta {
  schema?: string;
  seed?: string;
  reference_query?: string;
  tables?: { name: string; columns: { name: string; type?: string; pk?: boolean }[]; sample?: string[][] }[];
}

export function SqlQuestion({ question, value, onChange }: Props) {
  const meta = (question.meta as SqlMeta | null) ?? {};
  const expected = (question.sample_tests?.[0]?.expected_output ?? "").trim();
  const [query, setQuery] = useState<string>(
    () => (value?.query as string | undefined) ?? question.starter_code ?? ""
  );
  const [runResult, setRunResult] = useState<RunResult | null>(
    (value?.last_run_result as RunResult | undefined) ?? null
  );
  const [tab, setTab] = useState<"result" | "diff">("result");
  const { prefs: editorPrefs, update: updateEditorPrefs } = useEditorPrefs();
  const editorRef = useRef<MonacoEditorHandle>(null);
  const { run, isRunning } = useCodeRunner();

  useEffect(() => {
    onChange({
      query,
      language: "sql",
      output: runResult?.stdout ?? (value?.output ?? ""),
      last_run_result: runResult,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleRun = async () => {
    if (!query.trim()) return toast.error("Write a SQL query first");
    try {
      const res = await run({
        source_code: query, language_id: 82, language: "sql",
        problem_slug: `assessment-${question.id}`, schema: meta.schema, seed: meta.seed,
      });
      setRunResult(res);
      setTab(expected ? "diff" : "result");
      onChange({ query, language: "sql", output: res.stdout ?? "", last_run_result: res });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Run failed");
    }
  };

  const resetQuery = () => {
    if (!confirm("Reset your query?")) return;
    setQuery(question.starter_code ?? "");
  };

  const tables = useMemo(() => parseTables(meta), [meta]);

  const insertText = (text: string) => {
    setQuery((q) => (q && !q.endsWith(" ") && !q.endsWith("\n") ? `${q} ${text}` : `${q}${text}`));
    setTimeout(() => editorRef.current?.focus(), 0);
  };

  const matches = !!runResult && normalize(runResult.stdout) === normalize(expected);
  const accentBorder = matches ? "border-emerald-500/40" : "border-border";

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("h-[calc(100vh-9rem)] min-h-[560px] rounded-xl border bg-card overflow-hidden shadow-sm", accentBorder)}>
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={40} minSize={26}>
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-sm font-semibold truncate">{question.title}</h2>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[10px] border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300 uppercase">SQL</Badge>
                  <Badge variant="secondary" className="text-[10px]">{question.points} pts</Badge>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-5">
                {question.body_md && (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:my-2 prose-pre:bg-muted/60">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.body_md}</ReactMarkdown>
                  </div>
                )}
                {expected && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Expected output</h3>
                    <pre className="rounded-md border border-border bg-muted/40 p-2.5 text-[11px] font-mono overflow-auto max-h-40 whitespace-pre">{expected}</pre>
                  </div>
                )}
                {tables.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2 flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5" /> Schema
                      <span className="text-[10px] text-muted-foreground/70 normal-case font-normal ml-1">(click a column to insert)</span>
                    </h3>
                    <div className="space-y-2">
                      {tables.map((t) => (
                        <SchemaTable key={t.name} table={t} onInsertColumn={(col) => insertText(col)} onInsertTable={(name) => insertText(name)} />
                      ))}
                    </div>
                  </div>
                )}
                {meta.schema && tables.length === 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Schema DDL</h3>
                    <pre className="rounded-md border border-border bg-muted/40 p-2.5 text-[11px] font-mono overflow-auto max-h-48 whitespace-pre">{meta.schema}</pre>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={60} minSize={36}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={55} minSize={28}>
                <div className="h-full flex flex-col">
                  <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2 bg-muted/30">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold px-2 h-8 rounded-md border border-border bg-card">
                        <Database className="h-3.5 w-3.5 text-sky-500" /> Query editor
                      </div>
                      <div className="h-5 w-px bg-border mx-1" />
                      <IconBtn tip="Reset" onClick={resetQuery}><RotateCcw className="h-3.5 w-3.5" /></IconBtn>
                      <IconBtn tip="Format SQL" onClick={() => editorRef.current?.format()}><WandSparkles className="h-3.5 w-3.5" /></IconBtn>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Editor settings">
                            <Settings2 className="h-3.5 w-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-56">
                          <p className="text-xs font-semibold mb-3">Editor settings</p>
                          <div className="text-xs">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-muted-foreground">Font size</span>
                              <span className="font-mono tabular-nums">{editorPrefs.fontSize}px</span>
                            </div>
                            <input
                              type="range" min={11} max={20} value={editorPrefs.fontSize}
                              onChange={(e) => updateEditorPrefs({ fontSize: Number(e.target.value) })}
                              className="w-full accent-primary"
                            />
                            <p className="text-[10px] text-muted-foreground mt-1">Saved across questions.</p>
                          </div>
                        </PopoverContent>
                      </Popover>
                      {meta.reference_query && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 px-2 gap-1 text-[11px]" title="Peek reference (preview only)">
                              <Eye className="h-3.5 w-3.5" /> Peek
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-96">
                            <p className="text-xs font-semibold mb-2">Reference query</p>
                            <pre className="text-[11px] font-mono whitespace-pre-wrap bg-muted/50 rounded-md p-2 border border-border max-h-64 overflow-auto">{meta.reference_query}</pre>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" onClick={handleRun} disabled={isRunning} className="h-8 gap-1.5 bg-gradient-to-r from-primary to-primary/80 font-semibold">
                        {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                        Run query
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <MonacoEditor ref={editorRef} value={query} onChange={setQuery} language="sql" fontSize={editorPrefs.fontSize} />
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={45} minSize={20}>
                <Tabs value={tab} onValueChange={(v) => setTab(v as "result" | "diff")} className="h-full flex flex-col">
                  <TabsList className="rounded-none justify-start px-3 h-9 bg-muted/30 border-b border-border gap-1">
                    <TabsTrigger value="result" className="text-xs h-7">Result</TabsTrigger>
                    {expected && (
                      <TabsTrigger value="diff" className="text-xs h-7 gap-1.5">
                        vs Expected
                        {runResult && <ResultBadge ok={matches} />}
                      </TabsTrigger>
                    )}
                  </TabsList>
                  <TabsContent value="result" className="flex-1 min-h-0 overflow-auto p-3 m-0">
                    {runResult ? (
                      <ResultGrid output={runResult.stdout} stderr={runResult.stderr} timeMs={typeof runResult.time === "number" ? Math.round(runResult.time * 1000) : null} />
                    ) : (
                      <EmptyResult />
                    )}
                  </TabsContent>
                  {expected && (
                    <TabsContent value="diff" className="flex-1 min-h-0 overflow-auto p-3 m-0">
                      {runResult ? (
                        <div className="space-y-3">
                          <div className={cn(
                            "rounded-md border px-3 py-2 flex items-center justify-between text-xs",
                            matches
                              ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                              : "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300"
                          )}>
                            <span className="font-semibold flex items-center gap-1.5">
                              {matches ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                              {matches ? "Output matches expected" : "Output differs from expected"}
                            </span>
                          </div>
                          <SqlResultDiff expected={expected} actual={(runResult.stdout ?? "").trim()} />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Run your query first to compare with the expected output.</p>
                      )}
                    </TabsContent>
                  )}
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
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClick} aria-label={tip}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

function EmptyResult() {
  return (
    <div className="h-full grid place-items-center text-center text-xs text-muted-foreground">
      <div className="space-y-2 max-w-xs">
        <Play className="h-6 w-6 mx-auto text-muted-foreground/60" />
        <p>
          Hit <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">Run query</kbd> to see results here.
        </p>
      </div>
    </div>
  );
}

function SchemaTable({
  table, onInsertColumn, onInsertTable,
}: {
  table: { name: string; columns: { name: string; type?: string; pk?: boolean }[]; sample?: string[][] };
  onInsertColumn: (col: string) => void;
  onInsertTable: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rowCount = table.sample ? Math.max(0, table.sample.length - 1) : null;
  return (
    <div className="rounded-md border border-border overflow-hidden bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 bg-muted/40 hover:bg-muted/60 text-xs"
      >
        <div className="flex items-center gap-1.5 font-semibold">
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <TableIcon className="h-3 w-3 text-sky-500" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onInsertTable(table.name); }}
            className="font-mono hover:text-primary"
            title="Insert table name"
          >
            {table.name}
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{table.columns.length} cols</span>
          {rowCount != null && <span>· {rowCount} rows</span>}
        </div>
      </button>
      {open && (
        <>
          <div className="px-2 py-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono">
            {table.columns.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => onInsertColumn(c.name)}
                className="flex items-center justify-between gap-2 px-1.5 py-1 rounded hover:bg-primary/10 hover:text-primary text-left"
                title="Insert column name"
              >
                <span className="flex items-center gap-1.5 truncate">
                  {c.pk && <KeyRound className="h-2.5 w-2.5 text-amber-500 shrink-0" />}
                  <span className="truncate">{c.name}</span>
                </span>
                <span className="text-muted-foreground text-[10px] shrink-0">{c.type ?? ""}</span>
              </button>
            ))}
          </div>
          {table.sample && table.sample.length > 1 && (
            <div className="border-t border-border p-2 overflow-x-auto bg-muted/20">
              <div className="text-[10px] uppercase text-muted-foreground mb-1 font-semibold">Sample rows</div>
              <pre className="text-[11px] font-mono whitespace-pre">{table.sample.map((r) => r.join("\t")).join("\n")}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ResultBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
  ) : (
    <AlertTriangle className="h-3 w-3 text-amber-500" />
  );
}

function ResultGrid({ output, stderr, timeMs }: { output: string; stderr: string; timeMs: number | null }) {
  if (stderr) {
    return (
      <pre className="font-mono text-xs whitespace-pre-wrap break-words bg-destructive/10 text-destructive rounded-md p-3 border border-destructive/30">
        {stderr}
      </pre>
    );
  }
  if (!output || !output.trim()) {
    return <p className="text-xs text-muted-foreground">Query ran successfully but returned no rows.</p>;
  }
  const lines = output.split("\n").filter((l) => l.length > 0);
  if (lines.length === 0 || !output.includes("\t")) {
    return (
      <pre className="font-mono text-xs whitespace-pre-wrap break-words bg-muted/50 rounded-md p-3 border border-border">
        {output}
      </pre>
    );
  }
  const headers = lines[0].split("\t");
  const rows = lines.slice(1).map((l) => l.split("\t"));

  const downloadCsv = () => {
    const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "query-result.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3 tabular-nums">
          <span><span className="font-semibold text-foreground">{rows.length}</span> row{rows.length === 1 ? "" : "s"}</span>
          <span><span className="font-semibold text-foreground">{headers.length}</span> cols</span>
          {timeMs != null && <span>· {timeMs} ms</span>}
        </div>
        <Button size="sm" variant="outline" onClick={downloadCsv} className="h-7 px-2 gap-1.5 text-[11px]">
          <Download className="h-3 w-3" /> CSV
        </Button>
      </div>
      <div className="overflow-auto rounded-md border border-border">
        <table className="w-full text-xs font-mono">
          <thead className="bg-muted/60 sticky top-0">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="text-left px-2.5 py-2 font-semibold border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="odd:bg-muted/20 hover:bg-muted/40 transition-colors">
                {r.map((c, ci) => (
                  <td key={ci} className="px-2.5 py-1.5 border-b border-border/50 whitespace-pre">{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function normalize(s: string | undefined | null): string {
  return (s ?? "").trim().replace(/\s+$/gm, "");
}

function parseTables(meta: SqlMeta): { name: string; columns: { name: string; type?: string; pk?: boolean }[]; sample?: string[][] }[] {
  if (meta.tables && meta.tables.length > 0) {
    return meta.tables.map((t) => ({
      name: t.name,
      columns: (t.columns ?? []).map((c) => ({ name: c.name, type: c.type, pk: c.pk })),
      sample: t.sample,
    }));
  }
  if (!meta.schema) return [];
  const out: { name: string; columns: { name: string; type?: string; pk?: boolean }[] }[] = [];
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?["`]?(\w+)["`]?\s*\(([^;]+)\)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(meta.schema)) !== null) {
    const name = m[1];
    const body = m[2];
    const cols = body
      .split(/,(?![^()]*\))/)
      .map((s) => s.trim())
      .filter((s) => s && !/^(foreign|unique|check|constraint)\s/i.test(s))
      .map((line) => {
        const isPkOnly = /^primary\s+key/i.test(line);
        if (isPkOnly) return null;
        const parts = line.split(/\s+/);
        const colName = parts[0]?.replace(/["`]/g, "") ?? "";
        const isPk = /primary\s+key/i.test(line);
        return { name: colName, type: parts.slice(1, 3).join(" "), pk: isPk };
      })
      .filter((c): c is { name: string; type: string; pk: boolean } => !!c && !!c.name);
    out.push({ name, columns: cols });
  }
  return out;
}
