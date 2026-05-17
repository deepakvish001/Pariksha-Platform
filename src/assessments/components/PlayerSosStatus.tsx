import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CloudOff, LifeBuoy, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNowStrict } from "date-fns";
import {
  flushSosQueue,
  getQueuedSos,
  subscribeSosQueue,
  SOS_DELIVERY_FAILED_THRESHOLD,
  type QueuedSos,
} from "@/assessments/lib/sosDeliveryQueue";

type SosStatus = "open" | "acknowledged" | "resolved" | "cancelled";
type DeliveryStatus = "queued" | "sent" | "failed";

interface SosRow {
  id: string;
  attempt_id: string;
  issue: string;
  status: SosStatus;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  delivery_status: DeliveryStatus | null;
  delivery_error: string | null;
}

interface Props {
  attemptId?: string | null;
}

/**
 * Live status pill for the candidate's most-recent SOS request.
 * - Hidden when no SOS has ever been raised for this attempt.
 * - Updates live via realtime when a proctor acknowledges or resolves.
 * - "resolved" / "cancelled" stays visible for 12s so the candidate sees the
 *   confirmation, then disappears.
 */
export function PlayerSosStatus({ attemptId }: Props) {
  const [sos, setSos] = useState<SosRow | null>(null);
  const [hidden, setHidden] = useState(false);
  const [tick, setTick] = useState(0);
  const [queued, setQueued] = useState<QueuedSos[]>(() => getQueuedSos(attemptId));

  // Mirror the local delivery queue so the pill can show "queued" / "failed"
  // states the moment they happen — even before any DB row exists.
  useEffect(() => {
    return subscribeSosQueue((items) =>
      setQueued(attemptId ? items.filter((i) => i.attempt_id === attemptId) : items)
    );
  }, [attemptId]);

  // Initial fetch + realtime subscription
  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;

    const fetchLatest = async () => {
      const { data } = await supabase
        .from("assessment_sos_events")
        .select(
          "id, attempt_id, issue, status, created_at, acknowledged_at, resolved_at, resolution_note, delivery_status, delivery_error"
        )
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) {
        setSos(data as SosRow);
        setHidden(false);
      }
    };
    fetchLatest();

    const channel = supabase
      .channel(`sos-status-${attemptId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assessment_sos_events",
          filter: `attempt_id=eq.${attemptId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as SosRow | undefined;
          if (!row) return;
          setSos((prev) => {
            // Always prefer the most recent row by created_at
            if (!prev || new Date(row.created_at) >= new Date(prev.created_at)) {
              return row;
            }
            return prev.id === row.id ? row : prev;
          });
          setHidden(false);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [attemptId]);

  // Live "X ago" updater
  useEffect(() => {
    if (!sos) return;
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, [sos]);

  // Auto-hide once resolved / cancelled so the chip doesn't linger forever
  useEffect(() => {
    if (!sos) return;
    if (sos.status === "resolved" || sos.status === "cancelled") {
      const id = setTimeout(() => setHidden(true), 12_000);
      return () => clearTimeout(id);
    }
  }, [sos?.id, sos?.status]);

  if (!attemptId || hidden) return null;

  void tick; // keep ESLint happy; tick triggers re-render only

  const since = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

  // Anything sitting in the local queue takes visual precedence — it means
  // the candidate's last alert hasn't reached the proctor yet.
  const latestQueued = queued[queued.length - 1] ?? null;

  let icon: JSX.Element;
  let label: string;
  let detail: string;
  let toneClasses: string;
  let pulse = false;
  let issueHeader: string;
  let retry: (() => void) | null = null;

  if (latestQueued && latestQueued.tries >= SOS_DELIVERY_FAILED_THRESHOLD) {
    icon = <XCircle className="h-3.5 w-3.5" />;
    label = "Delivery failed";
    detail = `We couldn't reach the proctor after ${latestQueued.tries} tries${
      latestQueued.lastError ? ` — ${latestQueued.lastError}` : ""
    }. Please call support.`;
    toneClasses = "border-destructive/50 bg-destructive/15 text-destructive";
    issueHeader = latestQueued.issue;
    retry = () => void flushSosQueue();
  } else if (latestQueued) {
    icon = <CloudOff className="h-3.5 w-3.5" />;
    label = "SOS queued";
    detail = `You're offline. We'll deliver this automatically on reconnect • saved ${since(
      latestQueued.client_attempted_at
    )}${latestQueued.tries > 0 ? ` • ${latestQueued.tries} retry attempts` : ""}`;
    toneClasses = "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300";
    pulse = true;
    issueHeader = latestQueued.issue;
    retry = () => void flushSosQueue();
  } else if (!sos) {
    return null;
  } else if (sos.delivery_status === "failed") {
    icon = <XCircle className="h-3.5 w-3.5" />;
    label = "Delivery failed";
    detail = sos.delivery_error
      ? `Last error: ${sos.delivery_error}. Call support if you still need help.`
      : "Delivery failed. Call support if you still need help.";
    toneClasses = "border-destructive/50 bg-destructive/15 text-destructive";
    issueHeader = sos.issue;
  } else if (sos.status === "acknowledged" && sos.acknowledged_at) {
    icon = <LifeBuoy className="h-3.5 w-3.5" />;
    label = "Proctor on it";
    detail = `Acknowledged ${since(sos.acknowledged_at)} • help is coming`;
    toneClasses = "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    issueHeader = sos.issue;
  } else if (sos.status === "resolved" && sos.resolved_at) {
    icon = <CheckCircle2 className="h-3.5 w-3.5" />;
    label = "Resolved";
    detail = `Marked resolved ${since(sos.resolved_at)}${
      sos.resolution_note ? ` — ${sos.resolution_note}` : ""
    }`;
    toneClasses =
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    issueHeader = sos.issue;
  } else if (sos.status === "cancelled") {
    icon = <AlertTriangle className="h-3.5 w-3.5" />;
    label = "SOS cancelled";
    detail = "This alert was cancelled.";
    toneClasses = "border-muted-foreground/30 bg-muted/40 text-muted-foreground";
    issueHeader = sos.issue;
  } else {
    // status === "open"
    icon = <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    label = "SOS sent";
    detail = `Awaiting proctor • raised ${since(sos.created_at)}`;
    toneClasses = "border-destructive/40 bg-destructive/10 text-destructive";
    pulse = true;
    issueHeader = sos.issue;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={retry ?? undefined}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            "hidden sm:flex items-center gap-1.5 h-8 px-2 rounded-md border text-[11px] font-medium",
            toneClasses,
            retry && "cursor-pointer hover:brightness-110"
          )}
        >
          <span className="relative flex items-center justify-center">
            {pulse && (
              <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-current opacity-30 animate-ping" />
            )}
            <span className="relative">{icon}</span>
          </span>
          <span className="leading-none">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="max-w-xs text-xs">
          <div className="font-semibold mb-0.5">{issueHeader}</div>
          <div className="text-muted-foreground">{detail}</div>
          {retry && (
            <div className="mt-1 text-[10px] text-muted-foreground italic">
              Click pill to retry delivery now.
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
