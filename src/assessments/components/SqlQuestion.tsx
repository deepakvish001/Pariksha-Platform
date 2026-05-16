import { useEffect, useMemo, useRef, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MonacoEditor, type MonacoEditorHandle } from "@/components/coding/MonacoEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCodeRunner, type RunResult } from "@/hooks/useCodeRunner";
import { Play, RotateCcw, Database, Loader2, Table as TableIcon, CheckCircle2, AlertTriangle, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { SqlResultDiff } from "@/components/library/coding/SqlResultDiff";
import type { PaperQuestion } from "../hooks/usePaper";

interface Props {
  question: PaperQuestion;
  value: Record<string, unknown> | undefined;
  onChange: (v: Record<string, unknown>) => void;
}

interface SqlMeta {
  schema?: string;
  seed?: string;
  reference_query?: string;
  tables?: { name: string; columns: { name: string; type?: string }[]; sample?: string[][] }[];
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
        source_code: query,
        language_id: 82, // judge0 SQLite id, unused for SQL but required by signature
        language: "sql",
        problem_slug: `assessment-${question.id}`,
        schema: meta.schema,
        seed: meta.seed,
      });
      setRunResult(res);
      setTab(expected ? "diff" : "result");
      onChange({
        query,
        language: "sql",
        output: res.stdout ?? "",
        last_run_result: res,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Run failed");
    }
  };

  const resetQuery = () => {
    if (!confirm("Reset your query?")) return;
    setQuery(question.starter_code ?? "");
  };

  const tables = useMemo(() => parseTables(meta), [meta]);

  return (
    <div className="h-[calc(100vh-9rem)] min-h-[520px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={40} minSize={26}>
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-[hsl(var(--border))] flex items-center justify-between gap-2 bg-[hsl(var(--muted))]/30">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="uppercase text-[10px]">SQL</Badge>
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
              {expected && (
                <div>
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Expected output</h3>
                  <pre className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-2 text-[11px] font-mono overflow-auto max-h-40 whitespace-pre">{expected}</pre>
                </div>
              )}
              {tables.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5" /> Schema
                  </h3>
                  <div className="space-y-2">
                    {tables.map((t) => (
                      <div key={t.name} className="rounded-md border border-[hsl(var(--border))] overflow-hidden">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[hsl(var(--muted))]/40 text-xs font-medium">
                          <TableIcon className="h-3 w-3" /> {t.name}
                        </div>
                        <div className="p-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] font-mono">
                          {t.columns.map((c) => (
                            <div key={c.name} className="flex items-center justify-between">
                              <span>{c.name}</span>
                              <span className="text-muted-foreground">{c.type ?? ""}</span>
                            </div>
                          ))}
                        </div>
                        {t.sample && t.sample.length > 1 && (
                          <div className="border-t border-[hsl(var(--border))] p-2 overflow-x-auto">
                            <div className="text-[10px] uppercase text-muted-foreground mb-1">Sample rows</div>
                            <pre className="text-[11px] font-mono whitespace-pre">{t.sample.map((r) => r.join("\t")).join("\n")}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {meta.schema && tables.length === 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Schema DDL</h3>
                  <pre className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 p-2 text-[11px] font-mono overflow-auto max-h-48 whitespace-pre">{meta.schema}</pre>
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
                <div className="px-3 py-2 border-b border-[hsl(var(--border))] flex items-center justify-between gap-2 bg-[hsl(var(--muted))]/30">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Database className="h-3.5 w-3.5" /> Query editor
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={resetQuery} title="Reset">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => editorRef.current?.format()} title="Format SQL">
                      <WandSparkles className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" onClick={handleRun} disabled={isRunning} className="h-8">
                      {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
                      Run query
                    </Button>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <MonacoEditor ref={editorRef} value={query} onChange={setQuery} language="sql" />
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={45} minSize={20}>
              <Tabs value={tab} onValueChange={(v) => setTab(v as "result" | "diff")} className="h-full flex flex-col">
                <TabsList className="rounded-none justify-start px-3 h-9 bg-[hsl(var(--muted))]/30 border-b border-[hsl(var(--border))]">
                  <TabsTrigger value="result" className="text-xs h-7">Result</TabsTrigger>
                  {expected && (
                    <TabsTrigger value="diff" className="text-xs h-7 gap-1.5">
                      vs Expected
                      {runResult && <ResultBadge ok={normalize(runResult.stdout) === normalize(expected)} />}
                    </TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="result" className="flex-1 min-h-0 overflow-auto p-3 m-0">
                  {runResult ? (
                    <ResultGrid output={runResult.stdout} stderr={runResult.stderr} />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Hit <kbd className="px-1.5 py-0.5 rounded border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[10px]">Run query</kbd> to see results here.
                    </p>
                  )}
                </TabsContent>
                {expected && (
                  <TabsContent value="diff" className="flex-1 min-h-0 overflow-auto p-3 m-0">
                    {runResult ? (
                      <SqlResultDiff expected={expected} actual={(runResult.stdout ?? "").trim()} />
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
  );
}

function ResultBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
  ) : (
    <AlertTriangle className="h-3 w-3 text-amber-500" />
  );
}

function ResultGrid({ output, stderr }: { output: string; stderr: string }) {
  if (stderr) {
    return (
      <pre className="font-mono text-xs whitespace-pre-wrap break-words bg-destructive/10 text-destructive rounded p-2">
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
      <pre className="font-mono text-xs whitespace-pre-wrap break-words bg-[hsl(var(--muted))]/40 rounded p-2">
        {output}
      </pre>
    );
  }
  const headers = lines[0].split("\t");
  const rows = lines.slice(1).map((l) => l.split("\t"));
  return (
    <div className="overflow-auto rounded-md border border-[hsl(var(--border))]">
      <table className="w-full text-xs font-mono">
        <thead className="bg-[hsl(var(--muted))]/60">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="text-left px-2 py-1.5 font-medium border-b border-[hsl(var(--border))]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="odd:bg-[hsl(var(--muted))]/20">
              {r.map((c, ci) => (
                <td key={ci} className="px-2 py-1 border-b border-[hsl(var(--border))]/50 whitespace-pre">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-2 py-1 text-[10px] text-muted-foreground bg-[hsl(var(--muted))]/30">
        {rows.length} row{rows.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function normalize(s: string | undefined | null): string {
  return (s ?? "").trim().replace(/\s+$/gm, "");
}

function parseTables(meta: SqlMeta): { name: string; columns: { name: string; type?: string }[]; sample?: string[][] }[] {
  if (meta.tables && meta.tables.length > 0) {
    return meta.tables.map((t) => ({
      name: t.name,
      columns: t.columns ?? [],
      sample: t.sample,
    }));
  }
  if (!meta.schema) return [];
  // Very tolerant CREATE TABLE parser — enough to render column lists.
  const out: { name: string; columns: { name: string; type?: string }[] }[] = [];
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?["`]?(\w+)["`]?\s*\(([^;]+)\)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(meta.schema)) !== null) {
    const name = m[1];
    const body = m[2];
    const cols = body
      .split(/,(?![^()]*\))/)
      .map((s) => s.trim())
      .filter((s) => s && !/^(primary|foreign|unique|check|constraint)\s/i.test(s))
      .map((line) => {
        const parts = line.split(/\s+/);
        return { name: parts[0]?.replace(/["`]/g, "") ?? "", type: parts.slice(1, 3).join(" ") };
      })
      .filter((c) => c.name);
    out.push({ name, columns: cols });
  }
  return out;
}
