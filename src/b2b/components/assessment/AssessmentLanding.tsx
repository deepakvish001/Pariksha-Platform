/**
 * AssessmentLanding — a single shared "this is what you're about to take" page
 * shown to both admins (when they open an assessment in the workspace) and
 * candidates (when they click an invite link). Read-only; one obvious CTA at
 * the bottom. Visual language matches the rest of the B2B workspace: deep
 * black, glass cards, amber→primary gradient headline, optional brand-colour
 * accent on the hero.
 */
import { ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Layers,
  ListChecks,
  ShieldCheck,
  ShieldOff,
  Target,
  Repeat2,
  CalendarClock,
  CheckCircle2,
  Camera,
  Mic,
  Monitor,
  Wifi,
  Eye,
  EyeOff,
  FileText,
  Building2,
  Sparkles,
} from "lucide-react";
import {
  describeRulesForCandidate,
  resolveProctoringConfig,
  type ProctoringConfig,
} from "@/assessments/lib/proctoringConfig";
import { StatusPill, type StatusTone } from "@/b2b/components/ui/StatusPill";
import { cn } from "@/lib/utils";

export interface LandingOrg {
  name: string;
  logo_url?: string | null;
  brand_color?: string | null;
}

export interface LandingSection {
  id: string;
  title: string;
  description?: string | null;
  question_count: number;
}

export interface LandingAssessment {
  title: string;
  description?: string | null;
  duration_min: number;
  max_attempts: number;
  proctoring_enabled: boolean;
  proctoring_config?: unknown;
  show_results_to_candidate: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  status: string;
  brand_color?: string | null;
  type?: string | null;
}

interface Props {
  mode: "admin" | "candidate";
  /** "full" = own full-screen background + orbs (candidate flow).
   *  "embedded" = no background, lives inside OrgShell (admin flow). */
  chrome?: "full" | "embedded";
  org: LandingOrg;
  assessment: LandingAssessment;
  sections: LandingSection[];
  /** Slot shown above the hero (admin breadcrumbs, candidate invite chip…). */
  topSlot?: ReactNode;
  /** Sticky bottom action bar. Pass buttons; the bar provides the chrome. */
  actions: ReactNode;
  /** Extra cards rendered after the standard grid (admin stats, draft checklist…). */
  extraCards?: ReactNode;
}

const STATUS_TONE: Record<string, StatusTone> = {
  draft: "draft",
  published: "live",
  archived: "archived",
  closed: "closed",
};

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function formatDistance(ms: number): string {
  if (ms <= 0) return "now";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ${sec % 60}s`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ${min % 60}m`;
  const day = Math.floor(hr / 24);
  return `${day}d ${hr % 24}h`;
}

export function AssessmentLanding({
  mode,
  chrome = "full",
  org,
  assessment,
  sections,
  topSlot,
  actions,
  extraCards,
}: Props) {
  const now = useNow(1000);

  const totalQuestions = useMemo(
    () => sections.reduce((acc, s) => acc + (s.question_count ?? 0), 0),
    [sections],
  );

  const startMs = assessment.starts_at ? new Date(assessment.starts_at).getTime() : null;
  const endMs = assessment.ends_at ? new Date(assessment.ends_at).getTime() : null;

  let scheduleLabel = "Opens immediately on publish";
  let scheduleTone: StatusTone = "neutral";
  if (startMs && now < startMs) {
    scheduleLabel = `Opens in ${formatDistance(startMs - now)}`;
    scheduleTone = "scheduled";
  } else if (endMs && now > endMs) {
    scheduleLabel = `Closed ${formatDistance(now - endMs)} ago`;
    scheduleTone = "closed";
  } else if (endMs) {
    scheduleLabel = `Closes in ${formatDistance(endMs - now)}`;
    scheduleTone = "live";
  } else if (assessment.status === "published") {
    scheduleLabel = "Live · open now";
    scheduleTone = "live";
  }

  const proctoring: ProctoringConfig = useMemo(
    () => resolveProctoringConfig(assessment.proctoring_config, assessment.proctoring_enabled),
    [assessment.proctoring_config, assessment.proctoring_enabled],
  );

  const rules = useMemo(
    () => (assessment.proctoring_enabled ? describeRulesForCandidate(proctoring) : []),
    [proctoring, assessment.proctoring_enabled],
  );

  const brand = (assessment.brand_color || org.brand_color || "").trim();
  const brandStyle = brand
    ? ({
        // expose as CSS var so child cards can pick it up if needed
        ["--landing-brand" as string]: brand,
      } as React.CSSProperties)
    : undefined;

  const isFull = chrome === "full";
  return (
    <div
      className={cn(
        "relative pb-32",
        isFull && "min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]",
      )}
      style={brandStyle}
    >
      {isFull && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full blur-3xl opacity-30"
            style={{
              background: brand
                ? `radial-gradient(closest-side, ${brand}, transparent 70%)`
                : "radial-gradient(closest-side, hsl(var(--primary) / 0.35), transparent 70%)",
            }}
          />
          <div className="absolute top-1/3 -right-32 h-[480px] w-[480px] rounded-full bg-amber-500/10 blur-3xl" />
        </div>
      )}

      <div className={cn("relative mx-auto px-0 md:px-0 space-y-6", isFull && "max-w-5xl px-4 md:px-6 pt-6 md:pt-10")}>
        {topSlot}

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="b2b-card relative overflow-hidden p-6 md:p-8"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt=""
                  className="h-10 w-10 rounded-md object-cover ring-1 ring-[hsl(var(--border))]"
                />
              ) : (
                <div className="h-10 w-10 rounded-md grid place-items-center bg-[hsl(var(--muted))]/40 ring-1 ring-[hsl(var(--border))]">
                  <Building2 className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                  {mode === "candidate" ? "Invited by" : "Workspace"}
                </div>
                <div className="text-sm font-medium truncate">{org.name}</div>
              </div>
            </div>
            <StatusPill
              tone={STATUS_TONE[assessment.status] ?? "neutral"}
              pulse={assessment.status === "published"}
            >
              {assessment.status}
            </StatusPill>
          </div>

          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
              {assessment.title}
            </span>
          </h1>
          {assessment.description && (
            <p className="mt-3 text-sm md:text-base text-[hsl(var(--muted-foreground))] max-w-3xl">
              {assessment.description}
            </p>
          )}

          {/* Stat row */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile icon={Clock} label="Duration" value={`${assessment.duration_min} min`} />
            <StatTile
              icon={Layers}
              label="Sections"
              value={
                sections.length === 0
                  ? "—"
                  : `${sections.length} · ${totalQuestions} question${totalQuestions === 1 ? "" : "s"}`
              }
            />
            <StatTile
              icon={assessment.proctoring_enabled ? ShieldCheck : ShieldOff}
              label="Proctoring"
              value={
                assessment.proctoring_enabled
                  ? proctoring.strictness.charAt(0).toUpperCase() + proctoring.strictness.slice(1)
                  : "Off"
              }
              accent={assessment.proctoring_enabled}
            />
            <StatTile
              icon={Repeat2}
              label="Attempts"
              value={`${assessment.max_attempts}× allowed`}
            />
          </div>

          {/* Schedule chip */}
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <CalendarClock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <StatusPill tone={scheduleTone} pulse={scheduleTone === "live"}>
              {scheduleLabel}
            </StatusPill>
            {startMs && (
              <span className="text-[hsl(var(--muted-foreground))]">
                · Opens {new Date(startMs).toLocaleString()}
              </span>
            )}
            {endMs && (
              <span className="text-[hsl(var(--muted-foreground))]">
                · Closes {new Date(endMs).toLocaleString()}
              </span>
            )}
          </div>
        </motion.div>

        {/* Grid: sections + rules */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            icon={ListChecks}
            title="What you'll do"
            description={
              sections.length === 0
                ? "No sections have been added yet."
                : `${sections.length} section${sections.length === 1 ? "" : "s"} · ${totalQuestions} question${totalQuestions === 1 ? "" : "s"} total`
            }
            delay={0.05}
          >
            {sections.length === 0 ? (
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {mode === "admin"
                  ? "Add sections and questions before publishing."
                  : "The recruiter is still preparing this test."}
              </p>
            ) : (
              <ol className="space-y-2">
                {sections.map((s, i) => (
                  <li
                    key={s.id}
                    className="flex items-start gap-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))]/40 p-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))] text-xs font-semibold">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{s.title}</div>
                      {s.description && (
                        <div className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mt-0.5">
                          {s.description}
                        </div>
                      )}
                      <div className="text-[11px] uppercase tracking-wide text-[hsl(var(--muted-foreground))] mt-1">
                        {s.question_count} question{s.question_count === 1 ? "" : "s"}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card
            icon={assessment.proctoring_enabled ? ShieldCheck : ShieldOff}
            title="Rules & integrity"
            description={
              assessment.proctoring_enabled
                ? "Recorded and reviewed during the attempt."
                : "Proctoring is off — honour system applies."
            }
            delay={0.1}
          >
            {assessment.proctoring_enabled ? (
              <ul className="space-y-2">
                {rules.map((r, i) => (
                  <li key={i} className="flex gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400/80" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                No tab-switch, camera, or fullscreen requirements. Make sure you're comfortable with
                the time limit before starting.
              </p>
            )}
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card icon={CheckCircle2} title="What you'll need" delay={0.15}>
            <ul className="space-y-2 text-xs text-[hsl(var(--muted-foreground))]">
              <NeedItem
                icon={Wifi}
                label={`Stable internet for ${assessment.duration_min} minutes`}
                required
              />
              {assessment.proctoring_enabled && proctoring.require_face_detection && (
                <NeedItem icon={Camera} label="Working webcam, face clearly visible" required />
              )}
              {assessment.proctoring_enabled && !proctoring.require_face_detection && (
                <NeedItem icon={Camera} label="Working webcam (sampled periodically)" />
              )}
              {assessment.proctoring_enabled && proctoring.require_screen_share && (
                <NeedItem icon={Monitor} label="Permission to share your entire screen" required />
              )}
              {assessment.proctoring_enabled && proctoring.require_side_eye && (
                <NeedItem icon={Mic} label="A second phone for the side-camera (Third Eye)" required />
              )}
              <NeedItem
                icon={FileText}
                label="Quiet space, no interruptions — you can't pause once started"
              />
            </ul>
          </Card>

          <Card icon={Target} title="After you submit" delay={0.2}>
            <ul className="space-y-2 text-xs text-[hsl(var(--muted-foreground))]">
              <li className="flex gap-2">
                {assessment.show_results_to_candidate ? (
                  <Eye className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400" />
                )}
                <span>
                  {assessment.show_results_to_candidate
                    ? "You'll see your score, per-question breakdown and a receipt PDF."
                    : "Results stay hidden — the recruiter decides when to release them."}
                </span>
              </li>
              <li className="flex gap-2">
                <Repeat2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[hsl(var(--muted-foreground))]" />
                <span>
                  {assessment.max_attempts > 1
                    ? `Up to ${assessment.max_attempts} attempts allowed.`
                    : "One attempt only — make it count."}
                </span>
              </li>
              <li className="flex gap-2">
                <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[hsl(var(--muted-foreground))]" />
                <span>A confirmation email is sent as soon as you submit.</span>
              </li>
            </ul>
          </Card>
        </div>

        {extraCards}
      </div>

      {/* Sticky bottom action bar */}
      <div className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none">
        <div className="mx-auto max-w-3xl pointer-events-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 backdrop-blur shadow-xl">
          <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
        <Icon className={cn("h-3.5 w-3.5", accent && "text-amber-400")} />
        {label}
      </div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  description,
  delay = 0,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="b2b-card p-5"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {description && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">{description}</p>
      )}
      <div className={description ? "" : "mt-2"}>{children}</div>
    </motion.div>
  );
}

function NeedItem({
  icon: Icon,
  label,
  required,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  required?: boolean;
}) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[hsl(var(--muted-foreground))]" />
      <span>
        {label}
        {required && <span className="ml-1 text-amber-400">·required</span>}
      </span>
    </li>
  );
}
