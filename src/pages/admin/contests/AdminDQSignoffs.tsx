import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SignoffRow {
  id: string;
  contest_id: string;
  session_id: string;
  user_id: string;
  proposed_by: string;
  proposed_reason: string;
  evidence: Record<string, unknown>;
  approver_id: string | null;
  approver_decision: string | null;
  approver_notes: string | null;
  status: string;
  created_at: string;
}

/**
 * Two-admin sign-off ledger — every disqualification proposal lists
 * here for a second admin to approve or reject. The proposer cannot
 * approve their own request.
 */
export default function AdminDQSignoffs() {
  const { user } = useAuth();
  const [rows, setRows] = useState<SignoffRow[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contest_dq_signoffs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    else setRows((data ?? []) as SignoffRow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const decide = async (id: string, decision: "approved" | "rejected") => {
    const { error } = await supabase
      .from("contest_dq_signoffs")
      .update({
        approver_id: user?.id,
        approver_decision: decision,
        approver_notes: notes[id] ?? null,
        status: decision,
        decided_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Sign-off ${decision}`); void load(); }
  };

  return (
    <div className="space-y-6 p-6">
      <Helmet><title>DQ Sign-offs · Admin</title></Helmet>
      <div>
        <h1 className="text-2xl font-bold">Disqualification Sign-offs</h1>
        <p className="text-sm text-muted-foreground">
          Every DQ proposal requires a second admin to approve before it takes effect.
        </p>
      </div>

      {loading ? <div>Loading…</div> : (
        <div className="space-y-4">
          {rows.length === 0 && (
            <Card className="p-6 text-sm text-muted-foreground">No DQ proposals.</Card>
          )}
          {rows.map((r) => {
            const isOwn = r.proposed_by === user?.id;
            const isPending = r.status === "pending";
            return (
              <Card key={r.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={r.status === "approved" ? "destructive" : r.status === "rejected" ? "secondary" : "outline"}>
                    {r.status}
                  </Badge>
                  <span className="text-sm font-medium">{r.proposed_reason}</span>
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  user {r.user_id.slice(0, 8)} · session {r.session_id.slice(0, 8)} · proposed by {r.proposed_by.slice(0, 8)}
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">Evidence</summary>
                  <pre className="mt-2 max-h-60 overflow-auto rounded bg-muted p-2">
                    {JSON.stringify(r.evidence, null, 2)}
                  </pre>
                </details>
                {isPending && !isOwn && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Decision notes…"
                      value={notes[r.id] ?? ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => decide(r.id, "approved")}>Approve DQ</Button>
                      <Button size="sm" variant="outline" onClick={() => decide(r.id, "rejected")}>Reject</Button>
                    </div>
                  </div>
                )}
                {isOwn && isPending && (
                  <p className="text-xs text-muted-foreground">Awaiting another admin's decision (you proposed this).</p>
                )}
                {!isPending && r.approver_notes && (
                  <p className="text-xs text-muted-foreground">Decision notes: {r.approver_notes}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
