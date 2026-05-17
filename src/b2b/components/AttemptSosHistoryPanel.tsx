import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertOctagon,
  CheckCheck,
  CheckCircle2,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type SosStatus = "open" | "acknowledged" | "resolved";
type StatusFilter = "all" | SosStatus;
type TimeFilter = "all" | "24h" | "7d" | "30d";

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

const TIME_WINDOW_MS: Record<Exclude<TimeFilter, "all">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
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

function useProctorProfiles(ids: string[]) {
  const key = useMemo(() => [...new Set(ids)].sort(), [ids]);
  return useQuery({
    queryKey: ["b2b", "proctor-profiles", key],
    enabled: key.length > 0,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", key);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) {
        if (row.user_id) map[row.user_id] = row.full_name ?? "";
      }
      return map;
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

function shortId(id: string) {
  return id.slice(0, 6);
}

export default function AttemptSosHistoryPanel({ attemptId }: { attemptId: string }) {
  const { data = [], isLoading } = useSosHistory(attemptId);
  const update = useUpdateSos(attemptId);
  const qc = useQueryClient();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [proctor, setProctor] = useState<string>("all"); // "all" | "unassigned" | user_id
  const [time, setTime] = useState<TimeFilter>("all");
  const [search, setSearch] = useState("");

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

  const proctorIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of data) {
      if (r.acknowledged_by) s.add(r.acknowledged_by);
      if (r.resolved_by) s.add(r.resolved_by);
    }
    return [...s];
  }, [data]);
  const { data: proctorNames = {} } = useProctorProfiles(proctorIds);
  const labelFor = (id: string) => proctorNames[id]?.trim() || `Proctor ${shortId(id)}`;

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = time === "all" ? 0 : now - TIME_WINDOW_MS[time];
    const q = search.trim().toLowerCase();

    return data.filter((r) => {
      if (status !== "all" && r.status !== status) return false;

      if (proctor === "unassigned") {
        if (r.acknowledged_by || r.resolved_by) return false;
      } else if (proctor !== "all") {
        if (r.acknowledged_by !== proctor && r.resolved_by !== proctor) return false;
      }

      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;

      if (q) {
        const hay = `${r.issue} ${r.notes ?? ""} ${r.resolution_note ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, status, proctor, time, search]);

  const openCount = data.filter((r) => r.status === "open").length;
  const hasActiveFilters =
    status !== "all" || proctor !== "all" || time !== "all" || search.trim() !== "";

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
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {filtered.length}
          {hasActiveFilters ? ` of ${data.length}` : ""} shown
        </span>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issue, notes…"
              className="h-8 pl-7 text-xs"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={proctor} onValueChange={setProctor}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="Proctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All proctors</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {proctorIds.map((id) => (
                <SelectItem key={id} value={id}>
                  {labelFor(id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={time} onValueChange={(v) => setTime(v as TimeFilter)}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => {
                setStatus("all");
                setProctor("all");
                setTime("all");
                setSearch("");
              }}
            >
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading…
          </div>
        ) : data.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-foreground))] py-2">
            No SOS alerts from this candidate.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-foreground))] py-2">
            No alerts match the current filters.
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((r) => {
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
                            {r.acknowledged_by && ` by ${labelFor(r.acknowledged_by)}`}
                          </span>
                        )}
                        {r.resolved_at && (
                          <span>
                            Resolved{" "}
                            {formatDistanceToNow(new Date(r.resolved_at), { addSuffix: true })}
                            {r.resolved_by && ` by ${labelFor(r.resolved_by)}`}
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
