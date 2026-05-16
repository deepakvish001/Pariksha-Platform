import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Loader2,
  Play,
  RefreshCw,
  History,
} from "lucide-react";
import { ShellHeader } from "./ParikshaaShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type PreviewRow = {
  inferred_source: string;
  count: number;
  sample: Array<{
    id: string;
    email: string;
    name: string | null;
    external_id: string | null;
  }>;
};

type RunRow = {
  id: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  rows_scanned: number;
  rows_updated: number;
  by_source: Record<string, number>;
  status: "ok" | "error";
  error_message: string | null;
  triggered_by: string | null;
};

const SOURCE_TONES: Record<string, string> = {
  bulk_upload: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  api: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  email: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  link: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  manual: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

function tone(src: string) {
  return SOURCE_TONES[src] ?? "bg-muted text-muted-foreground border-border";
}

export default function InviteSourceBackfill() {
  const { toast } = useToast();
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalToUpdate = useMemo(
    () => (preview ?? []).reduce((s, r) => s + Number(r.count ?? 0), 0),
    [preview],
  );

  const loadPreview = async () => {
    setPreviewLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc("preview_invite_source_backfill");
    setPreviewLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setPreview((data ?? []) as PreviewRow[]);
  };

  const loadRuns = async () => {
    setRunsLoading(true);
    const { data, error } = await supabase.rpc(
      "get_invite_source_backfill_runs",
      { p_limit: 25 },
    );
    setRunsLoading(false);
    if (error) {
      toast({
        title: "Couldn't load run history",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setRuns((data ?? []) as RunRow[]);
  };

  useEffect(() => {
    void loadPreview();
    void loadRuns();
  }, []);

  const runBackfill = async () => {
    setRunning(true);
    setError(null);
    const { data, error } = await supabase.rpc(
      "admin_run_invite_source_backfill",
    );
    setRunning(false);
    setConfirmOpen(false);

    if (error) {
      setError(error.message);
      toast({
        title: "Backfill failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    toast({
      title: "Backfill complete",
      description: `Scanned ${row?.rows_scanned ?? 0}, updated ${
        row?.rows_updated ?? 0
      } in ${row?.duration_ms ?? 0}ms`,
    });
    await Promise.all([loadPreview(), loadRuns()]);
  };

  return (
    <div className="space-y-6">
      <ShellHeader
        title="Invite source backfill"
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={loadPreview}
              disabled={previewLoading}
            >
              {previewLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh preview</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={running || totalToUpdate === 0}
            >
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="ml-2">
                Run backfill{totalToUpdate ? ` (${totalToUpdate})` : ""}
              </span>
            </Button>
          </div>
        }
      />

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Preview panel */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl">
        <header className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              Pending: rows with missing source
            </h2>
            <p className="text-xs text-muted-foreground">
              Read-only preview of what the heuristic would assign. Nothing is
              written until you click <em>Run backfill</em>.
            </p>
          </div>
          <Badge variant="outline" className="font-mono">
            {totalToUpdate} row{totalToUpdate === 1 ? "" : "s"}
          </Badge>
        </header>

        {previewLoading && (
          <div className="grid gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg border border-border/40 bg-background/40"
              />
            ))}
          </div>
        )}

        {!previewLoading && preview && preview.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Nothing to do — every invite already has a source.
          </div>
        )}

        {!previewLoading && preview && preview.length > 0 && (
          <ul className="space-y-3">
            {preview.map((row) => (
              <li
                key={row.inferred_source}
                className="rounded-lg border border-border/60 bg-background/40 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs font-medium ${tone(
                        row.inferred_source,
                      )}`}
                    >
                      {row.inferred_source}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      will be assigned to
                    </span>
                    <span className="font-mono text-sm">{row.count}</span>
                    <span className="text-sm text-muted-foreground">
                      row{row.count === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                {row.sample?.length ? (
                  <details className="group mt-2">
                    <summary className="cursor-pointer text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
                      Sample ({row.sample.length})
                    </summary>
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="text-muted-foreground">
                          <tr className="border-b border-border/40">
                            <th className="px-2 py-1 text-left font-normal">
                              email
                            </th>
                            <th className="px-2 py-1 text-left font-normal">
                              name
                            </th>
                            <th className="px-2 py-1 text-left font-normal">
                              external_id
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {row.sample.map((s) => (
                            <tr
                              key={s.id}
                              className="border-b border-border/20 last:border-0"
                            >
                              <td className="px-2 py-1 font-mono">{s.email}</td>
                              <td className="px-2 py-1">{s.name ?? "—"}</td>
                              <td className="px-2 py-1 font-mono">
                                {s.external_id ?? "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Run history */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl">
        <header className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold tracking-tight">
              Recent runs
            </h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={loadRuns}
            disabled={runsLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${runsLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </header>

        {runs.length === 0 && !runsLoading && (
          <p className="text-xs text-muted-foreground">No runs recorded yet.</p>
        )}

        {runs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b border-border/40">
                  <th className="px-2 py-1 text-left font-normal">Started</th>
                  <th className="px-2 py-1 text-right font-normal">Scanned</th>
                  <th className="px-2 py-1 text-right font-normal">Updated</th>
                  <th className="px-2 py-1 text-right font-normal">
                    Duration
                  </th>
                  <th className="px-2 py-1 text-left font-normal">By source</th>
                  <th className="px-2 py-1 text-left font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/20 last:border-0"
                  >
                    <td className="px-2 py-1.5 font-mono">
                      {new Date(r.started_at).toLocaleString()}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono">
                      {r.rows_scanned}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono">
                      {r.rows_updated}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono">
                      {r.duration_ms ?? "—"}ms
                    </td>
                    <td className="px-2 py-1.5">
                      {r.by_source && Object.keys(r.by_source).length ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(r.by_source).map(([k, v]) => (
                            <span
                              key={k}
                              className={`rounded border px-1.5 py-0.5 text-[10px] ${tone(k)}`}
                            >
                              {k}:{v}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      {r.status === "ok" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> ok
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-destructive"
                          title={r.error_message ?? ""}
                        >
                          <AlertTriangle className="h-3 w-3" /> error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run invite source backfill?</AlertDialogTitle>
            <AlertDialogDescription>
              This will assign an inferred <code>source</code> to{" "}
              <strong>{totalToUpdate}</strong> invite
              {totalToUpdate === 1 ? "" : "s"} that currently have none. Rows
              with an existing source are not touched. The run is logged and
              can be reviewed below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={running}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runBackfill} disabled={running}>
              {running ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Run backfill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
