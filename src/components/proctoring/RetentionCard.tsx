import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Eye, Loader2, RefreshCw, Save, ShieldAlert, Trash2 } from "lucide-react";

function fmtTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Shared retention + purge admin panel used by the platform admin
 * and the college (B2B) proctoring dashboards. Settings are stored
 * globally in `platform_settings.proctoring_retention`, so any
 * authorized caller sees the same configuration.
 */
export function RetentionCard() {
  const [snapshotDays, setSnapshotDays] = useState<string>("30");
  const [eventsDays, setEventsDays] = useState<string>("90");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purging, setPurging] = useState(false);
  const [lastResult, setLastResult] = useState<{ snapshots_deleted: number; events_deleted: number } | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [dryRunning, setDryRunning] = useState(false);
  const [estimate, setEstimate] = useState<{ snapshots: number; events: number; at: number } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "proctoring_retention")
        .maybeSingle();
      const v = (data?.value ?? {}) as { snapshot_days?: number; events_days?: number };
      if (typeof v.snapshot_days === "number") setSnapshotDays(String(v.snapshot_days));
      if (typeof v.events_days === "number") setEventsDays(String(v.events_days));
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    const sd = Math.max(1, Math.min(3650, parseInt(snapshotDays, 10) || 0));
    const ed = Math.max(1, Math.min(3650, parseInt(eventsDays, 10) || 0));
    setSaving(true);
    const { error } = await supabase.from("platform_settings").upsert({
      key: "proctoring_retention",
      value: { snapshot_days: sd, events_days: ed } as never,
    });
    setSaving(false);
    if (error) {
      toast.error("Failed to save retention settings", { description: error.message });
      return;
    }
    setSnapshotDays(String(sd));
    setEventsDays(String(ed));
    toast.success("Retention settings saved");
  };

  const runDryRun = useCallback(async (silent = false) => {
    setDryRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("purge-proctoring-data", {
        body: { dry_run: true, source: "manual_dry_run" },
      });
      if (error) throw error;
      const snapshots = (data as any)?.snapshots_to_delete ?? 0;
      const events = (data as any)?.events_to_delete ?? 0;
      setEstimate({ snapshots, events, at: Date.now() });
      if (!silent) {
        toast.success("Dry run complete", {
          description: `Would delete ${snapshots} snapshots & ${events} events`,
        });
      }
      return { snapshots, events };
    } catch (e: any) {
      if (!silent) toast.error("Dry run failed", { description: e.message });
      return null;
    } finally {
      setDryRunning(false);
    }
  }, []);

  const runPurge = async () => {
    setPurging(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke("purge-proctoring-data", {
        body: { source: "manual", triggered_by: userData?.user?.id ?? null },
      });
      if (error) throw error;
      setLastResult({
        snapshots_deleted: (data as any)?.snapshots_deleted ?? 0,
        events_deleted: (data as any)?.events_deleted ?? 0,
      });
      setHistoryKey((k) => k + 1);
      setEstimate(null);
      setConfirmOpen(false);
      toast.success("Purge complete", {
        description: `${(data as any)?.snapshots_deleted ?? 0} snapshots & ${(data as any)?.events_deleted ?? 0} events removed`,
      });
    } catch (e: any) {
      toast.error("Purge failed", { description: e.message });
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" /> Data Retention
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automatically deleted daily. Snapshots are removed from storage; proctoring events are removed from the audit log.
          </p>
        </div>
        <div className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap text-right space-y-0.5">
          {lastResult && (
            <div>Last purge: {lastResult.snapshots_deleted} snapshots, {lastResult.events_deleted} events</div>
          )}
          {estimate && !confirmOpen && (
            <div className="text-emerald-600">
              Dry run: would delete {estimate.snapshots} snapshots, {estimate.events} events
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto_auto] items-end">
        <div className="space-y-1">
          <Label htmlFor="retention-card-snapshots" className="text-xs">Webcam snapshots — keep for (days)</Label>
          <Input
            id="retention-card-snapshots"
            type="number"
            min={1}
            max={3650}
            value={snapshotDays}
            onChange={(e) => setSnapshotDays(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="retention-card-events" className="text-xs">Proctoring events — keep for (days)</Label>
          <Input
            id="retention-card-events"
            type="number"
            min={1}
            max={3650}
            value={eventsDays}
            onChange={(e) => setEventsDays(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button onClick={save} disabled={saving || loading} size="sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
          Save
        </Button>
        <Button
          onClick={() => void runDryRun()}
          disabled={dryRunning || purging || loading}
          size="sm"
          variant="outline"
          title="Estimate without deleting"
        >
          {dryRunning ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Eye className="h-3.5 w-3.5 mr-1.5" />
          )}
          Dry run
        </Button>
        <AlertDialog
          open={confirmOpen}
          onOpenChange={(o) => {
            setConfirmOpen(o);
            if (o && !dryRunning) void runDryRun(true);
          }}
        >
          <AlertDialogTrigger asChild>
            <Button disabled={purging || loading} size="sm" variant="outline">
              {purging ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
              Purge now
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                Purge proctoring data now?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes webcam snapshots older than{" "}
                <span className="font-semibold text-foreground">{snapshotDays} days</span> and proctoring events older than{" "}
                <span className="font-semibold text-foreground">{eventsDays} days</span>. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">Estimated impact</span>
                {dryRunning ? (
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Calculating…
                  </span>
                ) : estimate ? (
                  <span className="tabular-nums">
                    <span className="font-semibold text-foreground">{estimate.snapshots}</span> snapshots ·{" "}
                    <span className="font-semibold text-foreground">{estimate.events}</span> events
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">unavailable</span>
                )}
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={purging}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={runPurge}
                disabled={purging}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {purging && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Yes, purge now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <PurgeHistoryPanel refreshKey={historyKey} />
    </div>
  );
}

interface PurgeRun {
  id: string;
  ran_at: string;
  snapshots_deleted: number;
  events_deleted: number;
  snapshot_days: number | null;
  events_days: number | null;
  source: string;
  error: string | null;
}

function PurgeHistoryPanel({ refreshKey }: { refreshKey: number }) {
  const [runs, setRuns] = useState<PurgeRun[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("proctoring_purge_runs")
      .select("id,ran_at,snapshots_deleted,events_deleted,snapshot_days,events_days,source,error")
      .order("ran_at", { ascending: false })
      .limit(20);
    if (err) {
      setError(err.message);
      setRuns([]);
    } else {
      setRuns((data ?? []) as PurgeRun[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <div className="rounded-md border bg-background/40">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <h4 className="text-xs font-semibold flex items-center gap-1.5">
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          Purge history
          {runs && (
            <span className="text-[10px] font-normal text-muted-foreground tabular-nums">
              ({runs.length})
            </span>
          )}
        </h4>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Refresh purge history"
          title="Refresh"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
        </Button>
      </div>

      {loading && !runs ? (
        <div className="px-3 py-4 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin inline mr-1.5" /> Loading…
        </div>
      ) : error ? (
        <div className="px-3 py-4 text-xs text-destructive">{error}</div>
      ) : !runs || runs.length === 0 ? (
        <div className="px-3 py-4 text-xs text-muted-foreground italic">
          No purge runs recorded yet.
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-[10px] uppercase tracking-wide">When</TableHead>
                <TableHead className="h-8 text-[10px] uppercase tracking-wide">Source</TableHead>
                <TableHead className="h-8 text-[10px] uppercase tracking-wide text-right">Snapshots</TableHead>
                <TableHead className="h-8 text-[10px] uppercase tracking-wide text-right">Events</TableHead>
                <TableHead className="h-8 text-[10px] uppercase tracking-wide text-right">Window</TableHead>
                <TableHead className="h-8 text-[10px] uppercase tracking-wide">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-[11px] py-1.5">{fmtTs(r.ran_at)}</TableCell>
                  <TableCell className="text-[11px] py-1.5 capitalize">{r.source}</TableCell>
                  <TableCell className="text-right tabular-nums text-[11px] py-1.5">
                    {r.snapshots_deleted}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-[11px] py-1.5">
                    {r.events_deleted}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-[11px] py-1.5 text-muted-foreground">
                    {r.snapshot_days ?? "—"}d / {r.events_days ?? "—"}d
                  </TableCell>
                  <TableCell className="text-[11px] py-1.5">
                    {r.error ? (
                      <span className="text-destructive truncate inline-block max-w-[200px]" title={r.error}>
                        Error
                      </span>
                    ) : (
                      <span className="text-emerald-600">OK</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default RetentionCard;
