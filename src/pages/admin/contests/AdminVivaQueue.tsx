import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface VivaRow {
  id: string;
  contest_id: string;
  user_id: string;
  session_id: string | null;
  rank: number | null;
  reason: string;
  status: string;
  scheduled_at: string | null;
  notes: string | null;
  created_at: string;
}

/**
 * Mandatory Viva Queue — top-N finishers automatically queued for an
 * oral defence of their solution. Admins can mark passed/failed/skipped
 * and add notes; failures feed into the DQ sign-off flow.
 */
export default function AdminVivaQueue() {
  const [rows, setRows] = useState<VivaRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contest_viva_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    else setRows((data ?? []) as VivaRow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const updateStatus = async (id: string, status: VivaRow["status"]) => {
    const { error } = await supabase
      .from("contest_viva_queue")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Marked ${status}`); void load(); }
  };

  return (
    <div className="space-y-6 p-6">
      <Helmet><title>Viva Queue · Admin</title></Helmet>
      <div>
        <h1 className="text-2xl font-bold">Mandatory Viva Queue</h1>
        <p className="text-sm text-muted-foreground">
          Top finishers and flagged sessions queued for oral defence.
        </p>
      </div>

      {loading ? <div>Loading…</div> : (
        <div className="space-y-3">
          {rows.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground">No viva entries yet.</Card>
          )}
          {rows.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={r.status === "pending" ? "outline" : r.status === "passed" ? "default" : "destructive"}>
                    {r.status}
                  </Badge>
                  {r.rank != null && <Badge variant="secondary">Rank #{r.rank}</Badge>}
                  <span className="text-muted-foreground">{r.reason}</span>
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  user {r.user_id.slice(0, 8)} · contest {r.contest_id.slice(0, 8)}
                  {r.session_id && ` · session ${r.session_id.slice(0, 8)}`}
                </div>
                {r.notes && <p className="text-xs">{r.notes}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "scheduled")}>Schedule</Button>
                <Button size="sm" onClick={() => updateStatus(r.id, "passed")}>Pass</Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, "failed")}>Fail</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
