import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LifeBuoy, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logSideEyeAction } from "./lib/adminAuditLog";

interface Report {
  id: string;
  user_id: string;
  category: string;
  message: string | null;
  status: string;
  created_at: string;
}

interface Props {
  contestId: string;
}

export function SideEyeCandidateReportsPanel({ contestId }: Props) {
  const [rows, setRows] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("sideeye_candidate_reports" as never)
      .select("id, user_id, category, message, status, created_at" as never)
      .eq("contest_id", contestId)
      .order("created_at", { ascending: false })
      .limit(50);
    setRows((data as unknown as Report[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [contestId]);

  // realtime
  useEffect(() => {
    const ch = supabase
      .channel(`candidate-reports-${contestId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "sideeye_candidate_reports", filter: `contest_id=eq.${contestId}`,
      }, () => { void load(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [contestId]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolve = async (id: string) => {
    setBusy(id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("sideeye_candidate_reports" as never)
        .update({
          status: "resolved",
          resolver_id: user.id,
          resolved_at: new Date().toISOString(),
        } as never)
        .eq("id", id);
      if (error) throw error;
      await logSideEyeAction("sideeye_candidate_report_resolve", contestId, { report_id: id });
      toast.success("Marked resolved");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const open = rows.filter((r) => r.status === "open");

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur p-4 space-y-3">
      <div className="flex items-center gap-2">
        <LifeBuoy className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Candidate reports</h3>
        <Badge variant="outline">{open.length} open</Badge>
      </div>
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No reports yet.</p>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 text-sm border border-border/60 rounded-lg p-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{r.category}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleTimeString()}
                  </span>
                  {r.status === "resolved" && <Badge variant="outline" className="text-[10px]">resolved</Badge>}
                </div>
                {r.message && <p className="text-xs mt-1 break-words">{r.message}</p>}
              </div>
              {r.status === "open" && (
                <Button size="sm" variant="outline" onClick={() => resolve(r.id)} disabled={busy === r.id}>
                  {busy === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
