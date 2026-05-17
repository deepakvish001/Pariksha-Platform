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

  // Initial fetch + realtime subscription
  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;

    const fetchLatest = async () => {
      const { data } = await supabase
        .from("assessment_sos_events")
        .select(
          "id, attempt_id, issue, status, created_at, acknowledged_at, resolved_at, resolution_note"
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

  if (!attemptId || !sos || hidden) return null;

  void tick; // keep ESLint happy; tick triggers re-render only

  const since = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

  let icon = <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  let label = "SOS sent";
  let detail = `Awaiting proctor • raised ${since(sos.created_at)}`;
  let toneClasses =
    "border-destructive/40 bg-destructive/10 text-destructive";
  let pulse = true;

  if (sos.status === "acknowledged" && sos.acknowledged_at) {
    icon = <LifeBuoy className="h-3.5 w-3.5" />;
    label = "Proctor on it";
    detail = `Acknowledged ${since(sos.acknowledged_at)} • help is coming`;
    toneClasses =
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    pulse = false;
  } else if (sos.status === "resolved" && sos.resolved_at) {
    icon = <CheckCircle2 className="h-3.5 w-3.5" />;
    label = "Resolved";
    detail = `Marked resolved ${since(sos.resolved_at)}${
      sos.resolution_note ? ` — ${sos.resolution_note}` : ""
    }`;
    toneClasses =
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    pulse = false;
  } else if (sos.status === "cancelled") {
    icon = <AlertTriangle className="h-3.5 w-3.5" />;
    label = "SOS cancelled";
    detail = "This alert was cancelled.";
    toneClasses =
      "border-muted-foreground/30 bg-muted/40 text-muted-foreground";
    pulse = false;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            "hidden sm:flex items-center gap-1.5 h-8 px-2 rounded-md border text-[11px] font-medium",
            toneClasses
          )}
        >
          <span className={cn("relative flex items-center justify-center", pulse && "")}>
            {pulse && (
              <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-destructive/40 animate-ping" />
            )}
            <span className="relative">{icon}</span>
          </span>
          <span className="leading-none">{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="max-w-xs text-xs">
          <div className="font-semibold mb-0.5">{sos.issue}</div>
          <div className="text-muted-foreground">{detail}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
