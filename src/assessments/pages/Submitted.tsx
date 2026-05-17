import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  Sparkles,
  Trophy,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SubmittedResultsBreakdown } from "../components/SubmittedResultsBreakdown";

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

  const hasScore = typeof attempt.score === "number";
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
              {typeof attempt.integrity_score === "number" && (
                <MetaTile
                  label="Integrity"
                  value={`${Math.round(attempt.integrity_score)}%`}
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                />
              )}
            </div>

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
                  <Button onClick={() => navigate("/assessments")}>
                    Back to my assessments
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/dashboard")}>
                    Open dashboard
                    <ExternalLink className="h-4 w-4 ml-1.5" />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {!isPreview && (
          <div className="text-xs text-muted-foreground text-center">
            Issue with your submission? Reach support at{" "}
            <a
              href="mailto:support@parikshaa.app"
              className="inline-flex items-center gap-1 text-foreground hover:text-primary underline-offset-2 hover:underline"
            >
              <Mail className="h-3 w-3" /> support@parikshaa.app
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
