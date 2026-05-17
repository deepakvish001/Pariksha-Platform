import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertOctagon,
  CheckCheck,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/utils";

type SosStatus = "open" | "acknowledged" | "resolved" | "cancelled";
type DeliveryStatus = "queued" | "sent" | "failed";

interface SosRow {
  id: string;
  issue: string;
  notes: string | null;
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

const STATUS_META: Record<
  SosStatus,
  { label: string; tone: string; icon: typeof AlertOctagon }
> = {
  open: {
    label: "Awaiting proctor",
    tone: "border-destructive/40 bg-destructive/10 text-destructive",
    icon: Loader2,
  },
  acknowledged: {
    label: "Proctor on it",
    tone: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: CheckCheck,
  },
  resolved: {
    label: "Resolved",
    tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    tone: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
    icon: Clock,
  },
};

const fmtFull = (iso: string) => format(new Date(iso), "MMM d, h:mm:ss a");
const fmtRel = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });

export function PlayerSosTimeline({ attemptId }: Props) {
  const [rows, setRows] = useState<SosRow[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;

    const fetchRows = async () => {
      const { data } = await supabase
        .from("assessment_sos_events")
        .select(
          "id, issue, notes, status, created_at, acknowledged_at, resolved_at, resolution_note, delivery_status, delivery_error"
        )
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: false });
      if (!cancelled) setRows((data ?? []) as SosRow[]);
    };
    fetchRows();

    const channel = supabase
      .channel(`sos-timeline-${attemptId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assessment_sos_events",
          filter: `attempt_id=eq.${attemptId}`,
        },
        () => fetchRows()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [attemptId]);

  if (!attemptId) return null;
  const total = rows?.length ?? 0;
  if (total === 0) return null; // hide until candidate has raised at least one SOS

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex h-8 px-2 gap-1.5 text-[11px]"
          aria-label="SOS history"
        >
          <History className="h-3.5 w-3.5" />
          <span>History</span>
          <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">
            {total}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="text-xs font-semibold">Your SOS timeline</div>
          <div className="text-[10px] text-muted-foreground">{total} alert{total === 1 ? "" : "s"}</div>
        </div>
        <ScrollArea className="max-h-[24rem]">
          <ul className="p-3 space-y-3">
            {rows?.map((r) => {
              const meta = STATUS_META[r.status];
              const StatusIcon = meta.icon;
              const events: { at: string; label: string; node: JSX.Element }[] = [];

              events.push({
                at: r.created_at,
                label: "Raised",
                node: (
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <AlertOctagon className="h-3 w-3" /> Raised
                  </span>
                ),
              });
              if (r.acknowledged_at) {
                events.push({
                  at: r.acknowledged_at,
                  label: "Acknowledged",
                  node: (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <CheckCheck className="h-3 w-3" /> Acknowledged by proctor
                    </span>
                  ),
                });
              }
              if (r.resolved_at) {
                events.push({
                  at: r.resolved_at,
                  label: "Resolved",
                  node: (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Marked resolved
                    </span>
                  ),
                });
              }
              if (r.delivery_status === "failed") {
                events.push({
                  at: r.created_at,
                  label: "Delivery failed",
                  node: (
                    <span className="inline-flex items-center gap-1 text-destructive">
                      <XCircle className="h-3 w-3" /> Delivery failed
                      {r.delivery_error ? ` — ${r.delivery_error}` : ""}
                    </span>
                  ),
                });
              }
              // chronological order within a single SOS
              events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

              return (
                <li
                  key={r.id}
                  className="rounded-md border border-border bg-card/40 p-2.5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{r.issue}</div>
                      {r.notes && (
                        <div className="text-[11px] text-muted-foreground whitespace-pre-wrap mt-0.5">
                          {r.notes}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] shrink-0", meta.tone)}>
                      <StatusIcon
                        className={cn(
                          "h-3 w-3 mr-1",
                          r.status === "open" && "animate-spin"
                        )}
                      />
                      {meta.label}
                    </Badge>
                  </div>

                  <ol className="relative border-l border-border/70 ml-1.5 pl-3 space-y-1.5">
                    {events.map((e, idx) => (
                      <li key={`${r.id}-${idx}`} className="relative">
                        <span className="absolute -left-[15px] top-1 h-1.5 w-1.5 rounded-full bg-foreground/60" />
                        <div className="text-[11px] leading-tight">{e.node}</div>
                        <div
                          className="text-[10px] text-muted-foreground"
                          title={fmtFull(e.at)}
                        >
                          {fmtRel(e.at)} • {fmtFull(e.at)}
                        </div>
                      </li>
                    ))}
                  </ol>

                  {r.resolution_note && (
                    <div className="text-[11px] text-muted-foreground italic border-t border-border pt-1.5">
                      Note from proctor: {r.resolution_note}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
