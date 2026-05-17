import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Monitor,
  ScanFace,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Terminal,
  Printer,
  Camera,
  ClipboardCopy,
  ClipboardPaste,
  PanelLeftClose,
  ZapOff,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  resolveProctoringConfig,
  type ProctoringConfig,
  type ProctoringEventKey,
} from "../lib/proctoringConfig";

interface Props {
  attemptId: string;
  assessmentId: string;
  /** Final integrity score for sanity checks/display. */
  finalScore?: number | null;
  className?: string;
}

interface AttemptEventRow {
  id: string;
  kind: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

// Mirror of EVENT_TO_RULE in useProctoring.ts — kept local so this
// component is self-contained and we don't import a player-only module.
const EVENT_TO_RULE: Record<string, ProctoringEventKey> = {
  visibility_hidden: "tab_switch",
  window_blur: "window_blur",
  fullscreen_exit: "fullscreen_exit",
  copy: "copy",
  cut: "copy",
  paste: "paste",
  paste_large: "paste_large",
  typing_burst: "typing_burst",
  devtools_attempt: "devtools_attempt",
  print_blocked: "print_blocked",
  webcam_lost: "webcam_lost",
  no_face: "no_face",
  multi_face: "multi_face",
  second_monitor: "second_monitor",
  screenshare_lost: "screenshare_lost",
  device_change: "device_change",
  side_eye_lost: "side_eye_lost",
};

const KIND_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  visibility_hidden: { label: "Switched tab or minimised window", icon: EyeOff },
  window_blur: { label: "Window lost focus", icon: PanelLeftClose },
  fullscreen_exit: { label: "Exited fullscreen", icon: Monitor },
  copy: { label: "Copy attempt", icon: ClipboardCopy },
  cut: { label: "Cut attempt", icon: ClipboardCopy },
  paste: { label: "Paste detected", icon: ClipboardPaste },
  paste_large: { label: "Large paste detected", icon: ClipboardPaste },
  typing_burst: { label: "Unusually fast typing burst", icon: ZapOff },
  devtools_attempt: { label: "Developer tools attempt", icon: Terminal },
  print_blocked: { label: "Print blocked", icon: Printer },
  webcam_lost: { label: "Webcam disconnected", icon: Camera },
  no_face: { label: "Face not visible", icon: ScanFace },
  multi_face: { label: "Multiple faces detected", icon: Users },
  second_monitor: { label: "Second monitor detected", icon: Monitor },
  screenshare_lost: { label: "Screen sharing stopped", icon: Monitor },
  device_change: { label: "Audio/video device changed", icon: Smartphone },
  side_eye_lost: { label: "Phone camera disconnected", icon: Smartphone },
  violation_strike: { label: "Violation strike recorded", icon: ShieldAlert },
  auto_submitted: { label: "Attempt auto-submitted", icon: AlertTriangle },
};

interface TimelineEntry {
  id: string;
  at: Date;
  kind: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  penalty: number; // points deducted (0 for non-scoring rows like strikes)
  runningScore: number;
  strike: boolean;
  autoSubmitted: boolean;
  payload: Record<string, unknown> | null;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDate(d: Date) {
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function IntegrityTimeline({ attemptId, assessmentId, finalScore, className }: Props) {
  const [events, setEvents] = useState<AttemptEventRow[] | null>(null);
  const [config, setConfig] = useState<ProctoringConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [eventsRes, assessmentRes] = await Promise.all([
          supabase
            .from("attempt_events")
            .select("id, kind, payload, created_at")
            .eq("attempt_id", attemptId)
            .order("created_at", { ascending: true })
            .limit(500),
          supabase
            .from("assessments")
            .select("proctoring_config, proctoring_enabled")
            .eq("id", assessmentId)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        if (eventsRes.error) throw eventsRes.error;
        const cfg = resolveProctoringConfig(
          assessmentRes.data?.proctoring_config ?? null,
          assessmentRes.data?.proctoring_enabled ?? true
        );
        setConfig(cfg);
        setEvents((eventsRes.data ?? []) as AttemptEventRow[]);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Couldn't load timeline");
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId, assessmentId]);

  const entries = useMemo<TimelineEntry[]>(() => {
    if (!events || !config) return [];
    const rules = config.events;
    let running = 100;
    const out: TimelineEntry[] = [];
    for (const ev of events) {
      const ruleKey = EVENT_TO_RULE[ev.kind];
      const rule = ruleKey ? rules[ruleKey] : undefined;
      const isStrikeRow = ev.kind === "violation_strike";
      const isAutoSubmit = ev.kind === "auto_submitted";
      // Only include integrity-relevant events. Skip pure lifecycle noise
      // (attempt_start, fullscreen_enter, webcam_grant, etc.).
      const include = !!rule || isStrikeRow || isAutoSubmit;
      if (!include) continue;

      let penalty = 0;
      if (rule?.weight && rule.weight > 0 && rule.weight < 100) {
        penalty = rule.weight;
        running = Math.max(0, running - penalty);
      }
      const meta = KIND_META[ev.kind] ?? { label: ev.kind.replace(/_/g, " "), icon: ShieldAlert };
      out.push({
        id: ev.id,
        at: new Date(ev.created_at),
        kind: ev.kind,
        label: meta.label,
        icon: meta.icon,
        penalty,
        runningScore: running,
        strike: !!rule?.strike || isStrikeRow,
        autoSubmitted: isAutoSubmit,
        payload: ev.payload,
      });
    }
    return out;
  }, [events, config]);

  const totalDeduction = useMemo(
    () => entries.reduce((sum, e) => sum + e.penalty, 0),
    [entries]
  );

  const visibleEntries = expanded ? entries : entries.slice(0, 8);
  const hasMore = entries.length > visibleEntries.length;

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-md border border-border bg-card/60 px-3 py-4 flex items-center gap-2 text-sm text-muted-foreground",
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading integrity timeline…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive",
          className
        )}
        role="alert"
      >
        Couldn't load the integrity timeline: {error}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div
        className={cn(
          "rounded-md border border-border bg-card/60 px-3 py-3 text-sm text-muted-foreground flex items-center gap-2",
          className
        )}
      >
        <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
        <span>No integrity events recorded. Your attempt was clean.</span>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "rounded-md border border-border bg-card/60 overflow-hidden",
        className
      )}
      aria-label="Integrity event timeline"
    >
      <header className="px-3 py-2.5 border-b border-border flex items-center justify-between gap-2 bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            Integrity timeline
          </h3>
        </div>
        <div className="text-[11px] text-muted-foreground tabular-nums shrink-0">
          {entries.length} event{entries.length === 1 ? "" : "s"} ·{" "}
          <span className="text-destructive">−{totalDeduction}</span> pts
          {typeof finalScore === "number" && (
            <>
              {" "}· <span className="font-semibold text-foreground">{Math.round(finalScore)}%</span>
            </>
          )}
        </div>
      </header>

      <ol className="divide-y divide-border">
        {visibleEntries.map((e) => {
          const Icon = e.icon;
          return (
            <li key={e.id} className="px-3 py-2.5 flex items-start gap-3">
              <div
                className={cn(
                  "h-7 w-7 rounded-md grid place-items-center shrink-0 mt-0.5",
                  e.autoSubmitted
                    ? "bg-destructive/15 text-destructive"
                    : e.strike
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium leading-tight truncate">{e.label}</p>
                  {e.strike && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      Strike
                    </span>
                  )}
                  {e.autoSubmitted && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider rounded px-1.5 py-0.5 bg-destructive/15 text-destructive">
                      Auto-submitted
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <time dateTime={e.at.toISOString()} title={e.at.toLocaleString()}>
                    {formatDate(e.at)} · {formatTime(e.at)}
                  </time>
                  {e.penalty > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-destructive font-medium">−{e.penalty} pts</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    Score after: <span className="font-medium text-foreground">{e.runningScore}%</span>
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {hasMore && (
        <div className="border-t border-border px-3 py-2 bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setExpanded(true)}
          >
            <ChevronDown className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            Show {entries.length - visibleEntries.length} more
          </Button>
        </div>
      )}
      {expanded && entries.length > 8 && (
        <div className="border-t border-border px-3 py-2 bg-muted/20">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setExpanded(false)}
          >
            <ChevronUp className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            Collapse
          </Button>
        </div>
      )}
    </section>
  );
}

// Avoid unused-import lint failures (Eye is part of the public icon set).
export const _IconExports = { Eye };
