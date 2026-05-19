import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { OrgShell } from "../layouts/OrgShell";
import { useCurrentOrg } from "../context/OrgContext";
import { useMyOrganizations } from "../hooks/useOrg";
import { useOrgStudent } from "../hooks/useOrgStudents";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Mail, GraduationCap, Calendar, Activity, ExternalLink, Search, ArrowUpDown } from "lucide-react";

function fmt(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return "—"; }
}

function useStudentAttempts(studentEmail?: string, orgId?: string) {
  return useQuery({
    queryKey: ["student-attempts", orgId, studentEmail],
    enabled: !!studentEmail && !!orgId,
    queryFn: async () => {
      // attempts whose invite email matches and assessment belongs to this org
      const { data: invites } = await supabase
        .from("assessment_invites")
        .select("id, assessment_id, status, created_at, assessment:assessments(id,title,org_id,status)")
        .eq("email", studentEmail!.toLowerCase());
      const myInvites = (invites ?? []).filter((i: any) => i.assessment?.org_id === orgId);
      const assessmentIds = Array.from(new Set(myInvites.map((i: any) => i.assessment_id)));
      let attempts: any[] = [];
      if (assessmentIds.length) {
        const { data: at } = await supabase
          .from("assessment_attempts")
          .select("id, assessment_id, status, score_pct, integrity_score, started_at, submitted_at, candidate_email")
          .in("assessment_id", assessmentIds)
          .ilike("candidate_email", studentEmail!);
        attempts = at ?? [];
      }
      const byA = new Map<string, any>();
      myInvites.forEach((i: any) => byA.set(i.assessment_id, i.assessment));
      return { invites: myInvites, attempts, assessments: byA };
    },
  });
}

export default function B2BStudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const { data: orgs } = useMyOrganizations();
  const ctx = useCurrentOrg();
  const org = ctx.org ?? orgs?.[0];
  const basePath = (org as any)?.slug
    ? (org!.type === "college" ? `/colleges/${org!.slug}` : `/companies/${org!.slug}`)
    : "/b2b";
  const { data: student, isLoading } = useOrgStudent(studentId);
  const { data: agg } = useStudentAttempts(student?.email, org?.id);

  const [jumpQuery, setJumpQuery] = useState("");
  type JumpSort = "submitted_desc" | "started_desc" | "score_desc" | "score_asc";
  const [jumpSort, setJumpSort] = useState<JumpSort>("submitted_desc");

  if (!org) return <Navigate to="/b2b/onboarding" replace />;
  if (isLoading) return <OrgShell title="Student"><div className="p-6 text-sm">Loading…</div></OrgShell>;
  if (!student) return <OrgShell title="Student"><div className="p-6 text-sm">Not found.</div></OrgShell>;

  const attempts = agg?.attempts ?? [];
  const completed = attempts.filter((a) => a.status === "submitted" || a.status === "auto_submitted").length;
  const inProgress = attempts.filter((a) => a.status === "in_progress").length;
  const avgScore = (() => {
    const scored = attempts.filter((a) => a.score_pct != null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((s, a) => s + Number(a.score_pct), 0) / scored.length);
  })();
  const avgIntegrity = (() => {
    const scored = attempts.filter((a) => a.integrity_score != null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((s, a) => s + Number(a.integrity_score), 0) / scored.length);
  })();

  return (
    <OrgShell
      title={
        <div className="flex items-center gap-2">
          <Link to={`${basePath}/students`} className="opacity-70 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span>{student.full_name || student.email}</span>
          <Badge variant="outline" className="text-[10px]">{student.status}</Badge>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="b2b-card p-4">
          <div className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1"><Mail className="h-3 w-3" /> Email</div>
          <div className="font-medium truncate">{student.email}</div>
        </div>
        <div className="b2b-card p-4">
          <div className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Roll / Branch / Batch</div>
          <div className="font-medium">
            {student.roll_number ?? "—"} · {student.branch ?? "—"} · {student.batch_year ?? "—"}
          </div>
        </div>
        <div className="b2b-card p-4">
          <div className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1"><Calendar className="h-3 w-3" /> Enrolled</div>
          <div className="font-medium">{fmt(student.enrolled_at)}</div>
          <div className="text-xs text-[hsl(var(--muted-foreground))]">Activated: {fmt(student.activated_at)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <a href="#activity" className="b2b-card p-3 hover:bg-[hsl(var(--muted))/0.3] transition">
          <div className="text-xs text-[hsl(var(--muted-foreground))]">Invites</div>
          <div className="text-2xl font-semibold">{agg?.invites.length ?? 0}</div>
        </a>
        <a href="#activity" className="b2b-card p-3 hover:bg-[hsl(var(--muted))/0.3] transition">
          <div className="text-xs text-[hsl(var(--muted-foreground))]">Attempts</div>
          <div className="text-2xl font-semibold">{attempts.length}</div>
        </a>
        <a href="#activity" className="b2b-card p-3 hover:bg-[hsl(var(--muted))/0.3] transition">
          <div className="text-xs text-[hsl(var(--muted-foreground))]">Completed</div>
          <div className="text-2xl font-semibold">{completed}{inProgress ? <span className="text-xs text-[hsl(var(--muted-foreground))] ml-1">+{inProgress} live</span> : null}</div>
        </a>
        <div className="b2b-card p-3"><div className="text-xs text-[hsl(var(--muted-foreground))]">Avg Score</div><div className="text-2xl font-semibold">{avgScore != null ? `${avgScore}%` : "—"}</div></div>
        <div className="b2b-card p-3"><div className="text-xs text-[hsl(var(--muted-foreground))]">Avg Integrity</div><div className="text-2xl font-semibold">{avgIntegrity != null ? `${avgIntegrity}%` : "—"}</div></div>
      </div>

      {attempts.length > 0 && (() => {
        const q = jumpQuery.trim().toLowerCase();
        const filtered = q
          ? attempts.filter((a) => {
              const title = (agg?.assessments.get(a.assessment_id)?.title ?? "Attempt").toLowerCase();
              const status = String(a.status ?? "").toLowerCase();
              return title.includes(q) || status.includes(q);
            })
          : attempts;
        const ts = (v?: string | null) => (v ? new Date(v).getTime() : 0);
        const sorted = [...filtered].sort((a, b) => {
          switch (jumpSort) {
            case "started_desc":
              return ts(b.started_at) - ts(a.started_at);
            case "score_desc":
              return (b.score_pct ?? -1) - (a.score_pct ?? -1);
            case "score_asc": {
              const av = a.score_pct ?? Number.POSITIVE_INFINITY;
              const bv = b.score_pct ?? Number.POSITIVE_INFINITY;
              return av - bv;
            }
            case "submitted_desc":
            default:
              return ts(b.submitted_at ?? b.started_at) - ts(a.submitted_at ?? a.started_at);
          }
        });
        return (
          <div className="b2b-card p-3 mb-4">
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <div className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Jump to an attempt
              </div>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {sorted.length} of {attempts.length}
              </span>
              <div className="ml-auto flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
                  <Input
                    value={jumpQuery}
                    onChange={(e) => setJumpQuery(e.target.value)}
                    placeholder="Filter by title or status…"
                    aria-label="Filter attempts"
                    className="h-8 pl-7 text-xs"
                  />
                </div>
                <Select value={jumpSort} onValueChange={(v) => setJumpSort(v as JumpSort)}>
                  <SelectTrigger className="h-8 text-xs w-[170px]" aria-label="Sort attempts">
                    <ArrowUpDown className="h-3 w-3 mr-1 opacity-60" aria-hidden="true" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted_desc">Latest submission</SelectItem>
                    <SelectItem value="started_desc">Latest started</SelectItem>
                    <SelectItem value="score_desc">Score (high → low)</SelectItem>
                    <SelectItem value="score_asc">Score (low → high)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
              <div className="ml-auto relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" aria-hidden="true" />
                <Input
                  value={jumpQuery}
                  onChange={(e) => setJumpQuery(e.target.value)}
                  placeholder="Filter by title or status…"
                  aria-label="Filter attempts"
                  className="h-8 pl-7 text-xs"
                />
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="text-xs text-[hsl(var(--muted-foreground))] px-1 py-2">
                No attempts match “{jumpQuery}”.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filtered.map((a) => {
                  const title = agg?.assessments.get(a.assessment_id)?.title ?? "Attempt";
                  const when = a.submitted_at ?? a.started_at;
                  return (
                    <Link
                      key={a.id}
                      to={`${basePath}/assessments/${a.assessment_id}/attempts/${a.id}`}
                      className="text-xs px-2 py-1 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))/0.4] flex items-center gap-1.5 max-w-[260px]"
                      title={`${title} · ${a.status}`}
                    >
                      <span className="truncate">{title}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{a.status}</Badge>
                      {a.score_pct != null && <span className="text-[hsl(var(--muted-foreground))] shrink-0">{Math.round(a.score_pct)}%</span>}
                      <span className="text-[hsl(var(--muted-foreground))] shrink-0">· {fmt(when)}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      <div id="activity" className="b2b-card overflow-hidden scroll-mt-20">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <Activity className="h-4 w-4" /><span className="font-semibold text-sm">Assessment activity</span>
        </div>
        {(agg?.invites ?? []).length === 0 && (
          <div className="p-6 text-sm text-[hsl(var(--muted-foreground))] text-center">
            No assessments assigned yet.
          </div>
        )}
        <ul className="divide-y">
          {(agg?.invites ?? []).map((inv: any) => {
            const matching = attempts.filter((a) => a.assessment_id === inv.assessment_id);
            const latest = matching[0];
            return (
              <li key={inv.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center text-sm">
                <Link to={`${basePath}/assessments/${inv.assessment_id}`} className="font-medium hover:underline truncate">
                  {inv.assessment?.title ?? "Assessment"}
                </Link>
                <Badge variant="outline" className="text-[10px] w-fit">{latest?.status ?? inv.status}</Badge>
                <div>{latest?.score_pct != null ? `${Math.round(latest.score_pct)}%` : "—"}</div>
                <div>{latest?.integrity_score != null ? `${Math.round(latest.integrity_score)}%` : "—"}</div>
                {latest ? (
                  <Link to={`${basePath}/assessments/${inv.assessment_id}/attempts/${latest.id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                ) : <span className="text-xs text-[hsl(var(--muted-foreground))]">No attempt</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </OrgShell>
  );
}
