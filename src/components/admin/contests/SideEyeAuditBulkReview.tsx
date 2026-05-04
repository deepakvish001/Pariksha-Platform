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
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { CheckCircle2, Loader2, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { logSideEyeAction } from "./lib/adminAuditLog";

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
const PAGE_SIZE = 50;

/**
 * Bulk + row-level review UI for SideEye audit logs.
 * Supports per-row reviewer notes via popover, paginated loading,
 * CSV export of the filtered set, and shared bulk note review.
 */
export const SideEyeAuditBulkReview = ({ sessionId }: { sessionId: string }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkNote, setBulkNote] = useState("");
  const [hideReviewed, setHideReviewed] = useState(true);
  const [sevFilter, setSevFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rowSavingId, setRowSavingId] = useState<string | null>(null);
  const [rowNotes, setRowNotes] = useState<Record<string, string>>({});

  const load = async (resetPage = false) => {
    setLoading(true);
    const nextPage = resetPage ? 0 : page;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase
      .from("contest_side_camera_audit_logs")
      .select("id,created_at,event_type,severity,detail,reviewed_at,reviewer_id,reviewer_note", { count: "exact" })
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (hideReviewed) q = q.is("reviewed_at", null);
    if (sevFilter !== "all") q = q.eq("severity", sevFilter);
    const { data, count } = await q;
    setRows((data as AuditRow[]) ?? []);
    setTotal(count ?? 0);
    setSelected(new Set());
    if (resetPage) setPage(0);
    setLoading(false);
  };

  useEffect(() => { load(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [sessionId, hideReviewed, sevFilter]);
  useEffect(() => { load(false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page]);

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  const markBulk = async () => {
    if (selected.size === 0 || !user) return;
    setSaving(true);
    try {
      const ids = Array.from(selected);
      const { error } = await supabase
        .from("contest_side_camera_audit_logs")
        .update({
          reviewed_at: new Date().toISOString(),
          reviewer_id: user.id,
          reviewer_note: bulkNote.trim() || null,
        })
        .in("id", ids);
      if (error) throw error;
      await logSideEyeAction("sideeye_audit_bulk_review", sessionId, {
        count: ids.length, note: bulkNote.trim() || null,
      });
      toast.success(`Marked ${ids.length} event(s) as reviewed`);
      setBulkNote("");
      await load();
    } catch (e: any) {
      toast.error("Failed to mark reviewed", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const markRow = async (row: AuditRow, mode: "review" | "edit" = "review") => {
    if (!user) return;
    setRowSavingId(row.id);
    try {
      const note = (rowNotes[row.id] ?? "").trim() || null;
      const update: Record<string, unknown> = { reviewer_note: note };
      // Only stamp reviewer/timestamp on first review; edits preserve original review time
      // but record the editor as the new reviewer_id for accountability.
      if (mode === "review") {
        update.reviewed_at = new Date().toISOString();
      }
      update.reviewer_id = user.id;
      const { error } = await supabase
        .from("contest_side_camera_audit_logs")
        .update(update)
        .eq("id", row.id);
      if (error) throw error;
      await logSideEyeAction(
        mode === "review" ? "sideeye_audit_row_review" : "sideeye_audit_row_note_edit",
        sessionId,
        {
          audit_id: row.id,
          note,
          previous_note: row.reviewer_note ?? null,
        },
      );
      toast.success(mode === "review" ? "Row marked reviewed" : "Reviewer note updated");
      setRowNotes((s) => { const n = { ...s }; delete n[row.id]; return n; });
      await load();
    } catch (e: any) {
      toast.error("Row update failed", { description: e?.message });
    } finally {
      setRowSavingId(null);
    }
  };

  const exportCsv = async () => {
    try {
      // Pull *all* matching rows (cap 5000) so CSV reflects the active filter.
      let q = supabase
        .from("contest_side_camera_audit_logs")
        .select("id,created_at,event_type,severity,detail,reviewed_at,reviewer_id,reviewer_note")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (hideReviewed) q = q.is("reviewed_at", null);
      if (sevFilter !== "all") q = q.eq("severity", sevFilter);
      const { data, error } = await q;
      if (error) throw error;
      const all = (data as AuditRow[]) ?? [];
      const esc = (v: unknown) => {
        const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      };
      const header = ["id","created_at","event_type","severity","detail","reviewed_at","reviewer_id","reviewer_note"];
      const csv = [
        header.join(","),
        ...all.map((r) => header.map((h) => esc((r as any)[h])).join(",")),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `sideeye-audit-${sessionId}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      await logSideEyeAction("sideeye_audit_export_csv", sessionId, {
        count: all.length, filters: { hideReviewed, severity: sevFilter },
      });
      toast.success(`Exported ${all.length} row(s)`);
    } catch (e: any) {
      toast.error("CSV export failed", { description: e?.message });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" /> Audit log review
          <Badge variant="outline" className="text-[10px]">{total} total</Badge>
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
          <Button size="sm" variant="outline" className="h-7" onClick={exportCsv}>
            <Download className="mr-1 h-3 w-3" /> CSV
          </Button>
        </div>
      </div>

      <div className="border border-border/40 rounded max-h-[420px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/40 backdrop-blur z-10">
            <tr>
              <th className="p-2 w-8">
                <Checkbox
                  checked={rows.length > 0 && selected.size === rows.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="p-2 text-left">Time</th>
              <th className="p-2 text-left">Event</th>
              <th className="p-2 text-left">Sev</th>
              <th className="p-2 text-left">Reviewed</th>
              <th className="p-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
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
                      {r.reviewer_note && <span className="ml-1 italic">— {r.reviewer_note.slice(0, 24)}{r.reviewer_note.length > 24 ? "…" : ""}</span>}
                    </span>
                  ) : "—"}
                </td>
                <td className="p-2 text-right">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]">
                        <FileText className="mr-1 h-3 w-3" />
                        {r.reviewed_at ? "Edit note" : "Review"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 space-y-2">
                      <div className="text-xs font-semibold">
                        {r.reviewed_at ? "Edit reviewer note" : "Reviewer note for this event"}
                      </div>
                      <Textarea
                        value={rowNotes[r.id] ?? r.reviewer_note ?? ""}
                        onChange={(e) => setRowNotes((s) => ({ ...s, [r.id]: e.target.value }))}
                        placeholder="Optional context…"
                        className="text-xs min-h-[60px]"
                      />
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={rowSavingId === r.id}
                        onClick={() => markRow(r, r.reviewed_at ? "edit" : "review")}
                      >
                        {rowSavingId === r.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {r.reviewed_at ? "Save note" : "Mark reviewed"}
                      </Button>
                    </PopoverContent>
                  </Popover>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No events to review.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">
                <Loader2 className="inline h-4 w-4 animate-spin" />
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="text-muted-foreground">
          Page {page + 1} of {totalPages} · showing {rows.length} of {total}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" disabled={page === 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Previous
          </Button>
          <Button size="sm" variant="outline" disabled={page + 1 >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      <div className="flex items-end gap-2 border-t border-border/40 pt-3">
        <div className="flex-1">
          <label className="text-[11px] text-muted-foreground">Bulk reviewer note (applies to selected)</label>
          <Textarea
            value={bulkNote}
            onChange={(e) => setBulkNote(e.target.value)}
            placeholder="e.g. False positive — reflective glare on screen."
            className="text-xs min-h-[60px]"
          />
        </div>
        <Button size="sm" onClick={markBulk} disabled={saving || selected.size === 0}>
          {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
          Mark {selected.size} reviewed
        </Button>
      </div>
    </Card>
  );
};

export default SideEyeAuditBulkReview;
