import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Trophy, Loader2, GraduationCap, Sparkles, Building2, Mail, Clock, FileText, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type StudentPayload = {
  id: string;
  name: string;
  roll: string | null;
  branch: string | null;
  batch_year: number | null;
  headline: string | null;
  show_contact: boolean;
  email: string | null;
  show_resume: boolean;
  resume_url: string | null;
  score: number;
  rank_in_org: number | null;
  rank_in_branch: number | null;
  highlights: {
    assessments_taken: number;
    avg_assessment_score: number | null;
    applications_count: number;
    shortlisted_count: number;
    offers_count: number;
    is_placed: boolean;
    is_multi_offer: boolean;
  };
  scores: Record<string, number>;
};

type Payload = {
  kind: "profile" | "shortlist";
  org: { name: string; slug: string } | null;
  recruiter_name: string | null;
  message: string | null;
  expires_at: string;
  students: StudentPayload[];
};

export default function PublicStudentProfile({ kind }: { kind: "profile" | "shortlist" }) {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/placement-public-profile?token=${token}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error || `Error ${res.status}`);
          return;
        }
        setData(await res.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // SEO: title, description, noindex (share links must never be indexed)
  useEffect(() => {
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    let title = "Placement Profile · Parikshaa";
    let desc = "Shared placement profile.";
    if (data) {
      title = kind === "shortlist"
        ? `Top ${data.students.length} candidates · ${data.org?.name || "Parikshaa"}`
        : `${data.students[0]?.name || "Student"} · Placement Profile`;
      desc = data.message?.trim()
        || (kind === "shortlist"
          ? `Shortlist of top candidates shared by ${data.org?.name || "the placement office"}.`
          : `Placement readiness profile shared by ${data.org?.name || "the placement office"}.`);
    }
    document.title = title;
    setMeta("description", desc.slice(0, 160));
    setMeta("robots", "noindex,nofollow");
  }, [data, kind]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    const msg = error === "expired" ? "This share link has expired."
      : error === "revoked" ? "This share link has been revoked."
      : error === "not_found" ? "Share link not found."
      : "Unable to load profile.";
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-xl font-semibold mb-2">{msg}</h1>
          <p className="text-sm text-muted-foreground">Please ask the college TPO for a fresh link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>Shared by <strong className="text-foreground">{data.org?.name || "College"}</strong> via Parikshaa</span>
          </div>
          <Badge variant="outline" className="gap-1 text-[10px]">
            <Clock className="h-3 w-3" />
            Expires {new Date(data.expires_at).toLocaleDateString()}
          </Badge>
        </div>

        {data.message && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm italic">
            "{data.message}"
            {data.recruiter_name && <div className="text-xs text-muted-foreground mt-1 not-italic">— For {data.recruiter_name}</div>}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {kind === "shortlist" ? `Top ${data.students.length} candidates` : data.students[0]?.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {kind === "shortlist"
              ? "Recommended by the placement office based on holistic Placement Score."
              : "Detailed placement profile."}
          </p>
        </div>

        <div className={kind === "shortlist" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
          {data.students.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur p-5 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 grid place-items-center text-lg font-semibold">
                  {s.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold truncate">{s.name}</h3>
                    {s.highlights.is_multi_offer && <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">Multi-offer</Badge>}
                    {s.highlights.is_placed && !s.highlights.is_multi_offer && <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 text-[10px]">Placed</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {s.branch || "—"}{s.batch_year ? ` · Batch ${s.batch_year}` : ""}{s.roll ? ` · ${s.roll}` : ""}
                  </div>
                  {s.headline && <div className="text-sm mt-2">{s.headline}</div>}
                </div>
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
                  <div className={`text-3xl font-bold tabular-nums ${s.score >= 80 ? "text-emerald-400" : s.score >= 60 ? "text-amber-400" : "text-muted-foreground"}`}>
                    {s.score.toFixed(0)}
                  </div>
                  {s.rank_in_org && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-center">
                      <Trophy className="h-3 w-3 text-amber-400" />#{s.rank_in_org}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  ["Assessments", s.highlights.assessments_taken],
                  ["Avg score", s.highlights.avg_assessment_score?.toFixed(0) ?? "—"],
                  ["Applications", s.highlights.applications_count],
                  ["Offers", s.highlights.offers_count],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-lg border border-border/50 p-2 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
                    <div className="text-base font-semibold">{value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {s.show_contact && s.email && (
                  <Button asChild size="sm" variant="outline">
                    <a href={`mailto:${s.email}`}><Mail className="h-3.5 w-3.5 mr-1.5" />{s.email}</a>
                  </Button>
                )}
                {s.show_resume && s.resume_url && (
                  <Button asChild size="sm" variant="outline">
                    <a href={s.resume_url} target="_blank" rel="noreferrer"><FileText className="h-3.5 w-3.5 mr-1.5" />View resume</a>
                  </Button>
                )}
              </div>
              {!s.show_contact && !s.show_resume && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground italic">
                  <EyeOff className="h-3 w-3" />
                  Contact and resume hidden by the sender — request access from the placement office.
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Watermark */}
        <div className="pt-6 mt-6 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Powered by Parikshaa Placement Scores
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3 w-3" />
            {data.org?.name}
          </div>
        </div>
      </div>
    </div>
  );
}
