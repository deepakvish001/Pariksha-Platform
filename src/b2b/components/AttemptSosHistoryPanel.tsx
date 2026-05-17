import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertOctagon, CheckCheck, CheckCircle2, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type SosStatus = "open" | "acknowledged" | "resolved";

type SosRow = {
  id: string;
  attempt_id: string;
  raised_by: string;
  issue: string;
  notes: string | null;
  status: SosStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
  delivery_status: "queued" | "sent" | "failed";
};

const STATUS_META: Record<SosStatus, { label: string; tone: string; icon: typeof AlertOctagon }> = {
  open: { label: "Open", tone: "bg-red-500/15 text-red-500 border-red-500/30", icon: AlertOctagon },
  acknowledged: { label: "Acknowledged", tone: "bg-amber-500/15 text-amber-500 border-amber-500/30", icon: CheckCheck },
  resolved: { label: "Resolved", tone: "bg-green-500/15 text-green-500 border-green-500/30", icon: CheckCircle2 },
  
};

function useSosHistory(attemptId?: string) {
  return useQuery({
    queryKey: ["b2b", "attempt-sos", attemptId],
    enabled: !!attemptId,
    queryFn: async (): Promise<SosRow[]> => {
      const { data, error } = await supabase
        .from("assessment_sos_events")
        .select("*")
        .eq("attempt_id", attemptId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SosRow[];
    },
  });
}

function useUpdateSos(attemptId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; action: "acknowledge" | "resolve" }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const patch =
        input.action === "acknowledge"
          ? { status: "acknowledged" as SosStatus, acknowledged_by: user.id, acknowledged_at: new Date().toISOString() }
          : { status: "resolved" as SosStatus, resolved_by: user.id, resolved_at: new Date().toISOString() };

      const { error } = await supabase
        .from("assessment_sos_events")
        .update(patch)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["b2b", "attempt-sos", attemptId] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed to update SOS"),
  });
}

export default function AttemptSosHistoryPanel({ attemptId }: { attemptId: string }) {
  const { data = [], isLoading } = useSosHistory(attemptId);
  const update = useUpdateSos(attemptId);
  const qc = useQueryClient();

  // Realtime: re-fetch on any change to this attempt's SOS rows
  useEffect(() => {
    if (!attemptId) return;
    const channel = supabase
      .channel(`sos-history-${attemptId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assessment_sos_events", filter: `attempt_id=eq.${attemptId}` },
        () => qc.invalidateQueries({ queryKey: ["b2b", "attempt-sos", attemptId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [attemptId, qc]);

  const openCount = data.filter((r) => r.status === "open").length;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-red-500" />
          SOS history
          {openCount > 0 && (
            <Badge variant="outline" className="text-xs bg-red-500/15 text-red-500 border-red-500/30">
              {openCount} open
            </Badge>
          )}
        </CardTitle>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">{data.length} total</span>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading…
          </div>
        ) : data.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-foreground))] py-2">
            No SOS alerts from this candidate.
          </div>
        ) : (
          <ul className="space-y-2">
            {data.map((r) => {
              const meta = STATUS_META[r.status];
              const Icon = meta.icon;
              const canAck = r.status === "open";
              const canResolve = r.status === "open" || r.status === "acknowledged";
              const busy = update.isPending && update.variables?.id === r.id;
              return (
                <li
                  key={r.id}
                  className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${meta.tone}`}>
                          <Icon className="h-3 w-3 mr-1" /> {meta.label}
                        </Badge>
                        <span className="text-sm font-medium truncate">{r.issue}</span>
                        {r.delivery_status !== "sent" && (
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {r.delivery_status}
                          </Badge>
                        )}
                      </div>
                      {r.notes && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 whitespace-pre-wrap">
                          {r.notes}
                        </p>
                      )}
                      <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>
                          Raised {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </span>
                        {r.acknowledged_at && (
                          <span>
                            Acknowledged{" "}
                            {formatDistanceToNow(new Date(r.acknowledged_at), { addSuffix: true })}
                          </span>
                        )}
                        {r.resolved_at && (
                          <span>
                            Resolved{" "}
                            {formatDistanceToNow(new Date(r.resolved_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!canAck || busy}
                        onClick={async () => {
                          await update.mutateAsync({ id: r.id, action: "acknowledge" });
                          toast.success("SOS acknowledged");
                        }}
                      >
                        <CheckCheck className="h-3 w-3 mr-1" /> Ack
                      </Button>
                      <Button
                        size="sm"
                        disabled={!canResolve || busy}
                        onClick={async () => {
                          await update.mutateAsync({ id: r.id, action: "resolve" });
                          toast.success("SOS resolved");
                        }}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
