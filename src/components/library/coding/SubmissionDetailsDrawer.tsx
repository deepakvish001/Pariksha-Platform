import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VerdictBadge } from "@/components/coding/VerdictBadge";
import { Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { SubmissionPerformancePanel } from "./SubmissionPerformancePanel";
import type { CodeSubmissionRow } from "@/hooks/useCodingSubmissions";

interface Props {
  submission: CodeSubmissionRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Show a skeleton while submissions are still being fetched (e.g. deep-link). */
  loading?: boolean;
}

const copy = async (label: string, text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Couldn't copy ${label.toLowerCase()}`);
  }
};

export const SubmissionDetailsDrawer = ({ submission, open, onOpenChange, loading }: Props) => {
  const { data: percentiles, loading: pctLoading } = usePercentiles(submission);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Submission details</SheetTitle>
        </SheetHeader>

        {loading && !submission ? (
          <div className="mt-4 space-y-4" aria-busy="true" aria-live="polite">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md col-span-2" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-40 w-full rounded-md" />
            </div>
          </div>
        ) : !submission ? (
          <div className="py-12 text-center space-y-4">
            <p className="text-sm text-muted-foreground">Submission not found.</p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <VerdictBadge verdict={submission.verdict} />
                <Badge variant="outline">{submission.language}</Badge>
                <Badge variant="secondary">
                  {submission.passed_tests}/{submission.total_tests} tests
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={async () => {
                  const url = new URL(window.location.href);
                  url.searchParams.set("sub", submission.id);
                  url.hash = "submissions";
                  try {
                    await navigator.clipboard.writeText(url.toString());
                    toast.success("Link copied", {
                      description: "Anyone with this URL will jump straight to this submission.",
                    });
                  } catch {
                    toast.error("Couldn't copy link", { description: url.toString() });
                  }
                }}
              >
                <Link2 className="h-3 w-3" />
                Copy link
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">Runtime</p>
                <p className="font-mono">
                  {submission.runtime_ms !== null ? `${submission.runtime_ms} ms` : "—"}
                </p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-muted-foreground">Memory</p>
                <p className="font-mono">
                  {submission.memory_kb !== null
                    ? `${(submission.memory_kb / 1024).toFixed(1)} MB`
                    : "—"}
                </p>
              </div>
              <div className="rounded-md border p-2 col-span-2">
                <p className="text-muted-foreground">Submitted</p>
                <p>{new Date(submission.created_at).toLocaleString()}</p>
              </div>
            </div>

            {submission.verdict === "Accepted" && (
              <div className="rounded-lg border bg-card/40 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Performance vs. others
                  </p>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="What does Beats X% mean?"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                        We compare your accepted submission's runtime and memory
                        against every other user's <strong>best accepted</strong>{" "}
                        attempt on this problem in {submission.language}. Higher
                        is better — 100% means no one was faster (or used less
                        memory) than you.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {pctLoading ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-14 w-full rounded-md" />
                    <Skeleton className="h-14 w-full rounded-md" />
                  </div>
                ) : !percentiles || percentiles.total_users === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No other accepted {submission.language} submissions yet — you're the first to solve this!
                  </p>
                ) : (
                  <TooltipProvider delayDuration={200}>
                    <div className="grid grid-cols-2 gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "rounded-md border p-2 text-xs cursor-help",
                              beatsTone(percentiles.runtime_beats),
                            )}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5 opacity-80">
                              <Zap className="h-3 w-3" />
                              <span>Runtime</span>
                            </div>
                            <p className="font-semibold text-sm">
                              {percentiles.runtime_beats != null
                                ? `Beats ${percentiles.runtime_beats}%`
                                : "—"}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                          {percentiles.runtime_beats != null && percentiles.runtime_ms != null ? (
                            <>
                              Your submission ran in{" "}
                              <strong>{percentiles.runtime_ms} ms</strong> — faster
                              than <strong>{percentiles.runtime_beats}%</strong> of
                              the {percentiles.total_users} other{" "}
                              {percentiles.total_users === 1 ? "user" : "users"}{" "}
                              who solved this in {submission.language} (using each
                              user's fastest accepted attempt).
                            </>
                          ) : (
                            <>Runtime data wasn't recorded for your submission, so we can't rank it.</>
                          )}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "rounded-md border p-2 text-xs cursor-help",
                              beatsTone(percentiles.memory_beats),
                            )}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5 opacity-80">
                              <MemoryStick className="h-3 w-3" />
                              <span>Memory</span>
                            </div>
                            <p className="font-semibold text-sm">
                              {percentiles.memory_beats != null
                                ? `Beats ${percentiles.memory_beats}%`
                                : "—"}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                          {percentiles.memory_beats != null && percentiles.memory_kb != null ? (
                            <>
                              Your submission used{" "}
                              <strong>{(percentiles.memory_kb / 1024).toFixed(1)} MB</strong>{" "}
                              — less memory than{" "}
                              <strong>{percentiles.memory_beats}%</strong> of the{" "}
                              {percentiles.total_users} other{" "}
                              {percentiles.total_users === 1 ? "user" : "users"}{" "}
                              who solved this in {submission.language} (using each
                              user's lowest-memory accepted attempt).
                            </>
                          ) : (
                            <>Memory data wasn't recorded for your submission, so we can't rank it.</>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Compared against {percentiles.total_users}{" "}
                      {percentiles.total_users === 1 ? "other user" : "other users"}
                      {" "}who solved this in {submission.language}.
                    </p>
                  </TooltipProvider>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Source code
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-xs"
                  onClick={() => copy("Source", submission.source_code)}
                >
                  <Copy className="h-3 w-3" /> Copy
                </Button>
              </div>
              <pre className="text-xs bg-muted/50 p-3 rounded border overflow-x-auto max-h-72">
                <code>{submission.source_code}</code>
              </pre>
            </div>

            {submission.failing_case && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Failing case
                </p>
                <pre className="text-xs bg-destructive/5 border border-destructive/30 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(submission.failing_case, null, 2)}
                </pre>
              </div>
            )}

            {submission.stderr && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                    Stderr
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 text-xs"
                    onClick={() => copy("Stderr", submission.stderr ?? "")}
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
                <pre className="text-xs bg-destructive/5 border border-destructive/30 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {submission.stderr}
                </pre>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
