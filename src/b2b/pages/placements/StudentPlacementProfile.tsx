import { useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrgShell } from "../../layouts/OrgShell";
import { useCurrentOrg } from "../../context/OrgContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Share2, Trophy, GraduationCap, Briefcase, Sparkles,
  FileText, Download, ExternalLink, Github, Linkedin, Globe, Copy,
  ListChecks, UserCircle, Search, ArrowUp, ArrowDown, ArrowUpDown, X,
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import { ShareDialog } from "./ShareDialog";
import { ResumePreviewDialog } from "./ResumePreviewDialog";
import { toast } from "sonner";

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[hsl(var(--border))]/70 bg-gradient-to-br from-[hsl(var(--card))]/80 to-[hsl(var(--card))]/40 backdrop-blur-xl ${className}`}>
      <div className="relative">{children}</div>
    </div>
  );
}

const WEIGHTS: { key: string; label: string; weight: number }[] = [
  { key: "assessment_score", label: "Assessment", weight: 0.4 },
  { key: "integrity", label: "Integrity", weight: 0.2 },
  { key: "engagement", label: "Applications", weight: 0.15 },
  { key: "shortlist_rate", label: "Shortlisted", weight: 0.1 },
  { key: "offer_factor", label: "Offer factor", weight: 0.15 },
];

const fmtLakh = (v?: number | null) =>
  v == null ? null : `₹${(Number(v) / 100000).toFixed(1)}L`;

export default function StudentPlacementProfile() {
  const { studentId } = useParams<{ studentId: string }>();
  const { org, isLoading: orgLoading } = useCurrentOrg();
  const [shareOpen, setShareOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [daSearch, setDaSearch] = useState("");
  const [daStage, setDaStage] = useState<string>("all");
  const [daSort, setDaSort] = useState<{ key: "title" | "stage" | "last"; dir: "asc" | "desc" }>({ key: "last", dir: "desc" });

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
        .select("id, role_title, ctc, currency, offered_at, is_dream_offer, recruiter_id, recruiter:recruiters(name)")
        .eq("student_id", studentId!)
        .order("offered_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const { data: applications } = useQuery({
    queryKey: ["da", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("drive_applications")
        .select("id, stage, current_round, last_event_at, drive:placement_drives(title, recruiter:recruiters(name))")
        .eq("student_id", studentId!)
        .order("last_event_at", { ascending: false })
        .limit(100);
      return (data || []) as any[];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["upe", student?.user_id],
    enabled: !!student?.user_id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_profiles_extended")
        .select("user_id, resume_url, bio, location, github_url, linkedin_url, website, leetcode_url, codeforces_url, skills, college_name")
        .eq("user_id", student!.user_id)
        .maybeSingle();
      return data;
    },
  });

  const { data: shareActivity } = useQuery({
    queryKey: ["share-activity", studentId, org?.id],
    enabled: !!studentId && !!org?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("student_share_links")
        .select("id, view_count, last_viewed_at, revoked_at, expires_at")
        .eq("org_id", org!.id)
        .contains("student_ids", [studentId!]);
      if (error) throw error;
      const rows = (data || []) as Array<{ view_count: number; last_viewed_at: string | null; revoked_at: string | null; expires_at: string }>;
      const totalShares = rows.length;
      const totalOpens = rows.reduce((s, r) => s + (r.view_count || 0), 0);
      const lastOpened = rows.reduce<string | null>((acc, r) => {
        if (!r.last_viewed_at) return acc;
        if (!acc) return r.last_viewed_at;
        return new Date(r.last_viewed_at) > new Date(acc) ? r.last_viewed_at : acc;
      }, null);
      const active = rows.filter((r) => !r.revoked_at && new Date(r.expires_at) > new Date()).length;
      return { totalShares, totalOpens, lastOpened, active };
    },
  });

  const { data: orgTotal } = useQuery({
    queryKey: ["org_students_count", org?.id],
    enabled: !!org?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("org_students")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org!.id);
      return count || 0;
    },
  });

  const scoresMap = (score?.scores as Record<string, number>) || {};
  const radarData = useMemo(() =>
    WEIGHTS.map((w) => ({ metric: w.label, value: Number(scoresMap[w.key] || 0) })),
    [scoresMap],
  );

  const total = Number(score?.score ?? 0);
  const percentile = score?.rank_in_org && orgTotal
    ? Math.max(1, Math.round((score.rank_in_org / orgTotal) * 100))
    : null;

  // HR-ready bullets ----------------------------------------------------
  type Bullet = { id: string; text: string };
  const bullets: Bullet[] = useMemo(() => {
    if (!student) return [];
    const out: Bullet[] = [];
    if (score?.rank_in_org && orgTotal) {
      out.push({
        id: "rank",
        text: `Ranked #${score.rank_in_org} of ${orgTotal} in ${org?.name || "the cohort"}${percentile ? ` (top ${percentile}%)` : ""}.`,
      });
    }
    if (score?.rank_in_branch && student.branch) {
      out.push({ id: "branch_rank", text: `#${score.rank_in_branch} in ${student.branch}.` });
    }
    if (score?.avg_assessment_score != null && score?.assessments_taken) {
      out.push({
        id: "assess",
        text: `Average assessment score ${Math.round(score.avg_assessment_score)}% across ${score.assessments_taken} proctored test${score.assessments_taken === 1 ? "" : "s"}.`,
      });
    }
    if (score?.avg_integrity != null) {
      out.push({ id: "integrity", text: `Assessment integrity ${Math.round(score.avg_integrity)}% (proctored).` });
    }
    if ((offers?.length || 0) > 0) {
      const names = (offers || []).map((o: any) => o.recruiter?.name).filter(Boolean).slice(0, 3).join(", ");
      out.push({
        id: "offers",
        text: `Holds ${offers!.length} placement offer${offers!.length === 1 ? "" : "s"}${names ? ` from ${names}` : ""}.`,
      });
      const top = [...(offers || [])].sort((a: any, b: any) => Number(b.ctc || 0) - Number(a.ctc || 0))[0];
      if (top?.ctc) {
        out.push({ id: "top_ctc", text: `Highest offer ${fmtLakh(Number(top.ctc))}${top.recruiter?.name ? ` from ${top.recruiter.name}` : ""}.` });
      }
      if ((offers || []).some((o: any) => o.is_dream_offer)) {
        out.push({ id: "dream", text: `Holds a dream-company offer.` });
      }
    }
    if (score && (score.applications_count || score.shortlisted_count)) {
      out.push({
        id: "engage",
        text: `Applied to ${score.applications_count} drive${score.applications_count === 1 ? "" : "s"}, shortlisted in ${score.shortlisted_count}.`,
      });
    }
    if (student.branch || student.batch_year) {
      out.push({
        id: "bio",
        text: `${student.branch || ""}${student.branch && student.batch_year ? ", " : ""}${student.batch_year ? `batch of ${student.batch_year}` : ""}.`,
      });
    }
    if (profile?.skills && Array.isArray(profile.skills) && profile.skills.length) {
      out.push({ id: "skills", text: `Core skills: ${(profile.skills as string[]).slice(0, 8).join(", ")}.` });
    }
    return out;
  }, [student, score, offers, profile, org, orgTotal, percentile]);

  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [includeRank, setIncludeRank] = useState(true);
  const [includeOffers, setIncludeOffers] = useState(true);
  const isOn = (id: string) => enabled[id] !== false;

  const RANK_IDS = new Set(["rank", "branch_rank"]);
  const OFFER_IDS = new Set(["offers", "top_ctc", "dream"]);

  const visibleBullets = useMemo(
    () =>
      bullets.filter((b) => {
        if (!includeRank && RANK_IDS.has(b.id)) return false;
        if (!includeOffers && OFFER_IDS.has(b.id)) return false;
        return true;
      }),
    [bullets, includeRank, includeOffers],
  );

  const copyBullets = () => {
    const text = visibleBullets.filter((b) => isOn(b.id)).map((b) => `• ${b.text}`).join("\n");
    if (!text) {
      toast.error("Select at least one bullet.");
      return;
    }
    const header = `${student?.full_name || student?.email} — placement highlights\n`;
    navigator.clipboard.writeText(header + "\n" + text);
    toast.success("Highlights copied — paste into email or ATS.");
  };

  if (orgLoading || studentLoading) return null;
  if (!org) return <Navigate to="/b2b" replace />;
  if (!student) return <Navigate to="/b2b/placements" replace />;

  const stageColor = (stage: string) => {
    if (stage === "offered" || stage === "accepted") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    if (stage === "shortlisted" || stage === "interview") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    if (stage === "rejected" || stage === "withdrawn") return "bg-red-500/15 text-red-300 border-red-500/30";
    return "bg-[hsl(var(--muted))]/30 text-muted-foreground border-[hsl(var(--border))]/60";
  };

  const daStages = useMemo(() => {
    const s = new Set<string>();
    (applications || []).forEach((a: any) => a.stage && s.add(a.stage));
    return Array.from(s).sort();
  }, [applications]);

  const filteredApps = useMemo(() => {
    const q = daSearch.trim().toLowerCase();
    let list = (applications || []).filter((a: any) => {
      const title = (a.drive?.title || "").toLowerCase();
      const rec = (a.drive?.recruiter?.name || "").toLowerCase();
      if (q && !title.includes(q) && !rec.includes(q)) return false;
      if (daStage !== "all" && a.stage !== daStage) return false;
      return true;
    });
    const dir = daSort.dir === "asc" ? 1 : -1;
    list = [...list].sort((a: any, b: any) => {
      if (daSort.key === "title") {
        return (a.drive?.title || "").localeCompare(b.drive?.title || "") * dir;
      }
      if (daSort.key === "stage") {
        return (a.stage || "").localeCompare(b.stage || "") * dir;
      }
      const ta = a.last_event_at ? new Date(a.last_event_at).getTime() : 0;
      const tb = b.last_event_at ? new Date(b.last_event_at).getTime() : 0;
      return (ta - tb) * dir;
    });
    return list;
  }, [applications, daSearch, daStage, daSort]);

  const toggleSort = (key: "title" | "stage" | "last") => {
    setDaSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "last" ? "desc" : "asc" });
  };
  const SortIcon = ({ k }: { k: "title" | "stage" | "last" }) => {
    if (daSort.key !== k) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return daSort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

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
                <div className="text-[10px] text-muted-foreground">
                  {percentile ? `Top ${percentile}% · ` : ""}#{score?.rank_in_branch ?? "—"} in branch
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Radar + Score breakdown + Key stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" /> Strengths
            </h3>
            <div className="h-56">
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

          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <ListChecks className="h-4 w-4 text-primary" /> Score breakdown
            </h3>
            <div className="space-y-2.5">
              {WEIGHTS.map((w) => {
                const raw = Number(scoresMap[w.key] || 0);
                const contrib = raw * w.weight;
                return (
                  <div key={w.key}>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] tabular-nums text-muted-foreground w-8">{Math.round(w.weight * 100)}%</span>
                        <span className="truncate">{w.label}</span>
                      </div>
                      <div className="tabular-nums text-muted-foreground">
                        {Math.round(raw)} <span className="text-foreground font-medium ml-1">+{contrib.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-[hsl(var(--muted))]/40 overflow-hidden">
                      <div className="h-full bg-[hsl(var(--primary))]" style={{ width: `${Math.min(100, raw)}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="mt-2 pt-2 border-t border-[hsl(var(--border))]/40 flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
                <span className={`text-lg font-semibold tabular-nums ${total >= 80 ? "text-emerald-400" : total >= 60 ? "text-amber-400" : "text-muted-foreground"}`}>
                  {total.toFixed(1)} <span className="text-xs text-muted-foreground font-normal">/ 100</span>
                </span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-primary" /> Key stats
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Assessments", score?.assessments_taken ?? 0],
                ["Avg %", score?.avg_assessment_score?.toFixed(0) ?? "—"],
                ["Integrity", score?.avg_integrity?.toFixed(0) ?? "—"],
                ["Apps", score?.applications_count ?? 0],
                ["Shortlisted", score?.shortlisted_count ?? 0],
                ["Offers", score?.offers_count ?? 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg border border-[hsl(var(--border))]/40 p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
                  <div className="text-lg font-semibold mt-0.5 tabular-nums">{value as any}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Resume + linked profile */}
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-primary" /> Resume &amp; linked profile
          </h3>
          {!student.user_id ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Student has not yet activated their Byteskill account.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                {profile?.bio && <p className="text-sm">{profile.bio}</p>}
                <div className="text-xs text-muted-foreground space-x-3">
                  {profile?.location && <span>📍 {profile.location}</span>}
                  {profile?.college_name && <span>🎓 {profile.college_name}</span>}
                </div>
                {Array.isArray(profile?.skills) && profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(profile.skills as string[]).slice(0, 12).map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {profile?.github_url && (
                    <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                      <a href={profile.github_url} target="_blank" rel="noreferrer"><Github className="h-3.5 w-3.5 mr-1" />GitHub</a>
                    </Button>
                  )}
                  {profile?.linkedin_url && (
                    <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                      <a href={profile.linkedin_url} target="_blank" rel="noreferrer"><Linkedin className="h-3.5 w-3.5 mr-1" />LinkedIn</a>
                    </Button>
                  )}
                  {profile?.website && (
                    <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                      <a href={profile.website} target="_blank" rel="noreferrer"><Globe className="h-3.5 w-3.5 mr-1" />Website</a>
                    </Button>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-[hsl(var(--border))]/60 p-3 flex flex-col items-center justify-center text-center">
                <FileText className="h-7 w-7 text-[hsl(var(--primary))] mb-1.5" />
                {profile?.resume_url ? (
                  <>
                    <div className="text-xs text-muted-foreground mb-2">Resume on file</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setResumeOpen(true)}>
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View
                      </Button>
                      <Button asChild size="sm">
                        <a href={profile.resume_url} download>
                          <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                        </a>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">Resume not uploaded yet.</div>
                )}
              </div>
            </div>
          )}
        </GlassCard>

        {/* HR-ready highlights */}
        <GlassCard className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" /> HR-ready highlights
            </h3>
            <Button size="sm" onClick={copyBullets} disabled={!visibleBullets.length}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy bullets
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3 pb-3 border-b border-[hsl(var(--border))]/60">
            <div className="flex items-center gap-2">
              <Switch
                id="toggle-rank"
                checked={includeRank}
                onCheckedChange={setIncludeRank}
              />
              <Label htmlFor="toggle-rank" className="text-xs cursor-pointer">
                Include rank & percentile
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="toggle-offers"
                checked={includeOffers}
                onCheckedChange={setIncludeOffers}
              />
              <Label htmlFor="toggle-offers" className="text-xs cursor-pointer">
                Include offer details
              </Label>
            </div>
          </div>
          {!visibleBullets.length ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              {bullets.length
                ? "All matching bullets are hidden — enable a toggle above."
                : "Not enough data yet — recompute scores or record activity to generate highlights."}
            </div>
          ) : (
            <ul className="space-y-1.5">
              {visibleBullets.map((b) => (
                <li key={b.id} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={isOn(b.id)}
                    onCheckedChange={(v) => setEnabled((e) => ({ ...e, [b.id]: !!v }))}
                    className="mt-0.5"
                  />
                  <span className={isOn(b.id) ? "" : "text-muted-foreground line-through"}>{b.text}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        {/* Share activity */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Share2 className="h-4 w-4 text-primary" /> Share activity
            </h3>
            <Button asChild size="sm" variant="outline">
              <Link to={`/b2b/placements?tab=shares&student=${studentId}`}>
                View all shares <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Shares created", value: shareActivity?.totalShares ?? 0 },
              { label: "Active links", value: shareActivity?.active ?? 0 },
              { label: "Total opens", value: shareActivity?.totalOpens ?? 0 },
              {
                label: "Last opened",
                value: shareActivity?.lastOpened
                  ? new Date(shareActivity.lastOpened).toLocaleDateString()
                  : "—",
              },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-[hsl(var(--border))]/50 p-2 text-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                <div className="text-base font-semibold mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>
        </GlassCard>


        {/* Drive applications */}
        <GlassCard className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-primary" /> Drive activity
              <span className="text-muted-foreground font-normal">
                ({filteredApps.length}{applications && filteredApps.length !== applications.length ? ` / ${applications.length}` : ""})
              </span>
            </h3>
            {!!applications?.length && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={daSearch}
                    onChange={(e) => setDaSearch(e.target.value)}
                    placeholder="Search drive or recruiter…"
                    className="h-8 pl-7 pr-7 w-56 text-xs"
                  />
                  {daSearch && (
                    <button
                      onClick={() => setDaSearch("")}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Select value={daStage} onValueChange={setDaStage}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {daStages.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(daSearch || daStage !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => { setDaSearch(""); setDaStage("all"); }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>
          {!applications?.length ? (
            <div className="text-sm text-muted-foreground py-4 text-center">No drive activity yet.</div>
          ) : !filteredApps.length ? (
            <div className="text-sm text-muted-foreground py-6 text-center">No events match your filters.</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))]/40">
              <table className="w-full text-sm">
                <thead className="bg-[hsl(var(--muted))]/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">
                      <button onClick={() => toggleSort("title")} className="inline-flex items-center gap-1 hover:text-foreground">
                        Drive <SortIcon k="title" />
                      </button>
                    </th>
                    <th className="text-left px-3 py-2 font-medium">Recruiter</th>
                    <th className="text-left px-3 py-2 font-medium">
                      <button onClick={() => toggleSort("stage")} className="inline-flex items-center gap-1 hover:text-foreground">
                        Stage <SortIcon k="stage" />
                      </button>
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                      <button onClick={() => toggleSort("last")} className="inline-flex items-center gap-1 hover:text-foreground ml-auto">
                        Last update <SortIcon k="last" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((a: any) => (
                    <tr key={a.id} className="border-t border-[hsl(var(--border))]/40">
                      <td className="px-3 py-2 font-medium">{a.drive?.title ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{a.drive?.recruiter?.name ?? "—"}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={`text-[10px] ${stageColor(a.stage)}`}>
                          {a.stage}{a.current_round ? ` · R${a.current_round}` : ""}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                        {a.last_event_at ? new Date(a.last_event_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Offers timeline */}
        <GlassCard className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-primary" /> Offers ({offers?.length ?? 0})
          </h3>
          {!offers?.length ? (
            <div className="text-sm text-muted-foreground py-6 text-center">No offers recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {offers.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))]/40 p-3">
                  <div>
                    <div className="font-medium">
                      {o.role_title || "Offer"}
                      {o.recruiter?.name && <span className="text-muted-foreground font-normal"> · {o.recruiter.name}</span>}
                      {o.is_dream_offer && <Badge className="ml-2 text-[10px]" variant="outline">Dream</Badge>}
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
      <ResumePreviewDialog
        open={resumeOpen}
        onOpenChange={setResumeOpen}
        url={profile?.resume_url || null}
        studentName={student?.full_name || student?.email}
      />
    </OrgShell>
  );
}
