import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isUuid } from "@/lib/routing/slug";

import { Button } from "@/components/ui/button";
import {
  Clock,
  ShieldCheck,
  Wifi,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CalendarClock,
  FileText,
  Camera,
  FileSignature,
  ListChecks,
} from "lucide-react";
import { StepperHeader } from "@/b2b/components/ui/StepperHeader";
import { SectionCard } from "@/b2b/components/ui/SectionCard";
import { StatusPill } from "@/b2b/components/ui/StatusPill";

const STEPS = [
  { key: "welcome", label: "Welcome", icon: FileText },
  { key: "check", label: "System check", icon: Wifi },
  { key: "identity", label: "Identity", icon: Camera },
  { key: "consent", label: "Consent", icon: FileSignature },
  { key: "start", label: "Start test", icon: ListChecks },
];

export default function Lobby() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["attempt", attemptId],
    enabled: !!attemptId,
    queryFn: async () => {
      let q = supabase
        .from("assessment_attempts")
        .select(
          "*, assessment:assessments(id,title,description,duration_min,proctoring_enabled,starts_at,ends_at,status)",
        );
      q = isUuid(attemptId!) ? q.eq("id", attemptId!) : q.eq("slug", attemptId!);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] grid place-items-center">
        <div className="h-8 w-8 rounded-full border-2 border-[hsl(var(--primary))]/40 border-t-[hsl(var(--primary))] animate-spin" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] grid place-items-center p-6">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-amber-300" />
          <p className="mt-3 text-sm">Attempt not found.</p>
          <Link to="/assessments" className="mt-4 inline-block text-xs text-[hsl(var(--primary))] hover:underline">
            ← Back to my assessments
          </Link>
        </div>
      </div>
    );
  }
  const a: any = data.assessment;

  const now = Date.now();
  const startMs = a?.starts_at ? new Date(a.starts_at).getTime() : null;
  const endMs = a?.ends_at ? new Date(a.ends_at).getTime() : null;
  const notYetOpen = !!startMs && now < startMs;
  const closed = !!endMs && now > endMs;
  const notPublished = a?.status && a.status !== "published";
  const blocked = notYetOpen || closed || notPublished;
  const blockReason = notPublished
    ? "This assessment isn't open yet — the recruiter hasn't published it."
    : notYetOpen
    ? `This assessment opens on ${new Date(startMs!).toLocaleString()}.`
    : closed
    ? `This assessment closed on ${new Date(endMs!).toLocaleString()}.`
    : null;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[600px] rounded-full bg-[hsl(var(--primary))]/10 blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Stepper */}
        <StepperHeader steps={STEPS} currentKey="welcome" />

        {/* Hero card */}
        <SectionCard>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[hsl(var(--primary))] font-semibold">
                <Sparkles className="h-3.5 w-3.5" /> Test invitation
              </div>
              {a?.proctoring_enabled && (
                <StatusPill tone="warning">
                  <ShieldCheck className="h-3 w-3" /> Proctored
                </StatusPill>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {a?.title ?? "Assessment"}
              </h1>
              {a?.description && (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a.description}</p>
              )}
            </div>

            {/* Quick facts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Fact icon={Clock} label="Duration" value={`${a?.duration_min ?? "—"} min`} />
              <Fact
                icon={ShieldCheck}
                label="Proctoring"
                value={a?.proctoring_enabled ? "Enabled" : "Off"}
              />
              <Fact icon={Wifi} label="Connection" value="Stable Wi-Fi" />
            </div>

            {(startMs || endMs) && (
              <div className="flex items-start gap-3 rounded-xl border border-[hsl(var(--border))]/40 bg-white/[0.02] p-3 text-xs">
                <CalendarClock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="text-muted-foreground">
                  <div>
                    <span className="text-foreground/80">Opens:</span>{" "}
                    {startMs ? new Date(startMs).toLocaleString() : "now"}
                  </div>
                  <div>
                    <span className="text-foreground/80">Closes:</span>{" "}
                    {endMs ? new Date(endMs).toLocaleString() : "no close time"}
                  </div>
                </div>
              </div>
            )}

            {blocked && blockReason && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>{blockReason}</div>
              </div>
            )}

            {/* Rules */}
            <div className="rounded-xl border border-[hsl(var(--border))]/40 bg-white/[0.02] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Before you begin
              </div>
              <ul className="space-y-1.5 text-sm">
                <Rule>The timer cannot be paused once you start.</Rule>
                <Rule>Keep your camera and microphone on for the entire session.</Rule>
                <Rule>Do not switch tabs, open new windows, or use AI tools.</Rule>
                <Rule>Have your photo ID ready for verification.</Rule>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button
                disabled={blocked}
                size="lg"
                className="flex-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 h-12"
                onClick={() => navigate(`/assessments/${data.id}/preflight`)}
              >
                Continue to system check
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="h-12"
                onClick={() => navigate("/assessments")}
              >
                Cancel
              </Button>
            </div>
          </div>
        </SectionCard>

        <div className="text-center text-[11px] text-muted-foreground">
          Need help? <Link to="/contact" className="text-[hsl(var(--primary))] hover:underline">Contact support</Link>
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))]/40 bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1 w-1 rounded-full bg-[hsl(var(--primary))] shrink-0" />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}
