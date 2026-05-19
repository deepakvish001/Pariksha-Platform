import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import {
  Trophy, ExternalLink, Share2, Briefcase, GraduationCap, Sparkles, Mail, FileDown,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { exportStudentHighlightsPdf } from "./exportStudentHighlightsPdf";

type Ranking = {
  student_id: string;
  full_name: string | null;
  email: string;
  roll_number: string | null;
  branch: string | null;
  batch_year: number | null;
  section: string | null;
  score: number;
  rank_in_org: number | null;
  rank_in_branch: number | null;
  assessments_taken: number;
  avg_assessment_score: number | null;
  avg_integrity: number | null;
  applications_count: number;
  shortlisted_count: number;
  offers_count: number;
  is_placed: boolean;
  is_multi_offer: boolean;
  scores: Record<string, number>;
};

const WEIGHTS: { key: string; label: string; weight: number }[] = [
  { key: "assessment_score", label: "Assessment", weight: 0.4 },
  { key: "integrity", label: "Integrity", weight: 0.2 },
  { key: "engagement", label: "Applications", weight: 0.15 },
  { key: "shortlist_rate", label: "Shortlisted", weight: 0.1 },
  { key: "offer_factor", label: "Offer factor", weight: 0.15 },
];

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-orange-400";
  return "text-muted-foreground";
}

function StatusBadge({ r }: { r: Ranking }) {
  if (r.is_multi_offer) return <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">Multi-offer</Badge>;
  if (r.is_placed) return <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 text-[10px]">Placed</Badge>;
  if (r.shortlisted_count > 0) return <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">Shortlisted</Badge>;
  return <Badge variant="outline" className="text-[10px]">Unplaced</Badge>;
}

function Stat({ label, value, tone = "" }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))]/60 bg-[hsl(var(--muted))]/20 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-base font-semibold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

export function StudentMetricsDrawer({
  open, onOpenChange, ranking, onShare,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ranking: Ranking | null;
  onShare: (r: Ranking) => void;
}) {
  const studentId = ranking?.student_id;

  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ["drawer-offers", studentId],
    enabled: !!studentId && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("placement_offers")
        .select("id, role_title, ctc, currency, offered_at, is_dream_offer, recruiter:recruiters(name)")
        .eq("student_id", studentId!)
        .order("offered_at", { ascending: false })
        .limit(5);
      return (data || []) as any[];
    },
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ["drawer-apps", studentId],
    enabled: !!studentId && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("drive_applications")
        .select("id, stage, current_round, last_event_at, drive:placement_drives(title)")
        .eq("student_id", studentId!)
        .order("last_event_at", { ascending: false })
        .limit(5);
      return (data || []) as any[];
    },
  });

  const r = ranking;
  const radarData = r
    ? WEIGHTS.map((w) => ({
        metric: w.label,
        value: Math.max(0, Math.min(100, Number(r.scores?.[w.key] ?? 0))),
      }))
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {!r ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                {r.full_name || r.email}
                <StatusBadge r={r} />
              </SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                {r.roll_number && <span>{r.roll_number}</span>}
                <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>
                {r.branch && <span className="inline-flex items-center gap-1"><GraduationCap className="h-3 w-3" />{r.branch}{r.batch_year ? ` · ${r.batch_year}` : ""}{r.section ? ` · Sec ${r.section}` : ""}</span>}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="h-8">
                <Link to={`/b2b/placements/students/${r.student_id}`}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Full profile
                </Link>
              </Button>
              <Button size="sm" className="h-8" onClick={() => onShare(r)}>
                <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share with HR
              </Button>
            </div>

            {/* Headline metrics */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat label="Score" value={Math.round(r.score)} tone={scoreColor(r.score)} />
              <Stat
                label="Org rank"
                value={r.rank_in_org ? `#${r.rank_in_org}` : "—"}
              />
              <Stat
                label="Branch rank"
                value={r.rank_in_branch ? `#${r.rank_in_branch}` : "—"}
              />
              <Stat label="Assessments" value={r.assessments_taken} />
              <Stat label="Avg %" value={r.avg_assessment_score?.toFixed(0) ?? "—"} />
              <Stat label="Integrity" value={r.avg_integrity?.toFixed(0) ?? "—"} />
              <Stat label="Apps" value={r.applications_count} />
              <Stat label="Shortlists" value={r.shortlisted_count} />
              <Stat label="Offers" value={r.offers_count} tone={r.offers_count ? "text-emerald-400" : ""} />
            </div>

            {/* Radar + breakdown */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/40 p-3">
                <div className="text-xs font-medium mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                  Component radar
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="75%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Radar
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.25}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/40 p-3 space-y-2">
                <div className="text-xs font-medium mb-1">Weighted breakdown</div>
                {WEIGHTS.map((w) => {
                  const v = Math.max(0, Math.min(100, Number(r.scores?.[w.key] ?? 0)));
                  const contrib = v * w.weight;
                  return (
                    <div key={w.key} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          {w.label} <span className="opacity-60">· w {Math.round(w.weight * 100)}%</span>
                        </span>
                        <span className="tabular-nums">
                          {Math.round(v)} <span className="text-muted-foreground">→ {contrib.toFixed(1)}</span>
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-[hsl(var(--muted))]/40 overflow-hidden">
                        <div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${v}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent offers */}
            <div className="mt-4 rounded-xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/40 p-3">
              <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-amber-400" />
                Recent offers
              </div>
              {offersLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : offers && offers.length ? (
                <ul className="space-y-1.5">
                  {offers.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{o.role_title || "Offer"}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {o.recruiter?.name || "—"}
                          {o.offered_at && ` · ${format(new Date(o.offered_at), "MMM d, yyyy")}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {o.ctc && (
                          <span className="tabular-nums text-emerald-400">
                            ₹{(Number(o.ctc) / 100000).toFixed(1)}L
                          </span>
                        )}
                        {o.is_dream_offer && <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[9px]">Dream</Badge>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[11px] text-muted-foreground">No offers yet.</div>
              )}
            </div>

            {/* Recent applications */}
            <div className="mt-3 rounded-xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/40 p-3">
              <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                Recent applications
              </div>
              {appsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : applications && applications.length ? (
                <ul className="space-y-1.5">
                  {applications.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{a.drive?.title || "Drive"}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {a.stage || "—"}{a.current_round ? ` · R${a.current_round}` : ""}
                          {a.last_event_at && ` · ${format(new Date(a.last_event_at), "MMM d")}`}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{a.stage || "active"}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[11px] text-muted-foreground">No applications yet.</div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
