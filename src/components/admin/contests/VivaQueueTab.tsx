import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

type Viva = {
  id: string;
  user_id: string;
  problem_slug: string | null;
  reason: string;
  source: string;
  status: "pending" | "scheduled" | "passed" | "failed" | "waived" | "cancelled";
  scheduled_at: string | null;
  notes: string | null;
  created_at: string;
  full_name?: string | null;
};

const statusTone: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  scheduled: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  passed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  waived: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export function VivaQueueTab({ contestId }: { contestId: string }) {
  const [filter, setFilter] = useState<string>("pending");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState("");

  const q = useQuery({
    queryKey: ["admin-viva", contestId, filter],
    enabled: !!contestId,
    queryFn: async () => {
      let query = supabase
        .from("contest_viva_queue")
        .select("id, user_id, problem_slug, reason, source, status, scheduled_at, notes, created_at")
        .eq("contest_id", contestId)
        .order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((r) => r.user_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, full_name").in("id", ids)
        : { data: [] as { id: string; full_name: string | null }[] };
      const nm = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
      return (data ?? []).map((v) => ({ ...v, full_name: nm.get(v.user_id) ?? null })) as Viva[];
    },
  });

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel(`admin-viva-${contestId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contest_viva_queue", filter: `contest_id=eq.${contestId}` },
        () => q.refetch(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [contestId, q]);

  const updateStatus = async (id: string, status: Viva["status"], userId?: string) => {
    const { error } = await supabase
      .from("contest_viva_queue")
      .update({ status, reviewer_id: (await supabase.auth.getUser()).data.user?.id ?? null })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked ${status}`);
    if (status === "failed" && userId) {
      const { error: dqErr } = await supabase.rpc("contest_force_dq", {
        _contest_id: contestId,
        _user_id: userId,
        _reason: "viva: failed oral verification",
      });
      if (dqErr) toast.error(`DQ failed: ${dqErr.message}`);
      else toast.success("Participant disqualified");
    }
    q.refetch();
  };

  const saveNotes = async (id: string) => {
    const { error } = await supabase
      .from("contest_viva_queue")
      .update({ notes: draftNotes })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Notes saved"); setEditingId(null); q.refetch(); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="waived">Waived</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{(q.data ?? []).length} entries</span>
      </div>

      <Card>
        {q.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : (q.data ?? []).length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No viva entries for this filter. Auto-flagged users from similarity scan land here.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead>Problem</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(q.data ?? []).map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="whitespace-nowrap text-xs">{format(new Date(v.created_at), "PP p")}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{v.full_name ?? "Anonymous"}</div>
                    <div className="text-xs text-muted-foreground">{v.user_id.slice(0, 8)}…</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{v.problem_slug ?? "—"}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={v.reason}>{v.reason}</TableCell>
                  <TableCell>
                    <Badge className={statusTone[v.status]} variant="outline">{v.status}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {editingId === v.id ? (
                      <div className="flex flex-col gap-1">
                        <Textarea
                          value={draftNotes}
                          onChange={(e) => setDraftNotes(e.target.value)}
                          rows={2}
                          className="text-xs"
                        />
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => saveNotes(v.id)}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(v.id); setDraftNotes(v.notes ?? ""); }}
                        className="text-left text-xs text-muted-foreground hover:text-foreground"
                      >
                        {v.notes || "+ Add notes"}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(v.id, "scheduled")}>Schedule</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(v.id, "passed")}>Pass</Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus(v.id, "failed", v.user_id)}>Fail + DQ</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(v.id, "waived")}>Waive</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
