// Per-problem run history. Renders a sortable list of recent Run attempts
// with input, status, exec time and memory. Designed to make scanning
// across attempts easy. Each row is collapsible to reveal stdin / stdout /
// stderr / compile output.
import { useMemo, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, CheckCircle2, XCircle, AlertTriangle, Clock, HelpCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CodeRunRow } from "@/hooks/useCodeRuns";

type SortMode = "newest" | "oldest" | "fastest";
type Verdict = "accepted" | "wrong" | "error" | "pending" | "unknown";

interface VerdictMeta {
  verdict: Verdict;
  label: string;
  icon: LucideIcon;
  className: string;
  description: string;
  hint: string;
}

// Maps a raw status string from the runner into a normalized verdict bucket
// with its display metadata (label, icon, color, screen-reader description).
function getVerdictMeta(status: string | null): VerdictMeta {
  const s = (status ?? "").toLowerCase().trim();

  // Accepted: solution matched expected output
  if (/(accepted|^ac$|\bac\b|successful|^ok$|passed|correct)/.test(s)) {
    return {
      verdict: "accepted",
      label: "Accepted",
      icon: CheckCircle2,
      className:
        "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      description: "Accepted — output matched expected results",
      hint: "Your solution passed all test cases. Try to optimize time or memory next.",
    };
  }

  // Wrong Answer: ran successfully but output didn't match
  if (/(wrong|^wa$|mismatch|incorrect|failed test)/.test(s)) {
    return {
      verdict: "wrong",
      label: "Wrong Answer",
      icon: XCircle,
      className:
        "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      description: "Wrong answer — output did not match expected",
      hint: "Compare your output with the expected output in the diff view. Check edge cases (empty input, duplicates, ordering, off-by-one).",
    };
  }

  // Pending / running
  if (/(pending|queued|running|in[_\s-]?progress)/.test(s)) {
    return {
      verdict: "pending",
      label: "Pending",
      icon: Clock,
      className:
        "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
      description: "Run is still in progress",
      hint: "The runner is still processing this attempt. Refresh in a moment to see the verdict.",
    };
  }

  // Error: compile, runtime, timeout, MLE, generic failure
  if (
    /(error|compil|runtime|timeout|^tle$|\btle\b|^mle$|\bmle$|exceeded|abort|crash|failed)/.test(s)
  ) {
    const isTimeout = /timeout|tle/.test(s);
    const isCompile = /compil/.test(s);
    const isRuntime = /runtime/.test(s);
    const isMemory = /mle|memory/.test(s);
    return {
      verdict: "error",
      label: isTimeout
        ? "Time Limit Exceeded"
        : isCompile
          ? "Compile Error"
          : isRuntime
            ? "Runtime Error"
            : isMemory
              ? "Memory Limit Exceeded"
              : "Error",
      icon: AlertTriangle,
      className: "border-destructive/40 bg-destructive/10 text-destructive",
      description: "Execution error",
      hint: isTimeout
        ? "Your code took too long. Look for nested loops, unnecessary recomputation, or a more efficient algorithm."
        : isCompile
          ? "The code didn't compile. Check syntax errors, missing semicolons, imports, or type mismatches in the compile output."
          : isRuntime
            ? "Crashed during execution. Common causes: null/undefined access, division by zero, index out of bounds, stack overflow."
            : isMemory
              ? "Used too much memory. Avoid storing redundant data, free large structures, or use streaming over buffering."
              : "Execution failed. Inspect stderr and compile output for details.",
    };
  }

  return {
    verdict: "unknown",
    label: status ?? "Unknown",
    icon: HelpCircle,
    className: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
    description: "Unknown verdict",
    hint: "We couldn't classify this verdict. Open the run details to inspect the raw output.",
  };
}

interface ProblemRunHistoryProps {
  runs: CodeRunRow[];
}

export const ProblemRunHistory = ({ runs }: ProblemRunHistoryProps) => {
  const [sort, setSort] = useState<SortMode>("newest");

  // Aggregate counts and find the latest verdict (by created_at, regardless of sort)
  const summary = useMemo(() => {
    const counts: Record<Verdict, number> = {
      accepted: 0,
      wrong: 0,
      error: 0,
      pending: 0,
      unknown: 0,
    };
    let latest: { run: CodeRunRow; meta: VerdictMeta } | null = null;
    for (const r of runs) {
      const meta = getVerdictMeta(r.status);
      counts[meta.verdict] += 1;
      if (
        !latest ||
        new Date(r.created_at).getTime() > new Date(latest.run.created_at).getTime()
      ) {
        latest = { run: r, meta };
      }
    }
    return { counts, latest };
  }, [runs]);

  const sorted = useMemo(() => {
    const list = [...runs];
    switch (sort) {
      case "oldest":
        return list.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      case "fastest":
        return list.sort(
          (a, b) =>
            (a.time_ms ?? Number.POSITIVE_INFINITY) -
            (b.time_ms ?? Number.POSITIVE_INFINITY),
        );
      case "newest":
      default:
        return list.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }
  }, [runs, sort]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3">
        {runs.length > 0 && (
          <Card
            className="p-3 bg-muted/20"
            aria-label="Run history summary"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div
                className="flex items-center gap-2 flex-wrap"
                role="group"
                aria-label="Verdict counts"
              >
                <SummaryChip
                  meta={getVerdictMeta("accepted")}
                  count={summary.counts.accepted}
                />
                <SummaryChip
                  meta={getVerdictMeta("wrong")}
                  count={summary.counts.wrong}
                />
                <SummaryChip
                  meta={getVerdictMeta("error")}
                  count={summary.counts.error}
                />
                {summary.counts.pending > 0 && (
                  <SummaryChip
                    meta={getVerdictMeta("pending")}
                    count={summary.counts.pending}
                  />
                )}
                {summary.counts.unknown > 0 && (
                  <SummaryChip
                    meta={getVerdictMeta("unknown")}
                    count={summary.counts.unknown}
                  />
                )}
              </div>
              {summary.latest && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap justify-end">
                  <span>Latest:</span>
                  <span
                    className="font-mono text-[11px]"
                    aria-label={`Attempt number ${runs.length}`}
                  >
                    #{runs.length}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] gap-1 inline-flex items-center cursor-help",
                          summary.latest.meta.className,
                        )}
                        aria-label={`Latest verdict: ${summary.latest.meta.label}`}
                      >
                        {(() => {
                          const Icon = summary.latest.meta.icon;
                          return <Icon className="h-3 w-3" aria-hidden="true" />;
                        })()}
                        <span>{summary.latest.meta.label}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <VerdictTooltipBody
                        meta={summary.latest.meta}
                        rawStatus={summary.latest.run.status}
                        attemptNumber={runs.length}
                        timestamp={summary.latest.run.created_at}
                      />
                    </TooltipContent>
                  </Tooltip>
                  <time
                    dateTime={new Date(summary.latest.run.created_at).toISOString()}
                    className="tabular-nums"
                    title={new Date(summary.latest.run.created_at).toLocaleString()}
                  >
                    <span className="hidden sm:inline">
                      {new Date(summary.latest.run.created_at).toLocaleString()}
                    </span>
                    <span className="sm:hidden">
                      {new Date(summary.latest.run.created_at).toLocaleDateString()}
                    </span>
                  </time>
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Showing {runs.length} recent run{runs.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <label
              htmlFor="run-history-sort"
              className="text-xs text-muted-foreground"
            >
              Sort
            </label>
            <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
              <SelectTrigger
                id="run-history-sort"
                className="h-7 w-[140px] text-xs"
                aria-label="Sort run history"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="fastest">Fastest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      <ol className="space-y-2 list-none p-0 m-0" aria-label="Run history">
        {sorted.map((r, idx) => {
          const meta = getVerdictMeta(r.status);
          const VerdictIcon = meta.icon;
          const panelId = `run-${r.id}-panel`;
          return (
            <li key={r.id}>
              <Collapsible>
                <Card className="p-3 hover:bg-muted/30 transition-colors">
                  <CollapsibleTrigger
                    className="w-full text-left group"
                    aria-controls={panelId}
                    aria-label={`Run #${runs.length - idx} from ${new Date(r.created_at).toLocaleString()} — ${meta.description}${r.status && r.status.toLowerCase() !== meta.label.toLowerCase() ? ` (${r.status})` : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-muted-foreground">
                          #{runs.length - idx}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] gap-1 inline-flex items-center cursor-help",
                                meta.className,
                              )}
                              data-verdict={meta.verdict}
                              aria-label={`${meta.label} — ${meta.description}`}
                            >
                              <VerdictIcon className="h-3 w-3" aria-hidden="true" />
                              <span>{meta.label}</span>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <VerdictTooltipBody meta={meta} rawStatus={r.status} />
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-xs text-muted-foreground truncate">
                          {r.language}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                        {r.time_ms !== null && (
                          <span aria-label={`Execution time ${r.time_ms} milliseconds`}>
                            {r.time_ms} ms
                          </span>
                        )}
                        {r.memory_kb !== null && (
                          <span aria-label={`Memory ${(r.memory_kb / 1024).toFixed(1)} megabytes`}>
                            {(r.memory_kb / 1024).toFixed(1)} MB
                          </span>
                        )}
                        <span className="hidden sm:inline">
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                        <span className="sm:hidden">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                        <ChevronDown
                          className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent
                    id={panelId}
                    className="mt-3 space-y-2 text-xs"
                  >
                    {r.stdin && (
                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">Stdin</p>
                        <pre className="bg-muted/50 p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                          {r.stdin}
                        </pre>
                      </div>
                    )}
                    {r.stdout && (
                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">Stdout</p>
                        <pre className="bg-muted/50 p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                          {r.stdout}
                        </pre>
                      </div>
                    )}
                    {r.stderr && (
                      <div>
                        <p className="font-semibold text-destructive mb-1">Stderr</p>
                        <pre className="bg-destructive/10 p-2 rounded border border-destructive/30 overflow-x-auto whitespace-pre-wrap">
                          {r.stderr}
                        </pre>
                      </div>
                    )}
                    {r.compile_output && (
                      <div>
                        <p className="font-semibold text-amber-500 mb-1">Compile output</p>
                        <pre className="bg-muted/50 p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                          {r.compile_output}
                        </pre>
                      </div>
                    )}
                    {!r.stdin && !r.stdout && !r.stderr && !r.compile_output && (
                      <p className="text-muted-foreground italic">
                        No additional output captured for this run.
                      </p>
                    )}
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </li>
          );
        })}
        </ol>
      </div>
    </TooltipProvider>
  );
};

// Compact summary chip used in the aggregate row above run history.
function SummaryChip({ meta, count }: { meta: VerdictMeta; count: number }) {
  const Icon = meta.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] gap-1 inline-flex items-center cursor-help tabular-nums",
            meta.className,
            count === 0 && "opacity-50",
          )}
          aria-label={`${count} ${meta.label}`}
        >
          <Icon className="h-3 w-3" aria-hidden="true" />
          <span className="font-mono">{count}</span>
          <span>{meta.label}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <VerdictTooltipBody meta={meta} />
      </TooltipContent>
    </Tooltip>
  );
}

// Tooltip body explaining a verdict and offering troubleshooting hints.
function VerdictTooltipBody({
  meta,
  rawStatus,
  attemptNumber,
  timestamp,
}: {
  meta: VerdictMeta;
  rawStatus?: string | null;
  attemptNumber?: number;
  timestamp?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-xs">{meta.label}</p>
        {attemptNumber !== undefined && (
          <span className="text-[10px] font-mono text-muted-foreground">
            Attempt #{attemptNumber}
          </span>
        )}
      </div>
      {timestamp && (
        <p className="text-[10px] text-muted-foreground/80 tabular-nums">
          {new Date(timestamp).toLocaleString()}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground leading-snug">
        {meta.description}
      </p>
      <div className="pt-1 border-t border-border/50">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80 mb-0.5">
          Troubleshooting
        </p>
        <p className="text-[11px] leading-snug">{meta.hint}</p>
      </div>
      {rawStatus &&
        rawStatus.toLowerCase() !== meta.label.toLowerCase() && (
          <p className="text-[10px] text-muted-foreground/70 pt-1 border-t border-border/50">
            Raw status: <span className="font-mono">{rawStatus}</span>
          </p>
        )}
    </div>
  );
}
