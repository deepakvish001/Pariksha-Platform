import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Mail,
  Pause,
  Play,
  Sparkles,
  Trophy,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SubmittedResultsBreakdown } from "../components/SubmittedResultsBreakdown";
import { ResultsColorKey } from "../components/ResultsColorKey";
import { downloadSubmissionReceipt } from "../lib/submissionReceipt";
import { IntegrityExplanation } from "../components/IntegrityExplanation";
import { IntegrityFactorSummary } from "../components/IntegrityFactorSummary";
import { IntegrityTimeline } from "../components/IntegrityTimeline";
import { SupportLink } from "../components/SupportLink";
import { AssessmentFeedbackForm } from "../components/AssessmentFeedbackForm";
import { supabase } from "@/integrations/supabase/client";

const AUTO_REDIRECT_SECONDS = 10;

interface Attempt {
  id: string;
  status: string;
  started_at?: string | null;
  submitted_at?: string | null;
  score?: number | null;
  integrity_score?: number | null;
}

interface Assessment {
  id: string;
  title: string;
  duration_min?: number | null;
  show_results_to_candidate?: boolean | null;
}

interface Props {
  attempt: Attempt;
  assessment: Assessment;
  isPreview?: boolean;
}

function formatDuration(startISO?: string | null, endISO?: string | null): string | null {
  if (!startISO || !endISO) return null;
  const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const totalSec = Math.round(ms / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  if (mm === 0) return `${ss}s`;
  return `${mm}m ${String(ss).padStart(2, "0")}s`;
}

function formatDateTime(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function MetaTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-card/60 px-3 py-2.5 flex items-center gap-2.5 min-w-0">
      <div className="h-7 w-7 rounded-md bg-muted/60 grid place-items-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
          {label}
        </div>
        <div className="text-sm font-semibold tabular-nums truncate mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export function Submitted({ attempt, assessment, isPreview }: Props) {
  const navigate = useNavigate();

  // Results visibility — admin-controlled per assessment. Recruiter preview always sees everything.
  // Fetch the flag directly since the paper RPC does not return it.
  const [showResults, setShowResults] = useState<boolean>(
    isPreview ? true : assessment.show_results_to_candidate !== false,
  );
  useEffect(() => {
    if (isPreview) return;
    if (typeof assessment.show_results_to_candidate === "boolean") return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("assessments")
        .select("show_results_to_candidate")
        .eq("id", assessment.id)
        .maybeSingle();
      if (!cancelled && data) setShowResults(data.show_results_to_candidate !== false);
    })();
    return () => {
      cancelled = true;
    };
  }, [assessment.id, assessment.show_results_to_candidate, isPreview]);
  const requireFeedback = !isPreview && !showResults;

  // Track if candidate has submitted feedback (gates leaving the page when results are hidden)
  const [feedbackDone, setFeedbackDone] = useState(false);
  useEffect(() => {
    if (!requireFeedback) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("assessment_feedback")
        .select("id")
        .eq("attempt_id", attempt.id)
        .maybeSingle();
      if (!cancelled && data) setFeedbackDone(true);
    })();
    // Re-check every 2s so the action buttons unlock once feedback is submitted.
    const t = setInterval(async () => {
      const { data } = await supabase
        .from("assessment_feedback")
        .select("id")
        .eq("attempt_id", attempt.id)
        .maybeSingle();
      if (data) {
        setFeedbackDone(true);
        clearInterval(t);
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [attempt.id, requireFeedback]);

  // Optional auto-redirect to dashboard after submission — disabled when feedback is required.
  const [autoRedirect, setAutoRedirect] = useState(!isPreview && !requireFeedback);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!autoRedirect || paused) return;
    if (requireFeedback && !feedbackDone) return;
    if (secondsLeft <= 0) {
      navigate("/dashboard");
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [autoRedirect, paused, secondsLeft, navigate, requireFeedback, feedbackDone]);

  const cancelAutoRedirect = () => {
    setAutoRedirect(false);
    setSecondsLeft(AUTO_REDIRECT_SECONDS);
    setPaused(false);
  };

  const hasScore = typeof attempt.score === "number" && showResults;
  const submittedAt = formatDateTime(attempt.submitted_at);
  const elapsed = formatDuration(attempt.started_at, attempt.submitted_at);

  const nextSteps: { title: string; detail: string }[] = isPreview
    ? [
        { title: "Review grading", detail: "Open the recruiter view to inspect per-question grading." },
        { title: "Tune the assessment", detail: "Adjust difficulty, time, or question pool from settings." },
      ]
    : hasScore
      ? [
          { title: "Score available", detail: "Your raw score is shown above. Final results may include grader review." },
          { title: "Recruiter follow-up", detail: "If shortlisted, you'll hear back over email within a few business days." },
          { title: "Keep practicing", detail: "Head back to your dashboard to keep your streak going." },
        ]
      : [
          { title: "Awaiting evaluation", detail: "Descriptive answers and code may need manual review. We'll email you once done." },
          { title: "Recruiter follow-up", detail: "If shortlisted, you'll hear back over email within a few business days." },
          { title: "Keep practicing", detail: "Head back to your dashboard to keep your streak going." },
        ];

  const handleDownloadReceipt = () => {
    try {
      downloadSubmissionReceipt({
        attemptId: attempt.id,
        assessmentTitle: assessment.title,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        score: attempt.score ?? null,
        integrityScore: attempt.integrity_score ?? null,
        durationLabel: elapsed,
        nextSteps,
      });
    } catch (e) {
      toast.error("Couldn't generate receipt", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    }
  };

  return (
    <div className="theme-b2b min-h-screen bg-gradient-to-b from-background via-background to-muted/30 px-4 py-10 sm:py-16">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="overflow-hidden border-emerald-500/30 shadow-xl">
          {/* Hero */}
          <div className="relative bg-gradient-to-br from-emerald-500/25 via-emerald-500/10 to-transparent p-8 text-center border-b border-emerald-500/20">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/25 grid place-items-center mb-4 ring-4 ring-emerald-500/10">
              <Trophy className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300 font-semibold">
              Submission confirmed
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
              You're all done!
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              <span className="font-medium text-foreground">{assessment.title}</span> has been
              submitted{!isPreview && " and shared with the recruiter"}.
            </p>

            {hasScore && (
              <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-emerald-500/40 bg-card/80 backdrop-blur px-5 py-2 shadow-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Score
                </span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {attempt.score}
                </span>
              </div>
            )}
          </div>

          {/* Meta grid */}
          <CardContent className="p-5 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {submittedAt && (
                <MetaTile
                  label="Submitted"
                  value={submittedAt}
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                />
              )}
              {elapsed && (
                <MetaTile
                  label="Time taken"
                  value={elapsed}
                  icon={<Clock className="h-3.5 w-3.5" />}
                />
              )}
              {showResults && typeof attempt.integrity_score === "number" && (
                <MetaTile
                  label="Integrity"
                  value={`${Math.round(attempt.integrity_score)}%`}
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                />
              )}
            </div>

            {showResults && typeof attempt.integrity_score === "number" && (
              <IntegrityExplanation score={attempt.integrity_score} />
            )}

            {showResults && typeof attempt.integrity_score === "number" && (
              <IntegrityFactorSummary
                attemptId={attempt.id}
                assessmentId={assessment.id}
              />
            )}

            {showResults && typeof attempt.integrity_score === "number" && (
              <IntegrityTimeline
                attemptId={attempt.id}
                assessmentId={assessment.id}
                finalScore={attempt.integrity_score}
              />
            )}

            {/* Next steps */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> What's next
              </div>
              <ol className="space-y-1.5">
                {nextSteps.map((s, i) => (
                  <li
                    key={s.title}
                    className="flex items-start gap-3 rounded-md border border-border bg-card/60 px-3 py-2"
                  >
                    <span
                      className={cn(
                        "h-5 w-5 rounded-full grid place-items-center text-[10px] font-bold shrink-0 mt-0.5",
                        "bg-primary/15 text-primary",
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.detail}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Auto-redirect */}
            {!isPreview && (
              <div
                className={cn(
                  "rounded-md border px-3 py-2.5 flex items-center gap-3 text-sm",
                  autoRedirect
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card/60",
                )}
              >
                <div className="flex-1 min-w-0">
                  {autoRedirect ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-bold tabular-nums">
                        {secondsLeft}
                      </span>
                      <span className="truncate">
                        {paused ? "Auto-redirect paused" : "Redirecting to your dashboard…"}
                      </span>
                    </div>
                  ) : (
                    <Label
                      htmlFor="auto-redirect"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      Auto-return to dashboard in {AUTO_REDIRECT_SECONDS}s
                    </Label>
                  )}
                </div>
                {autoRedirect ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPaused((p) => !p)}
                      className="h-8"
                    >
                      {paused ? (
                        <>
                          <Play className="h-3.5 w-3.5 mr-1" /> Resume
                        </>
                      ) : (
                        <>
                          <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelAutoRedirect}
                      className="h-8"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                  </>
                ) : (
                  <Switch
                    id="auto-redirect"
                    checked={autoRedirect}
                    onCheckedChange={(v) => {
                      setSecondsLeft(AUTO_REDIRECT_SECONDS);
                      setPaused(false);
                      setAutoRedirect(v);
                    }}
                  />
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              {isPreview ? (
                <>
                  <Button
                    onClick={() =>
                      navigate(`/b2b/assessments/${assessment.id}/attempts/${attempt.id}`)
                    }
                  >
                    View grading & feedback
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/b2b/assessments/${assessment.id}`)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    Back to assessment
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => navigate("/assessments")}
                    disabled={requireFeedback && !feedbackDone}
                    title={requireFeedback && !feedbackDone ? "Please submit your feedback first" : undefined}
                  >
                    Back to my assessments
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    disabled={requireFeedback && !feedbackDone}
                    title={requireFeedback && !feedbackDone ? "Please submit your feedback first" : undefined}
                  >
                    Open dashboard
                    <ExternalLink className="h-4 w-4 ml-1.5" />
                  </Button>
                </>
              )}
              {showResults && (
                <Button variant="secondary" onClick={handleDownloadReceipt}>
                  <Download className="h-4 w-4 mr-1.5" />
                  Download receipt (PDF)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {!isPreview && (
          <AssessmentFeedbackForm attemptId={attempt.id} assessmentId={assessment.id} />
        )}

        {showResults && <ResultsColorKey />}

        {showResults && <SubmittedResultsBreakdown attemptId={attempt.id} />}


        {!isPreview && <SupportLink attempt={attempt} assessment={assessment} />}

      </div>
    </div>
  );
}
