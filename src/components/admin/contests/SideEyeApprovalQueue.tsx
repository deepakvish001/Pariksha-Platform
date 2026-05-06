import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logSideEyeAction } from "./lib/adminAuditLog";

interface Approval {
  id: string;
  action: string;
  payload: Record<string, unknown>;
  requested_by: string;
  reason: string | null;
  status: string;
  requested_at: string;
}

interface Props {
  contestId: string;
  institutionId: string | null;
}

/**
 * Two-person approval queue. When a contest has `two_person_rule` on,
 * destructive actions (chain-expunge, evidence-delete, override-DQ) are
 * recorded here as `pending` and only execute after a different admin approves.
 */
export function SideEyeApprovalQueue({ contestId, institutionId }: Props) {
  const [rows, setRows] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [open, setOpen] = useState<Approval | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  useEffect(() => {
    if (!institutionId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("sideeye_admin_approvals" as never)
        .select("id, action, payload, requested_by, reason, status, requested_at" as never)
        .eq("contest_id", contestId)
        .eq("status", "pending")
        .order("requested_at", { ascending: false })
        .limit(50);
      if (cancelled) return;
      setRows((data as unknown as Approval[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [contestId, institutionId]);

  const decide = async (approve: boolean) => {
    if (!open) return;
    setBusyId(open.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("sideeye_admin_approvals" as never)
        .update({
          status: approve ? "approved" : "rejected",
          approved_by: user.id,
          decided_at: new Date().toISOString(),
          reason: decisionNote || open.reason,
        } as never)
        .eq("id", open.id);
      if (error) throw error;
      await logSideEyeAction(
        approve ? "sideeye_approval_approve" : "sideeye_approval_reject",
        contestId,
        { approval_id: open.id, action: open.action, note: decisionNote },
      );
      toast.success(approve ? "Approved" : "Rejected");
      setRows((r) => r.filter((x) => x.id !== open.id));
      setOpen(null);
      setDecisionNote("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  if (!institutionId) return null;
  if (!loading && rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-amber-500" />
        <h3 className="font-semibold">Pending approvals</h3>
        <Badge variant="outline">{rows.length}</Badge>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 text-sm border border-border/60 rounded-lg p-2">
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{r.action}</div>
              <div className="text-xs text-muted-foreground truncate">{r.reason || "No reason given"}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setOpen(r)} disabled={busyId === r.id}>
              Review
            </Button>
          </li>
        ))}
      </ul>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve destructive action</DialogTitle>
            <DialogDescription>
              Two-person rule: a different admin must approve before this runs.
            </DialogDescription>
          </DialogHeader>
          {open && (
            <div className="space-y-3">
              <div className="text-sm">
                <div><span className="text-muted-foreground">Action:</span> <code className="text-xs">{open.action}</code></div>
                <div className="mt-1"><span className="text-muted-foreground">Reason:</span> {open.reason || "—"}</div>
              </div>
              <Textarea
                placeholder="Decision note (optional)"
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => decide(false)} disabled={!!busyId}>
              {busyId ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
              Reject
            </Button>
            <Button onClick={() => decide(true)} disabled={!!busyId}>
              {busyId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Helper used by destructive action buttons to enqueue an approval request. */
export async function requestApproval(args: {
  contestId: string;
  institutionId: string;
  action: string;
  payload?: Record<string, unknown>;
  reason?: string;
}): Promise<{ id: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast.error("Not signed in"); return null; }
  const { data, error } = await supabase
    .from("sideeye_admin_approvals" as never)
    .insert({
      contest_id: args.contestId,
      institution_id: args.institutionId,
      action: args.action,
      payload: args.payload ?? {},
      requested_by: user.id,
      reason: args.reason ?? null,
    } as never)
    .select("id")
    .single();
  if (error || !data) { toast.error(error?.message ?? "Failed"); return null; }
  await logSideEyeAction("sideeye_approval_request", args.contestId, {
    approval_id: (data as any).id, action: args.action,
  });
  toast.success("Approval request queued — second admin must approve");
  return { id: (data as any).id };
}
