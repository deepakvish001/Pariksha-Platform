import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AuditRow {
  id: string;
  created_at: string;
  event_type: string;
  severity: string;
  detail: any;
  reviewed_at: string | null;
  reviewer_id: string | null;
  reviewer_note: string | null;
}

const SEVERITIES = ["info", "low", "medium", "high", "critical"];

/**
 * Bulk-review UI for SideEye audit logs.
 * Admin selects rows, optionally hides reviewed, adds a shared note,
 * and marks them all reviewed (stamps reviewed_at, reviewer_id, reviewer_note).
 */
export const SideEyeAuditBulkReview = ({ sessionId }: { sessionId: string }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [hideReviewed, setHideReviewed] = useState(true);
  const [sevFilter, setSevFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("contest_side_camera_audit_logs")
      .select("id,created_at,event_type,severity,detail,reviewed_at,reviewer_id,reviewer_note")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data as AuditRow[]) ?? []);
    setSelected(new Set());
  };

  useEffect(() => { load(); }, [sessionId]);

  const visible = (rows ?? []).filter((r) => {
    if (hideReviewed && r.reviewed_at) return false;
    if (sevFilter !== "all" && r.severity !== sevFilter) return false;
    return true;
  });

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === visible.length) setSelected(new Set());
    else setSelected(new Set(visible.map((r) => r.id)));
  };

  const markReviewed = async () => {
    if (selected.size === 0 || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("contest_side_camera_audit_logs")
        .update({
          reviewed_at: new Date().toISOString(),
          reviewer_id: user.id,
          reviewer_note: note.trim() || null,
        })
        .in("id", Array.from(selected));
      if (error) throw error;
      toast.success(`Marked ${selected.size} event(s) as reviewed`);
      setNote("");
      await load();
    } catch (e: any) {
      toast.error("Failed to mark reviewed", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" /> Audit log review
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5">
            <Checkbox checked={hideReviewed} onCheckedChange={(v) => setHideReviewed(!!v)} />
            <span>Hide reviewed</span>
          </label>
          <Select value={sevFilter} onValueChange={setSevFilter}>
            <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All severities</SelectItem>
              {SEVERITIES.map((s) => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-border/40 rounded max-h-72 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/40 backdrop-blur">
            <tr>
              <th className="p-2 w-8">
                <Checkbox
                  checked={visible.length > 0 && selected.size === visible.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="p-2 text-left">Time</th>
              <th className="p-2 text-left">Event</th>
              <th className="p-2 text-left">Sev</th>
              <th className="p-2 text-left">Reviewed</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="border-t border-border/30 hover:bg-muted/20">
                <td className="p-2">
                  <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} />
                </td>
                <td className="p-2 font-mono text-muted-foreground whitespace-nowrap">
                  {format(new Date(r.created_at), "HH:mm:ss")}
                </td>
                <td className="p-2">{r.event_type}</td>
                <td className="p-2"><Badge variant="outline" className="text-[10px]">{r.severity}</Badge></td>
                <td className="p-2 text-[10px] text-muted-foreground">
                  {r.reviewed_at ? (
                    <span title={r.reviewer_note ?? ""}>
                      ✓ {format(new Date(r.reviewed_at), "MMM d HH:mm")}
                    </span>
                  ) : "—"}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No events to review.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-[11px] text-muted-foreground">Reviewer note (optional)</label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. False positive — reflective glare on screen."
            className="text-xs min-h-[60px]"
          />
        </div>
        <Button size="sm" onClick={markReviewed} disabled={saving || selected.size === 0}>
          {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
          Mark {selected.size} reviewed
        </Button>
      </div>
    </Card>
  );
};

export default SideEyeAuditBulkReview;
