import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { OrgShell } from "../../layouts/OrgShell";
import { useAttemptDetail, useGradeAnswer, useFinalizeAttemptScore, useAttemptEvents } from "../../hooks/useAttempts";
import { useAssessment } from "../../hooks/useAssessments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, XCircle, Save } from "lucide-react";
import { toast } from "sonner";
import AttemptProctoringPanel from "../../components/AttemptProctoringPanel";
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

  return (
    <OrgShell
      title={`Attempt — ${cand?.name ?? cand?.email ?? "Candidate"}`}
      actions={
        <Button variant="ghost" size="sm" onClick={() => navigate(paths.b2b.assessment(basePath, assessment))}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      }
    >
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Candidate</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <div className="font-medium">{cand?.name ?? "—"}</div>
            <div className="text-[hsl(var(--muted-foreground))] truncate">{cand?.email}</div>
            {cand?.external_id && <div className="text-xs">ID: {cand.external_id}</div>}
          </CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Status</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <Badge>{data.attempt.status}</Badge>
            {data.attempt.submitted_at && (
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                Submitted {new Date(data.attempt.submitted_at).toLocaleString()}
              </div>
            )}
            <div className="text-xs">Integrity: {data.attempt.integrity_score}</div>
          </CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Score</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold">{totals.earned} <span className="text-sm text-[hsl(var(--muted-foreground))]">/ {totals.max}</span></div>
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
