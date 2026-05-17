import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { OrgShell } from "../../layouts/OrgShell";
import { useAttemptDetail, useGradeAnswer, useFinalizeAttemptScore, useAttemptEvents } from "../../hooks/useAttempts";
import { useAssessment } from "../../hooks/useAssessments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, XCircle, Save, ChevronRight, Clock, Mail, Hash, User, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import AttemptProctoringPanel from "../../components/AttemptProctoringPanel";
import SessionTimelinePlayer from "../../components/SessionTimelinePlayer";
import { AssessmentChatDock } from "@/assessments/components/AssessmentChatDock";
import { ProctorEventFeed } from "@/assessments/components/ProctorEventFeed";
import AttemptSosHistoryPanel from "../../components/AttemptSosHistoryPanel";
import { AttemptFeedbackPanel } from "../../components/AttemptFeedbackPanel";
import { useCurrentOrg, useOrgBasePath } from "../../context/OrgContext";
import { useCanProctor } from "../../hooks/usePermissions";
import { paths } from "@/lib/routing/paths";

export default function AttemptDetail() {
  const { id: idOrSlug, attemptId: attemptIdOrSlug } = useParams();
  const navigate = useNavigate();
  const { org } = useCurrentOrg();
  const basePath = useOrgBasePath();
  // Resolve assessment first so the attempt query can be scoped by it.
  const { data: assessment } = useAssessment(idOrSlug, org?.id);
  const { data, isLoading, error } = useAttemptDetail(attemptIdOrSlug, assessment?.id);
  const grade = useGradeAnswer();
  const finalize = useFinalizeAttemptScore();
  const { data: events } = useAttemptEvents(data?.attempt.id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const { canProctor } = useCanProctor(org?.id);

  const totals = useMemo(() => {
    if (!data) return { earned: 0, max: 0 };
    let earned = 0, max = 0;
    for (const a of data.answers) {
      max += a.question.points ?? 0;
      const s = a.manual_score ?? a.auto_score;
      if (typeof s === "number") earned += s;
    }
    return { earned, max };
  }, [data]);

  const startedAt = data?.attempt.started_at ? new Date(data.attempt.started_at) : null;
  const submittedAt = data?.attempt.submitted_at ? new Date(data.attempt.submitted_at) : null;

  // Build a unified, sorted timeline from start/submit + recorded attempt_events.
  const timeline = useMemo(() => {
    const items: { at: string; label: string; tone?: "ok" | "warn" | "info" }[] = [];
    if (startedAt) items.push({ at: startedAt.toISOString(), label: "Attempt started", tone: "info" });
    for (const ev of (events ?? []) as Array<{ id: string; kind: string; payload: unknown; created_at: string }>) {
      const k = ev.kind ?? "event";
      const friendly = k.replace(/_/g, " ");
      const isWarn = /violation|warning|tab|focus|copy|paste|left|away|exit/i.test(k);
      items.push({ at: ev.created_at, label: friendly, tone: isWarn ? "warn" : "info" });
    }
    if (submittedAt) {
      const finalLabel = data?.attempt.status === "auto_submitted" ? "Auto-submitted" : "Submitted";
      items.push({ at: submittedAt.toISOString(), label: finalLabel, tone: "ok" });
    }
    return items.sort((a, b) => +new Date(a.at) - +new Date(b.at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, data?.attempt.started_at, data?.attempt.submitted_at, data?.attempt.status]);

  if (isLoading) return null;
  if (error) return <OrgShell title="Attempt"><div className="b2b-card p-6">Failed: {(error as Error).message}</div></OrgShell>;
  if (!data || !assessment) return <Navigate to={paths.b2b.assessmentsList(basePath)} replace />;

  // Canonicalise URL: redirect UUIDs to slug form.
  const canonicalAssessmentSeg = assessment.slug ?? assessment.id;
  const canonicalAttemptSeg = data.attempt.slug ?? data.attempt.id;
  if (
    (idOrSlug && idOrSlug !== canonicalAssessmentSeg) ||
    (attemptIdOrSlug && attemptIdOrSlug !== canonicalAttemptSeg)
  ) {
    return <Navigate to={paths.b2b.attempt(basePath, assessment, data.attempt)} replace />;
  }

  const cand = data.attempt.invite;
  const cd = (data.attempt.candidate_details ?? {}) as Record<string, unknown>;
  const candName =
    (cd.fullName as string) || (cd.name as string) || cand?.name || (cd.email as string) || cand?.email || "Candidate";
  const candEmail = (cd.email as string) || cand?.email || "";
  const candExternalId = (cd.externalId as string) || (cd.studentId as string) || cand?.external_id || "";
  const candPhone = (cd.phone as string) || "";

  const assessmentSeg = assessment.slug ?? assessment.id;
  const attemptSeg = data.attempt.slug ?? data.attempt.id;

  const durationMin =
    startedAt && submittedAt
      ? Math.max(0, Math.round((submittedAt.getTime() - startedAt.getTime()) / 60000))
      : null;

  return (
    <OrgShell
      title={`${candName} — ${assessment.title}`}
      actions={
        <Button variant="ghost" size="sm" onClick={() => navigate(paths.b2b.assessment(basePath, assessment))}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      }
    >
      {/* In-page breadcrumb with names + URL slugs */}
      <nav
        aria-label="Candidate breadcrumb"
        className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
      >
        <Link to={paths.b2b.assessmentsList(basePath)} className="hover:text-foreground">
          Assessments
        </Link>
        <ChevronRight className="h-3 w-3 opacity-60" />
        <Link
          to={paths.b2b.assessment(basePath, assessment)}
          className="hover:text-foreground inline-flex items-baseline gap-1"
          title={`/assessments/${assessmentSeg}`}
        >
          <span className="font-medium text-foreground/90">{assessment.title}</span>
          <code className="text-[10px] opacity-60">/{assessmentSeg}</code>
        </Link>
        <ChevronRight className="h-3 w-3 opacity-60" />
        <Link
          to={paths.b2b.assessment(basePath, assessment) + "/attempts"}
          className="hover:text-foreground"
        >
          Attempts
        </Link>
        <ChevronRight className="h-3 w-3 opacity-60" />
        <span className="inline-flex items-baseline gap-1">
          <span className="font-medium text-foreground">{candName}</span>
          <code className="text-[10px] opacity-60">/{attemptSeg}</code>
        </span>
      </nav>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Candidate profile
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="font-medium">{candName}</div>
            {candEmail && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 shrink-0" /> {candEmail}
              </div>
            )}
            {candExternalId && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                <Hash className="h-3 w-3 shrink-0" /> {candExternalId}
              </div>
            )}
            {candPhone && (
              <div className="text-xs text-muted-foreground truncate">{candPhone}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="font-medium truncate" title={assessment.title}>{assessment.title}</div>
            <div className="text-xs text-muted-foreground">Duration: {assessment.duration_min} min</div>
            <div className="text-xs text-muted-foreground">Questions: {data.answers.length}</div>
            <div className="text-[10px] text-muted-foreground/80 truncate">
              <code>/{assessmentSeg}/attempts/{attemptSeg}</code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Status & score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge>{data.attempt.status}</Badge>
              <span className="text-xs text-muted-foreground">
                Integrity: <b className="text-foreground">{data.attempt.integrity_score}</b>
              </span>
            </div>
            <div className="text-2xl font-semibold leading-none">
              {totals.earned}
              <span className="text-sm text-muted-foreground"> / {totals.max}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await finalize.mutateAsync({ attempt_id: data.attempt.id, total: totals.earned });
                toast.success("Final score saved");
              }}
            >
              <Save className="h-3 w-3 mr-1" /> Save total
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Attempt timeline */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Attempt timeline
            {durationMin !== null && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({durationMin} min total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-xs text-muted-foreground">No timeline events recorded yet.</p>
          ) : (
            <ol className="relative border-l border-[hsl(var(--border))] ml-2 space-y-2 max-h-72 overflow-auto">
              {timeline.map((t, i) => (
                <li key={i} className="ml-3 pl-2 py-0.5">
                  <span
                    className={`absolute -left-1.5 mt-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-background ${
                      t.tone === "ok"
                        ? "bg-emerald-500"
                        : t.tone === "warn"
                        ? "bg-amber-500"
                        : "bg-sky-500"
                    }`}
                  />
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="font-medium capitalize">{t.label}</span>
                    <time className="text-muted-foreground tabular-nums">
                      {new Date(t.at).toLocaleString()}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {canProctor && (
        <SessionTimelinePlayer
          attemptId={data.attempt.id}
          attemptStartedAt={data.attempt.started_at}
          orgId={org?.id}
          markers={timeline}
        />
      )}

      {canProctor && <AttemptProctoringPanel attemptId={data.attempt.id} orgId={org?.id} />}

      <AttemptFeedbackPanel attemptId={data.attempt.id} />

      {canProctor && <AttemptSosHistoryPanel attemptId={data.attempt.id} />}

      {canProctor && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Candidate chat</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <AssessmentChatDock
              attemptId={data.attempt.id}
              viewerRole="proctor"
              variant="embedded"
            />
          </CardContent>
        </Card>
      )}

      {canProctor && (
        <div className="mb-4">
          <ProctorEventFeed attemptId={data.attempt.id} />
        </div>
      )}

      <div className="space-y-4">
        {data.answers.length === 0 && (
          <div className="b2b-card p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
            Candidate did not answer any questions.
          </div>
        )}
        {data.answers.map((a, i) => {
          const q = a.question;
          const correctIds = new Set((q.mcq_options ?? []).filter((o) => o.is_correct).map((o) => o.id));
          const selected = new Set<string>(((a.answer?.selected as string[]) ?? []));
          const draft = drafts[a.id] ?? (a.manual_score?.toString() ?? "");

          return (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="uppercase">{q.type}</Badge>
                    <CardTitle className="text-base">Q{i + 1}. {q.title}</CardTitle>
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">{q.points} pts</div>
                </div>
                {q.body_md && <p className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">{q.body_md}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                {(q.type === "mcq" || q.type === "true_false") && (
                  <ul className="space-y-1.5">
                    {(q.mcq_options ?? []).sort((x, y) => x.order_index - y.order_index).map((o) => {
                      const wasSelected = selected.has(o.id);
                      const isCorrect = correctIds.has(o.id);
                      return (
                        <li
                          key={o.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${
                            isCorrect
                              ? "border-green-500/40 bg-green-500/10"
                              : wasSelected
                              ? "border-red-500/40 bg-red-500/10"
                              : "border-[hsl(var(--border))]"
                          }`}
                        >
                          {isCorrect ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : wasSelected ? <XCircle className="h-4 w-4 text-red-600" /> : <span className="h-4 w-4" />}
                          <span className="flex-1">{o.body}</span>
                          {wasSelected && <Badge variant="secondary" className="text-xs">picked</Badge>}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {q.type === "short_answer" && (() => {
                  const given = (a.answer?.text as string) ?? "";
                  const meta = (q.meta as { accepted?: string[]; case_sensitive?: boolean } | null) ?? {};
                  const accepted = meta.accepted ?? [];
                  const cs = !!meta.case_sensitive;
                  const norm = (s: string) => (cs ? s.trim() : s.trim().toLowerCase());
                  const isCorrect = !!given && accepted.some((x) => norm(x) === norm(given));
                  return (
                    <div className="space-y-2">
                      <div className={`px-3 py-2 rounded-md border text-sm flex items-center gap-2 ${isCorrect ? "border-green-500/40 bg-green-500/10" : given ? "border-red-500/40 bg-red-500/10" : "border-[hsl(var(--border))]"}`}>
                        {isCorrect ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : given ? <XCircle className="h-4 w-4 text-red-600" /> : null}
                        <span>{given || <em className="text-muted-foreground">No response</em>}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Accepted: {accepted.join(", ") || "—"}</p>
                    </div>
                  );
                })()}

                {q.type === "matching" && (() => {
                  const meta = (q.meta as { pairs?: { left: string; right: string }[] } | null) ?? {};
                  const pairs = meta.pairs ?? [];
                  const given = (a.answer?.pairs as Record<string, string>) ?? {};
                  return (
                    <ul className="space-y-1.5">
                      {pairs.map((p) => {
                        const g = given[p.left] ?? "";
                        const ok = g === p.right;
                        return (
                          <li key={p.left} className={`grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 px-3 py-2 rounded-md border text-sm ${ok ? "border-green-500/40 bg-green-500/10" : g ? "border-red-500/40 bg-red-500/10" : "border-[hsl(var(--border))]"}`}>
                            <span className="font-medium">{p.left}</span>
                            <span className="text-muted-foreground">→</span>
                            <span>{g || <em className="text-muted-foreground">—</em>}</span>
                            <span className="text-xs text-muted-foreground">expected: {p.right}</span>
                          </li>
                        );
                      })}
                    </ul>
                  );
                })()}

                {q.type === "subjective" && (
                  <pre className="p-3 rounded-md bg-[hsl(var(--muted))] text-sm whitespace-pre-wrap font-sans">
                    {(a.answer?.text as string) ?? <em className="text-[hsl(var(--muted-foreground))]">No response</em>}
                  </pre>
                )}

                {q.type === "sql" && (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Query</p>
                      <pre className="p-3 rounded-md bg-[hsl(var(--muted))] text-xs font-mono whitespace-pre-wrap">
                        {(a.answer?.query as string) ?? "—"}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">Output</p>
                      <pre className="p-3 rounded-md bg-[hsl(var(--muted))] text-xs font-mono whitespace-pre-wrap">
                        {(a.answer?.output as string) ?? "—"}
                      </pre>
                    </div>
                  </div>
                )}

                {q.type === "coding" && (
                  <pre className="p-3 rounded-md bg-[hsl(var(--muted))] text-xs font-mono whitespace-pre-wrap overflow-auto max-h-96">
                    {(a.answer?.code as string) ?? "—"}
                  </pre>
                )}

                <div className="flex items-end justify-between gap-3 pt-2 border-t border-[hsl(var(--border))]">
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    Auto: <b className="text-foreground">{a.auto_score ?? "—"}</b>
                    {" · "}Manual: <b className="text-foreground">{a.manual_score ?? "—"}</b>
                  </div>
                  <div className="flex items-end gap-2">
                    <div>
                      <label className="text-xs text-[hsl(var(--muted-foreground))]">Manual score (0–{q.points})</label>
                      <Input
                        type="number"
                        min={0}
                        max={q.points}
                        value={draft}
                        onChange={(e) => setDrafts((d) => ({ ...d, [a.id]: e.target.value }))}
                        className="w-28 mt-1"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={async () => {
                        const v = draft.trim() === "" ? null : Number(draft);
                        if (v !== null && (Number.isNaN(v) || v < 0 || v > q.points)) {
                          toast.error(`Score must be between 0 and ${q.points}`);
                          return;
                        }
                        await grade.mutateAsync({ id: a.id, manual_score: v, attempt_id: data.attempt.id });
                        toast.success("Saved");
                      }}
                    >
                      <Save className="h-3 w-3 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </OrgShell>
  );
}
