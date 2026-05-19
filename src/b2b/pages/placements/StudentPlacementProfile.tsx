import { useMemo } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrgShell } from "../../layouts/OrgShell";
import { useCurrentOrg } from "../../context/OrgContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Share2, Trophy, Loader2, GraduationCap, Briefcase, Sparkles } from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import { ShareDialog } from "./ShareDialog";
import { useState } from "react";

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[hsl(var(--border))]/70 bg-gradient-to-br from-[hsl(var(--card))]/80 to-[hsl(var(--card))]/40 backdrop-blur-xl ${className}`}>
      <div className="relative">{children}</div>
    </div>
  );
}

export default function StudentPlacementProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const { org, isLoading: orgLoading } = useCurrentOrg();
  const [shareOpen, setShareOpen] = useState(false);

  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ["org_student", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_students")
        .select("*")
        .eq("id", studentId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: score } = useQuery({
    queryKey: ["pss", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("placement_student_scores")
        .select("*")
        .eq("student_id", studentId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: offers } = useQuery({
    queryKey: ["po", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("placement_offers")
        .select("id, role_title, ctc, currency, offered_at, is_dream_offer, recruiter_id")
        .eq("student_id", studentId!)
        .order("offered_at", { ascending: false });
      return data || [];
    },
  });

  const radarData = useMemo(() => {
    const s = (score?.scores as Record<string, number>) || {};
    return [
      { metric: "Assessments", value: s.assessment_score || 0 },
      { metric: "Integrity", value: s.integrity || 0 },
      { metric: "Engagement", value: s.engagement || 0 },
      { metric: "Shortlist", value: s.shortlist_rate || 0 },
      { metric: "Offers", value: s.offer_factor || 0 },
    ];
  }, [score]);

  if (orgLoading || studentLoading) return null;
  if (!org) return <Navigate to="/b2b" replace />;
  if (!student) return <Navigate to="/b2b/placements" replace />;

  const total = Number(score?.score ?? 0);

  return (
    <OrgShell
      title="Student Placement Profile"
      actions={
        <Button size="sm" onClick={() => setShareOpen(true)}>
          <Share2 className="h-4 w-4 mr-1.5" /> Share with HR
        </Button>
      }
    >
      <div className="px-4 sm:px-6 lg:px-8 py-5 space-y-5 max-w-6xl mx-auto">
        <Button asChild variant="ghost" size="sm">
          <Link to="/b2b/placements"><ArrowLeft className="h-4 w-4 mr-1.5" />Back to Placements</Link>
        </Button>

        {/* Header */}
        <GlassCard className="p-5">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 grid place-items-center text-2xl font-semibold">
              {(student.full_name || student.email)[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-semibold tracking-tight">{student.full_name || student.email}</h2>
                {score?.is_multi_offer && <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">Multi-offer</Badge>}
                {score?.is_placed && !score?.is_multi_offer && <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30">Placed</Badge>}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {student.roll_number ? `${student.roll_number} · ` : ""}{student.branch || "—"} · Batch {student.batch_year || "—"}{student.section ? ` · Sec ${student.section}` : ""}
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">{student.email}</div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
                <div className={`text-4xl font-bold tabular-nums ${total >= 80 ? "text-emerald-400" : total >= 60 ? "text-amber-400" : "text-muted-foreground"}`}>
                  {total.toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rank</div>
                <div className="text-2xl font-semibold flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-amber-400" />#{score?.rank_in_org ?? "—"}
                </div>
                <div className="text-[10px] text-muted-foreground">#{score?.rank_in_branch ?? "—"} in branch</div>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Strengths radar */}
          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" /> Strengths breakdown
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border)/0.4)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Stats grid */}
          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-primary" /> Key stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Assessments taken", score?.assessments_taken ?? 0],
                ["Avg score", score?.avg_assessment_score?.toFixed(1) ?? "—"],
                ["Avg integrity", score?.avg_integrity?.toFixed(1) ?? "—"],
                ["Drive applications", score?.applications_count ?? 0],
                ["Shortlisted", score?.shortlisted_count ?? 0],
                ["Offers", score?.offers_count ?? 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg border border-[hsl(var(--border))]/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
                  <div className="text-xl font-semibold mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Offers timeline */}
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-primary" /> Offers ({offers?.length ?? 0})
          </h3>
          {!offers?.length ? (
            <div className="text-sm text-muted-foreground py-6 text-center">No offers recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {offers.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))]/40 p-3">
                  <div>
                    <div className="font-medium">
                      {o.role_title || "Offer"}{o.is_dream_offer && <Badge className="ml-2 text-[10px]" variant="outline">Dream</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(o.offered_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{o.ctc ? `${o.currency} ${(Number(o.ctc) / 100000).toFixed(1)}L` : "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {shareOpen && (
        <ShareDialog
          orgId={org.id}
          target={{ kind: "profile", studentId: student.id, studentName: student.full_name || student.email }}
          onClose={() => setShareOpen(false)}
        />
      )}
    </OrgShell>
  );
}
