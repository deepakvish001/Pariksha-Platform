import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Hash,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { OrgShell } from "../../layouts/OrgShell";
import { useAttemptDetail, useAttemptEvents } from "../../hooks/useAttempts";
import { useAssessment } from "../../hooks/useAssessments";
import { useCurrentOrg, useOrgBasePath } from "../../context/OrgContext";
import { paths, parseAttemptSegment, attemptSegment } from "@/lib/routing/paths";
import { Button } from "@/components/ui/button";
import { SectionCard } from "../../components/ui/SectionCard";
import { StatusPill, type StatusTone } from "../../components/ui/StatusPill";
import { EmptyState } from "../../components/ui/EmptyState";
import { FileQuestion } from "lucide-react";

const ATTEMPT_STATUS_TONE: Record<string, StatusTone> = {
  in_progress: "live",
  submitted: "success",
  auto_submitted: "warning",
  expired: "danger",
  abandoned: "warning",
  pending: "neutral",
};

export default function CandidateDetail() {
  const { id: idOrSlug, candidateSeg } = useParams();
  const navigate = useNavigate();
  const { org } = useCurrentOrg();
  const basePath = useOrgBasePath();

  // The candidate segment is `<candidate-slug>--<attempt-key>`.
  const attemptKey = parseAttemptSegment(candidateSeg);
  const { data: assessment } = useAssessment(idOrSlug, org?.id);
  const { data, isLoading, error } = useAttemptDetail(attemptKey, assessment?.id);
  const { data: events } = useAttemptEvents(data?.attempt.id);

  const totals = useMemo(() => {
    if (!data) return { earned: 0, max: 0 };
    let earned = 0;
    let max = 0;
    for (const a of data.answers) {
      max += a.question.points ?? 0;
      const s = a.manual_score ?? a.auto_score;
      if (typeof s === "number") earned += s;
    }
    return { earned, max };
  }, [data]);

  const perQuestion = useMemo(() => {
    if (!data) return [] as Array<{ id: string; title: string; type: string; points: number; score: number | null; status: "correct" | "partial" | "wrong" | "pending" }>;
    return data.answers.map((a: any) => {
      const points = a.question.points ?? 0;
      const score = a.manual_score ?? a.auto_score ?? null;
      let status: "correct" | "partial" | "wrong" | "pending" = "pending";
      if (score === null) status = "pending";
      else if (score >= points && points > 0) status = "correct";
      else if (score > 0) status = "partial";
      else status = "wrong";
      return { id: a.id, title: a.question.title ?? "Untitled", type: a.question.type, points, score, status };
    });
  }, [data]);

  const eventCounts = useMemo(() => {
    const out = { total: 0, warn: 0 } as { total: number; warn: number };
    for (const ev of (events ?? []) as Array<{ kind: string }>) {
      out.total += 1;
      if (/violation|warning|tab|focus|copy|paste|left|away|exit/i.test(ev.kind ?? "")) out.warn += 1;
    }
    return out;
  }, [events]);

  if (isLoading) return null;
  if (error)
    return (
      <OrgShell title="Candidate">
        <div className="b2b-card p-6">Failed: {(error as Error).message}</div>
      </OrgShell>
    );
  if (!data || !assessment) return <Navigate to={paths.b2b.assessmentsList(basePath)} replace />;

  const cand = data.attempt.invite;
  const cd = (data.attempt.candidate_details ?? {}) as Record<string, unknown>;
  const candName =
    (cd.fullName as string) || (cd.name as string) || cand?.name || (cd.email as string) || cand?.email || "Candidate";
  const candEmail = (cd.email as string) || cand?.email || "";
  const candExternalId = (cd.externalId as string) || (cd.studentId as string) || cand?.external_id || "";
  const candPhone = (cd.phone as string) || "";

  const candidateForUrl = {
    name: candName,
    email: candEmail || null,
    external_id: candExternalId || null,
  };

  // Canonicalise the URL: prepend candidate slug + prefer assessment slug.
  const canonicalAssessmentSeg = assessment.slug ?? assessment.id;
  const canonicalCandidateSeg = attemptSegment(data.attempt, candidateForUrl);
  if (
    (idOrSlug && idOrSlug !== canonicalAssessmentSeg) ||
    (candidateSeg && candidateSeg !== canonicalCandidateSeg)
  ) {
    return <Navigate to={paths.b2b.candidate(basePath, assessment, data.attempt, candidateForUrl)} replace />;
  }

  const startedAt = data.attempt.started_at ? new Date(data.attempt.started_at) : null;
  const submittedAt = data.attempt.submitted_at ? new Date(data.attempt.submitted_at) : null;
  const durationMin =
    startedAt && submittedAt
      ? Math.max(0, Math.round((submittedAt.getTime() - startedAt.getTime()) / 60000))
      : null;

  const pct = totals.max > 0 ? Math.round((totals.earned / totals.max) * 100) : null;

  return (
    <OrgShell
      title={candName}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(paths.b2b.attempt(basePath, assessment, data.attempt, candidateForUrl))
            }
          >
            <ExternalLink className="h-4 w-4 mr-1" /> Full attempt review
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(paths.b2b.assessmentManage(basePath, assessment))}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to live
          </Button>
        </div>
      }
    >
      <nav
        aria-label="Candidate breadcrumb"
        className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
      >
        <Link to={paths.b2b.assessmentsList(basePath)} className="hover:text-foreground">
          Assessments
        </Link>
        <ChevronRight className="h-3 w-3 opacity-60" />
        <Link to={paths.b2b.assessment(basePath, assessment)} className="hover:text-foreground">
          {assessment.title}
        </Link>
        <ChevronRight className="h-3 w-3 opacity-60" />
        <Link to={paths.b2b.assessmentManage(basePath, assessment)} className="hover:text-foreground">
          Candidates
        </Link>
        <ChevronRight className="h-3 w-3 opacity-60" />
        <span className="inline-flex items-baseline gap-1">
          <span className="font-medium text-foreground">{candName}</span>
          <code className="text-[10px] opacity-60">/{canonicalCandidateSeg}</code>
        </span>
      </nav>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <SectionCard icon={User} title="Candidate profile">
          <div className="text-sm space-y-1.5">
            <div className="font-medium text-base">{candName}</div>
            {candEmail && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                <Mail className="h-3 w-3 shrink-0" /> {candEmail}
              </div>
            )}
            {candExternalId && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                <Hash className="h-3 w-3 shrink-0" /> {candExternalId}
              </div>
            )}
            {candPhone && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                <Phone className="h-3 w-3 shrink-0" /> {candPhone}
              </div>
            )}
            {!candEmail && !candExternalId && !candPhone && (
              <div className="text-xs text-muted-foreground">No additional profile details.</div>
            )}
          </div>
        </SectionCard>

        <SectionCard icon={FileText} title="Attempt status">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <StatusPill
                tone={ATTEMPT_STATUS_TONE[data.attempt.status] ?? "neutral"}
                pulse={data.attempt.status === "in_progress"}
              >
                {String(data.attempt.status ?? "").replace(/_/g, " ") || "—"}
              </StatusPill>
            </div>
            <div className="text-xs text-muted-foreground">
              Started:{" "}
              <span className="text-foreground/90">
                {startedAt ? startedAt.toLocaleString() : "—"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Submitted:{" "}
              <span className="text-foreground/90">
                {submittedAt ? submittedAt.toLocaleString() : "—"}
              </span>
            </div>
            {durationMin !== null && (
              <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> Took {durationMin} min
              </div>
            )}
            <div className="text-[11px] text-muted-foreground">
              Events: <b className="text-foreground/90">{eventCounts.total}</b>
              {eventCounts.warn > 0 && (
                <span className="ml-1 text-amber-300">({eventCounts.warn} warnings)</span>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={ShieldCheck} title="Score">
          <div className="space-y-1.5">
            <div className="text-[28px] font-semibold leading-none tabular-nums">
              {totals.earned}
              <span className="text-sm text-muted-foreground"> / {totals.max}</span>
            </div>
            {pct !== null && (
              <div className="text-xs text-muted-foreground">{pct}% scored</div>
            )}
            <div className="text-xs text-muted-foreground">
              Integrity:{" "}
              <b
                className={
                  (data.attempt.integrity_score ?? 0) >= 80
                    ? "text-emerald-300"
                    : (data.attempt.integrity_score ?? 0) >= 50
                    ? "text-amber-300"
                    : "text-rose-300"
                }
              >
                {data.attempt.integrity_score ?? "—"}
              </b>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard icon={FileQuestion} title={`Per-question scores (${perQuestion.length})`}>
        {perQuestion.length === 0 ? (
          <EmptyState
            icon={FileQuestion}
            title="No answers submitted"
            description="This candidate hasn't submitted any answers yet."
          />
        ) : (
          <div className="overflow-x-auto -mx-1 b2b-scroll b2b-scroll-slim">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-white/5">
                  <th className="text-left font-medium py-2 px-2">#</th>
                  <th className="text-left font-medium py-2 px-2">Question</th>
                  <th className="text-left font-medium py-2 px-2">Type</th>
                  <th className="text-left font-medium py-2 px-2">Result</th>
                  <th className="text-right font-medium py-2 px-2">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {perQuestion.map((q, i) => (
                  <tr key={q.id} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-2 tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="py-2 px-2 min-w-0">
                      <div className="font-medium truncate" title={q.title}>{q.title}</div>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground capitalize">{q.type}</td>
                    <td className="py-2 px-2">
                      <StatusPill
                        tone={
                          q.status === "correct"
                            ? "success"
                            : q.status === "partial"
                            ? "warning"
                            : q.status === "wrong"
                            ? "danger"
                            : "neutral"
                        }
                      >
                        {q.status}
                      </StatusPill>
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {q.score === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <>
                          {q.score}
                          <span className="text-muted-foreground"> / {q.points}</span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </OrgShell>
  );
}
