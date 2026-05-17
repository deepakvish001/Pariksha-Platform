import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  ClipboardCopy,
  EyeOff,
  Loader2,
  Monitor,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Terminal,
  Printer,
  ZapOff,
} from "lucide-react";
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
  className?: string;
}

interface AttemptEventRow {
  kind: string;
  created_at: string;
}

// Same mapping used by the timeline so totals are consistent.
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

type FactorKey =
  | "tab_switch"
  | "webcam"
  | "clipboard"
  | "device"
  | "focus"
  | "other";

interface FactorDef {
  key: FactorKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  kinds: string[];
}

const FACTORS: FactorDef[] = [
  {
    key: "tab_switch",
    label: "Tab switching",
    icon: EyeOff,
    kinds: ["visibility_hidden", "window_blur"],
  },
  {
    key: "webcam",
    label: "Webcam checks",
    icon: Camera,
    kinds: ["webcam_lost", "no_face", "multi_face", "side_eye_lost"],
  },
  {
    key: "clipboard",
    label: "Copy / paste",
    icon: ClipboardCopy,
    kinds: ["copy", "cut", "paste", "paste_large"],
  },
  {
    key: "device",
    label: "Device changes",
    icon: Smartphone,
    kinds: ["device_change", "second_monitor", "screenshare_lost"],
  },
  {
    key: "focus",
    label: "Fullscreen / focus",
    icon: Monitor,
    kinds: ["fullscreen_exit"],
  },
  {
    key: "other",
    label: "Other flags",
    icon: ShieldAlert,
    kinds: ["devtools_attempt", "print_blocked", "typing_burst"],
  },
];

const OTHER_ICON_OVERRIDES: Record<string, React.ComponentType<{ className?: string }>> = {
  devtools_attempt: Terminal,
  print_blocked: Printer,
  typing_burst: ZapOff,
};

export function IntegrityFactorSummary({ attemptId, assessmentId, className }: Props) {
  const [events, setEvents] = useState<AttemptEventRow[] | null>(null);
  const [config, setConfig] = useState<ProctoringConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [eventsRes, assessmentRes] = await Promise.all([
          supabase
            .from("attempt_events")
            .select("kind, created_at")
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
          setError(e instanceof Error ? e.message : "Couldn't load factor summary");
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

  const factorRows = useMemo(() => {
    if (!events || !config) return [];
    const rules = config.events;
    return FACTORS.map((f) => {
      let count = 0;
      let penalty = 0;
      let lastAt: Date | null = null;
      for (const ev of events) {
        if (!f.kinds.includes(ev.kind)) continue;
        count += 1;
        const ruleKey = EVENT_TO_RULE[ev.kind];
        const rule = ruleKey ? rules[ruleKey] : undefined;
        if (rule?.weight && rule.weight > 0 && rule.weight < 100) {
          penalty += rule.weight;
        }
        const t = new Date(ev.created_at);
        if (!lastAt || t > lastAt) lastAt = t;
      }
      return { ...f, count, penalty, lastAt };
    });
  }, [events, config]);

  const totalCount = factorRows.reduce((s, r) => s + r.count, 0);

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-md border border-border bg-card/60 px-3 py-4 flex items-center gap-2 text-sm text-muted-foreground",
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading factor summary…
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
        Couldn't load the factor summary: {error}
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div
        className={cn(
          "rounded-md border border-border bg-card/60 px-3 py-3 text-sm text-muted-foreground flex items-center gap-2",
          className
        )}
      >
        <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
        <span>No flags across any integrity factor.</span>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "rounded-md border border-border bg-card/60 overflow-hidden",
        className
      )}
      aria-label="Integrity factor summary"
    >
      <header className="px-3 py-2.5 border-b border-border flex items-center justify-between gap-2 bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            Factor summary
          </h3>
        </div>
        <div className="text-[11px] text-muted-foreground tabular-nums shrink-0">
          {totalCount} flag{totalCount === 1 ? "" : "s"} across{" "}
          {factorRows.filter((r) => r.count > 0).length} factor
          {factorRows.filter((r) => r.count > 0).length === 1 ? "" : "s"}
        </div>
      </header>

      <ul
        className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border"
        role="list"
      >
        {factorRows.map((row) => {
          const Icon = row.icon;
          const flagged = row.count > 0;
          return (
            <li
              key={row.key}
              className={cn(
                "bg-card px-3 py-2.5 flex items-start gap-3",
                !flagged && "opacity-60"
              )}
            >
              <div
                className={cn(
                  "h-7 w-7 rounded-md grid place-items-center shrink-0 mt-0.5",
                  flagged
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium leading-tight truncate">
                    {row.label}
                  </p>
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums shrink-0",
                      flagged ? "text-foreground" : "text-muted-foreground"
                    )}
                    aria-label={`${row.count} event${row.count === 1 ? "" : "s"}`}
                  >
                    {row.count}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                  {row.penalty > 0 ? (
                    <span className="text-destructive font-medium">
                      −{row.penalty} pts
                    </span>
                  ) : (
                    <span>No deduction</span>
                  )}
                  {row.lastAt && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        last{" "}
                        <time
                          dateTime={row.lastAt.toISOString()}
                          title={row.lastAt.toLocaleString()}
                        >
                          {row.lastAt.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

void OTHER_ICON_OVERRIDES;
