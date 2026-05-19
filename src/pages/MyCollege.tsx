import { useEffect, useMemo } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useMyEnrollments } from "@/b2b/hooks/useOrgStudents";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Trophy, Activity, ArrowRight, ShieldCheck } from "lucide-react";

function useStudentAssessments(email?: string, orgId?: string) {
  return useQuery({
    queryKey: ["student-assessments", orgId, email],
    enabled: !!email && !!orgId,
    queryFn: async () => {
      const { data: invites } = await supabase
        .from("assessment_invites")
        .select("id, assessment_id, status, expires_at, token, assessment:assessments(id,title,org_id,status,starts_at,ends_at,duration_min)")
        .ilike("email", email!);
      const mine = (invites ?? []).filter((i: any) => i.assessment?.org_id === orgId);
      const ids = Array.from(new Set(mine.map((i: any) => i.assessment_id)));
      let attempts: any[] = [];
      if (ids.length) {
        const { data: at } = await supabase
          .from("assessment_attempts")
          .select("id, assessment_id, status, score_pct, integrity_score, submitted_at")
          .in("assessment_id", ids)
          .ilike("candidate_email", email!);
        attempts = at ?? [];
      }
      return { invites: mine, attempts };
    },
  });
}

export default function MyCollege() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const { data: enrollments, isLoading } = useMyEnrollments(user?.id);
  const primary = enrollments?.[0];
  const { data: agg } = useStudentAssessments(user?.email ?? undefined, primary?.org_id);

  // Apply brand color if present
  useEffect(() => {
    const c = (primary as any)?.org?.brand_color;
    if (c) document.documentElement.style.setProperty("--brand-accent", c);
  }, [primary]);

  if (loading || isLoading) return <div className="min-h-screen grid place-items-center text-sm">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!enrollments || enrollments.length === 0) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="b2b-card p-8 max-w-md text-center">
          <GraduationCap className="h-10 w-10 mx-auto mb-3 text-[hsl(var(--primary))]" />
          <h1 className="text-xl font-semibold mb-1">You're not enrolled in any college yet</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
            Once your college enrolls you, this is where you'll see your dashboard, upcoming assessments, and results.
          </p>
          <Button onClick={() => nav("/learn")} variant="outline">Go to Learn</Button>
        </div>
      </div>
    );
  }

  const org: any = (primary as any).org;
  const invites = agg?.invites ?? [];
  const attempts = agg?.attempts ?? [];
  const now = Date.now();
  const upcoming = invites.filter((i: any) => {
    const a = i.assessment;
    if (!a) return false;
    const ended = a.ends_at && new Date(a.ends_at).getTime() < now;
    const attempted = attempts.some((at) => at.assessment_id === i.assessment_id && (at.status === "submitted" || at.status === "auto_submitted"));
    return !ended && !attempted;
  });
  const past = attempts.filter((a) => a.status === "submitted" || a.status === "auto_submitted");
  const avgScore = useMemo(() => {
    const scored = past.filter((a) => a.score_pct != null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((s, a) => s + Number(a.score_pct), 0) / scored.length);
  }, [past]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b" style={org.brand_color ? { background: `linear-gradient(135deg, ${org.brand_color}22, transparent)` } : {}}>
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center gap-4">
          {org.logo_url ? (
            <img src={org.logo_url} alt={org.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-[hsl(var(--primary))]/10 grid place-items-center">
              <GraduationCap className="h-6 w-6 text-[hsl(var(--primary))]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[hsl(var(--muted-foreground))]">My college</div>
            <h1 className="text-2xl font-bold truncate">{org.name}</h1>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 flex flex-wrap gap-2">
              {primary.roll_number && <Badge variant="outline" className="text-[10px]">Roll {primary.roll_number}</Badge>}
              {primary.branch && <Badge variant="outline" className="text-[10px]">{primary.branch}</Badge>}
              {primary.batch_year && <Badge variant="outline" className="text-[10px]">Batch {primary.batch_year}</Badge>}
              {primary.section && <Badge variant="outline" className="text-[10px]">Section {primary.section}</Badge>}
              <Badge variant="outline" className="text-[10px] capitalize">{primary.status}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="b2b-card p-4">
            <div className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1"><BookOpen className="h-3 w-3" /> Assigned</div>
            <div className="text-2xl font-semibold">{invites.length}</div>
          </div>
          <div className="b2b-card p-4">
            <div className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1"><Activity className="h-3 w-3" /> Upcoming</div>
            <div className="text-2xl font-semibold">{upcoming.length}</div>
          </div>
          <div className="b2b-card p-4">
            <div className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1"><Trophy className="h-3 w-3" /> Completed</div>
            <div className="text-2xl font-semibold">{past.length}</div>
          </div>
          <div className="b2b-card p-4">
            <div className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Avg Score</div>
            <div className="text-2xl font-semibold">{avgScore != null ? `${avgScore}%` : "—"}</div>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-2">Upcoming assessments</h2>
          {upcoming.length === 0 ? (
            <div className="b2b-card p-6 text-sm text-[hsl(var(--muted-foreground))] text-center">
              No upcoming assessments. Your college will assign them here.
            </div>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((i: any) => (
                <li key={i.id} className="b2b-card p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{i.assessment?.title}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      {i.assessment?.duration_min ? `${i.assessment.duration_min} min` : ""}
                      {i.assessment?.starts_at ? ` · opens ${new Date(i.assessment.starts_at).toLocaleString()}` : ""}
                    </div>
                  </div>
                  <Link to={`/assessments/join/${i.token}`}>
                    <Button size="sm">Start <ArrowRight className="h-4 w-4 ml-1" /></Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Past attempts</h2>
          {past.length === 0 ? (
            <div className="b2b-card p-6 text-sm text-[hsl(var(--muted-foreground))] text-center">
              You haven't completed any college assessments yet.
            </div>
          ) : (
            <div className="b2b-card overflow-hidden">
              <ul className="divide-y">
                {past.map((a) => (
                  <li key={a.id} className="px-4 py-3 grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-3 text-sm">
                    <div className="truncate">Attempt</div>
                    <div>{a.score_pct != null ? `${Math.round(a.score_pct)}%` : "—"}</div>
                    <div>{a.integrity_score != null ? `${Math.round(a.integrity_score)}%` : "—"}</div>
                    <div className="text-[hsl(var(--muted-foreground))]">{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : "—"}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {enrollments.length > 1 && (
          <section>
            <h2 className="text-lg font-semibold mb-2">Other enrollments</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {enrollments.slice(1).map((e: any) => (
                <li key={e.id} className="b2b-card p-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span className="font-medium">{e.org?.name}</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">{e.status}</Badge>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
