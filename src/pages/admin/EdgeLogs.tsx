import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useEdgeLogs } from "@/hooks/admin/useAdminControl";

const EdgeLogs = () => {
  const [fnName, setFnName] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const { data, isFetching, refetch } = useEdgeLogs(active, !!active || active === "");

  const rows: any[] = Array.isArray(data?.data) ? (data!.data as any[]) : [];

  return (
    <AdminShell>
      <h1 className="mb-4 text-2xl font-bold">Edge Function Logs</h1>

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs">Function name (optional filter)</Label>
            <Input
              value={fnName}
              onChange={(e) => setFnName(e.target.value)}
              placeholder="e.g. byteskill-ai"
            />
          </div>
          <Button onClick={() => { setActive(fnName); refetch(); }} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Fetch logs
          </Button>
        </div>
      </Card>

      {data?.warning && (
        <Card className="mb-4 flex items-start gap-2 border-yellow-500/30 bg-yellow-500/5 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-500" />
          <p className="text-sm text-muted-foreground">{data.warning}</p>
        </Card>
      )}

      {data?.error && (
        <Card className="mb-4 flex items-start gap-2 border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{data.error}</p>
        </Card>
      )}

      <Card className="p-4">
        {!active ? (
          <p className="text-muted-foreground text-sm">Click "Fetch logs" to load recent edge function activity.</p>
        ) : isFetching ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No log entries found.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r, i) => (
              <li key={r.id ?? i} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-mono ${
                    r.status_code >= 500 ? "bg-destructive/20 text-destructive" :
                    r.status_code >= 400 ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" :
                    "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  }`}>
                    {r.method} {r.status_code}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {r.execution_time_ms ? `${r.execution_time_ms}ms` : "—"}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {r.timestamp ? new Date(Number(r.timestamp) / 1000).toLocaleString() : ""}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
                  {r.event_message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminShell>
  );
};

export default EdgeLogs;
