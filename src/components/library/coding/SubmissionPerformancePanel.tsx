import { useCallback, useEffect, useState } from "react";
import { Trophy, Zap, MemoryStick, Info, RefreshCcw, Crown, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { CodeSubmissionRow } from "@/hooks/useCodingSubmissions";

type Mode = "best_per_user" | "all_accepted";

interface PercentileRow {
  total_users: number;
  total_compared: number;
  runtime_beats: number | null;
  memory_beats: number | null;
  runtime_ms: number | null;
  memory_kb: number | null;
  mode: Mode;
}

interface Props {
  submission: CodeSubmissionRow;
}

const MODE_COPY: Record<Mode, { label: string; short: string; cohort: string }> = {
  best_per_user: {
    label: "Best per user",
    short: "best",
    cohort:
      "Each other user contributes once — using their fastest accepted runtime and lowest accepted memory.",
  },
  all_accepted: {
    label: "All accepted",
    short: "all",
    cohort:
      "Every other accepted submission counts individually — users with multiple solves are weighted more.",
  },
};

const beatsTone = (pct: number | null | undefined) => {
  if (pct == null) return "text-muted-foreground border-border bg-muted/30";
  if (pct >= 95) return "text-emerald-400 border-emerald-400/40 bg-emerald-400/10";
  if (pct >= 80) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
  if (pct >= 50) return "text-amber-500 border-amber-500/30 bg-amber-500/10";
  return "text-foreground/80 border-border bg-muted/40";
};

const rankBadge = (pct: number | null | undefined) => {
  if (pct == null) return null;
  if (pct >= 99) return { label: "Top 1%", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40" };
  if (pct >= 95) return { label: "Top 5%", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40" };
  if (pct >= 90) return { label: "Top 10%", className: "bg-amber-500/15 text-amber-400 border-amber-500/40" };
  if (pct >= 75) return { label: "Top 25%", className: "bg-amber-500/15 text-amber-400 border-amber-500/40" };
  return null;
};

const usePercentiles = (submissionId: string | null, isAccepted: boolean, mode: Mode) => {
  const [data, setData] = useState<PercentileRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    if (!submissionId || !isAccepted) return;
    setLoading(true);
    (async () => {
      const { data: rows, error: err } = await supabase.rpc(
        "get_submission_percentiles",
        { _submission_id: submissionId, _mode: mode },
      );
      if (cancelled) return;
      setLoading(false);
      if (err) {
        setError(err.message ?? "Failed to load");
        return;
      }
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (row) setData(row as PercentileRow);
    })();
    return () => {
      cancelled = true;
    };
  }, [submissionId, isAccepted, mode, reloadKey]);

  return { data, loading, error, reload };
};

const NotEnoughDataReason = ({
  hasOwnMetric,
  metricName,
  unit,
  totalCompared,
  cohortLabel,
}: {
  hasOwnMetric: boolean;
  metricName: string;
  unit: string;
  totalCompared: number;
  cohortLabel: string;
}) => {
  if (!hasOwnMetric) {
    return (
      <span>
        <strong>No {unit} data</strong> was recorded for your submission, so we can't rank its{" "}
        {metricName.toLowerCase()}.
      </span>
    );
  }
  return (
    <span>
      None of the {totalCompared} {cohortLabel} have a recorded {unit} value yet, so there's
      nothing to rank against.
    </span>
  );
};

export const SubmissionPerformancePanel = ({ submission }: Props) => {
  const [mode, setMode] = useState<Mode>("best_per_user");
  const isAccepted = submission.verdict === "Accepted";
  const { data, loading, error, reload } = usePercentiles(submission.id, isAccepted, mode);

  if (!isAccepted) return null;

  const cohortLabel =
    data && data.total_compared === 1
      ? mode === "all_accepted"
        ? "other accepted submission"
        : "other user"
      : mode === "all_accepted"
        ? "other accepted submissions"
        : "other users";

  const runtimeBadge = rankBadge(data?.runtime_beats ?? null);
  const memoryBadge = rankBadge(data?.memory_beats ?? null);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-lg border bg-card/40 p-3">
        {/* Header row: title + info + mode toggle */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Performance vs. others
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="What does Beats X% mean?"
                >
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="end"
                collisionPadding={12}
                className="w-[min(20rem,calc(100vw-2rem))] text-xs leading-relaxed"
              >
                We compare your accepted submission's runtime and memory
                against everyone else who solved this problem in{" "}
                {submission.language}. Higher is better — 100% means no one
                was faster (or used less memory) than you.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {(["best_per_user", "all_accepted"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider transition-colors",
                  mode === m
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "border border-transparent text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={mode === m}
                title={MODE_COPY[m].cohort}
              >
                {MODE_COPY[m].short}
              </button>
            ))}
          </div>
        </div>

        {/* Inline formula note */}
        <p className="text-[10.5px] text-muted-foreground mb-2 leading-snug">
          <span className="font-mono text-foreground/80">Beats %</span> = share
          of {mode === "all_accepted" ? "accepted submissions" : "users"} whose{" "}
          {mode === "all_accepted" ? "submission" : "best attempt"} was{" "}
          <strong>slower</strong> (runtime) or used <strong>more memory</strong>.
        </p>

        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-destructive font-medium">
                Couldn't load performance stats
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 break-words">
                {error}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs shrink-0"
              onClick={reload}
            >
              <RefreshCcw className="h-3 w-3" />
              Retry
            </Button>
          </div>
        ) : !data || data.total_users === 0 ? (
          <p className="text-xs text-muted-foreground">
            No other accepted {submission.language} submissions yet — you're the first to solve this!
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {/* Runtime tile */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "rounded-md border p-2 text-xs cursor-help relative",
                      beatsTone(data.runtime_beats),
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 opacity-80 min-w-0">
                        <Zap className="h-3 w-3 shrink-0" />
                        <span className="truncate">Runtime</span>
                      </div>
                      {runtimeBadge && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] h-4 px-1 gap-0.5 font-semibold",
                            runtimeBadge.className,
                          )}
                        >
                          <Crown className="h-2.5 w-2.5" />
                          {runtimeBadge.label}
                        </Badge>
                      )}
                    </div>
                    <p className="font-semibold text-sm">
                      {data.runtime_beats != null
                        ? `Beats ${data.runtime_beats}%`
                        : "—"}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  collisionPadding={12}
                  className="w-[min(20rem,calc(100vw-2rem))] text-xs leading-relaxed"
                >
                  {data.runtime_beats != null && data.runtime_ms != null ? (
                    <>
                      Your submission ran in{" "}
                      <strong>{data.runtime_ms} ms</strong> — faster than{" "}
                      <strong>{data.runtime_beats}%</strong> of {data.total_compared}{" "}
                      {cohortLabel} in {submission.language} ({MODE_COPY[mode].label.toLowerCase()}).
                    </>
                  ) : (
                    <NotEnoughDataReason
                      hasOwnMetric={data.runtime_ms != null}
                      metricName="Runtime"
                      unit="ms"
                      totalCompared={data.total_compared}
                      cohortLabel={cohortLabel}
                    />
                  )}
                </TooltipContent>
              </Tooltip>

              {/* Memory tile */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "rounded-md border p-2 text-xs cursor-help relative",
                      beatsTone(data.memory_beats),
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 opacity-80 min-w-0">
                        <MemoryStick className="h-3 w-3 shrink-0" />
                        <span className="truncate">Memory</span>
                      </div>
                      {memoryBadge && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] h-4 px-1 gap-0.5 font-semibold",
                            memoryBadge.className,
                          )}
                        >
                          <Crown className="h-2.5 w-2.5" />
                          {memoryBadge.label}
                        </Badge>
                      )}
                    </div>
                    <p className="font-semibold text-sm">
                      {data.memory_beats != null
                        ? `Beats ${data.memory_beats}%`
                        : "—"}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="end"
                  collisionPadding={12}
                  className="w-[min(20rem,calc(100vw-2rem))] text-xs leading-relaxed"
                >
                  {data.memory_beats != null && data.memory_kb != null ? (
                    <>
                      Your submission used{" "}
                      <strong>{(data.memory_kb / 1024).toFixed(1)} MB</strong>{" "}
                      — less memory than{" "}
                      <strong>{data.memory_beats}%</strong> of {data.total_compared}{" "}
                      {cohortLabel} in {submission.language} ({MODE_COPY[mode].label.toLowerCase()}).
                    </>
                  ) : (
                    <NotEnoughDataReason
                      hasOwnMetric={data.memory_kb != null}
                      metricName="Memory"
                      unit="KB"
                      totalCompared={data.total_compared}
                      cohortLabel={cohortLabel}
                    />
                  )}
                </TooltipContent>
              </Tooltip>
            </div>

            <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
              Compared against {data.total_compared} {cohortLabel} who solved this in {submission.language}.
              <br />
              <span className="text-[10.5px] opacity-80">
                <span className="font-medium">Cohort:</span> {MODE_COPY[mode].cohort}
              </span>
            </p>
          </>
        )}
      </div>
    </TooltipProvider>
  );
};
