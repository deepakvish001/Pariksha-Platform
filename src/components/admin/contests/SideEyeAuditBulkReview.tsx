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
import { CheckCircle2, Loader2, Download, FileText, FileJson, FileDown, FileArchive, ThumbsDown } from "lucide-react";
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
  const [hideLowConfidence, setHideLowConfidence] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("sideeye:hideLowConfidence") !== "0";
  });
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

  /**
   * Mark a row as a false positive — feeds the reviewer feedback loop that
   * tunes thresholds and lowers the unified risk score.
   */
  const markFalsePositive = async (row: AuditRow) => {
    if (!user) return;
    setRowSavingId(row.id);
    try {
      const note = (rowNotes[row.id] ?? "").trim() || null;
      const kind =
        (row.detail as any)?.summary?.anomaly_kind ??
        (row.detail as any)?.anomaly_kind ??
        row.event_type ?? null;
      const { error: fbErr } = await supabase
        .from("sideeye_review_feedback" as never)
        .upsert(
          {
            audit_log_id: row.id,
            session_id: sessionId,
            reviewer_id: user.id,
            verdict: "false_positive",
            finding_kind: kind,
            reason: note,
            is_false_positive: true,
            note,
            finding_type: kind,
          } as never,
          { onConflict: "audit_log_id,reviewer_id" } as never,
        );
      if (fbErr) throw fbErr;
      await supabase
        .from("contest_side_camera_audit_logs")
        .update({
          reviewed_at: new Date().toISOString(),
          reviewer_id: user.id,
          reviewer_note: note ? `[FP] ${note}` : "[FP]",
        })
        .eq("id", row.id);
      await logSideEyeAction("sideeye_audit_row_false_positive", sessionId, {
        audit_id: row.id, kind, note,
      });
      toast.success("Marked as false positive");
      setRowNotes((s) => { const n = { ...s }; delete n[row.id]; return n; });
      await load();
    } catch (e: any) {
      toast.error("Failed to mark false positive", { description: e?.message });
    } finally {
      setRowSavingId(null);
    }
  };

  const [exportProgress, setExportProgress] = useState<{ fetched: number; total: number; phase: string; format: string } | null>(null);

  /**
   * Pipe a Blob through the browser's built-in gzip CompressionStream.
   * Falls back to the original blob if the API is unavailable (very old browsers).
   */
  const gzipBlob = async (blob: Blob): Promise<Blob> => {
    if (typeof (globalThis as any).CompressionStream === "undefined") return blob;
    const cs = new (globalThis as any).CompressionStream("gzip");
    const stream = blob.stream().pipeThrough(cs);
    return await new Response(stream).blob();
  };

  /**
   * Stream all matching rows in fixed-size pages so we can export far beyond
   * the previous 5000-row cap without slamming the API. Yields each batch via
   * `onBatch` so callers can build CSV/JSON/PDF incrementally.
   */
  const streamAllMatching = async (
    format: string,
    onBatch: (batch: AuditRow[]) => void,
    pageSize = 1000,
  ): Promise<number> => {
    let countQ = supabase
      .from("contest_side_camera_audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);
    if (hideReviewed) countQ = countQ.is("reviewed_at", null);
    if (sevFilter !== "all") countQ = countQ.eq("severity", sevFilter);
    const { count } = await countQ;
    const grandTotal = count ?? 0;
    setExportProgress({ fetched: 0, total: grandTotal, phase: "Fetching rows", format });
    let fetched = 0;
    for (let from = 0; from < grandTotal; from += pageSize) {
      const to = Math.min(from + pageSize - 1, grandTotal - 1);
      let q = supabase
        .from("contest_side_camera_audit_logs")
        .select("id,created_at,event_type,severity,detail,reviewed_at,reviewer_id,reviewer_note")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (hideReviewed) q = q.is("reviewed_at", null);
      if (sevFilter !== "all") q = q.eq("severity", sevFilter);
      const { data, error } = await q;
      if (error) throw error;
      const batch = (data as AuditRow[]) ?? [];
      onBatch(batch);
      fetched += batch.length;
      setExportProgress({ fetched, total: grandTotal, phase: "Writing rows", format });
      if (batch.length === 0) break;
      // Yield to UI thread so progress bar updates between batches
      await new Promise((r) => setTimeout(r, 0));
    }
    return fetched;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const csvHeader = ["id","created_at","event_type","severity","detail","reviewed_at","reviewer_id","reviewer_note"];
  const csvEsc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const exportCsv = async () => {
    try {
      const chunks: string[] = [csvHeader.join(",")];
      const fetched = await streamAllMatching("CSV", (batch) => {
        for (const r of batch) chunks.push(csvHeader.map((h) => csvEsc((r as any)[h])).join(","));
      });
      setExportProgress((p) => p && { ...p, phase: "Building file" });
      const blob = new Blob([chunks.join("\n")], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, `sideeye-audit-${sessionId}-${Date.now()}.csv`);
      await logSideEyeAction("sideeye_audit_export_csv", sessionId, {
        count: fetched, filters: { hideReviewed, severity: sevFilter },
      });
      toast.success(`Exported ${fetched} row(s) as CSV`);
    } catch (e: any) {
      toast.error("CSV export failed", { description: e?.message });
    } finally {
      setExportProgress(null);
    }
  };

  const exportJson = async (compress = false) => {
    try {
      const parts: BlobPart[] = [];
      const exportedAt = new Date().toISOString();
      parts.push(
        `{\n  "session_id": ${JSON.stringify(sessionId)},\n` +
        `  "exported_at": ${JSON.stringify(exportedAt)},\n` +
        `  "filters": ${JSON.stringify({ hideReviewed, severity: sevFilter })},\n` +
        `  "rows": [`,
      );
      let wrote = 0;
      const fetched = await streamAllMatching(compress ? "JSON.gz" : "JSON", (batch) => {
        if (batch.length === 0) return;
        let chunk = "";
        for (const r of batch) {
          chunk += (wrote === 0 ? "\n    " : ",\n    ") + JSON.stringify(r);
          wrote++;
        }
        parts.push(chunk);
      });
      parts.push(`\n  ],\n  "count": ${fetched}\n}\n`);
      setExportProgress((p) => p && { ...p, phase: compress ? "Compressing (gzip)" : "Building file" });
      let blob = new Blob(parts, { type: "application/json" });
      let ext = "json";
      let mime = "application/json";
      if (compress) {
        blob = await gzipBlob(blob);
        // Re-wrap with gzip mime so the browser doesn't auto-decompress on save
        blob = new Blob([blob], { type: "application/gzip" });
        ext = "json.gz";
        mime = "application/gzip";
      }
      downloadBlob(blob, `sideeye-audit-${sessionId}-${Date.now()}.${ext}`);
      await logSideEyeAction(compress ? "sideeye_audit_export_json_gz" : "sideeye_audit_export_json", sessionId, {
        count: fetched, bytes: blob.size, filters: { hideReviewed, severity: sevFilter },
      });
      toast.success(`Exported ${fetched} row(s) as ${compress ? "gzipped JSON" : "JSON"} (${(blob.size / 1024).toFixed(1)} KB)`);
    } catch (e: any) {
      toast.error("JSON export failed", { description: e?.message });
    } finally {
      setExportProgress(null);
    }
  };

  const exportPdf = async () => {
    try {
      const all: AuditRow[] = [];
      const fetched = await streamAllMatching("PDF", (batch) => { all.push(...batch); });
      setExportProgress((p) => p && { ...p, phase: "Rendering PDF" });
      const win = window.open("", "_blank");
      if (!win) throw new Error("Popup blocked — allow popups to export PDF");
      const esc = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]!));
      const rowsHtml = all.map((r) => `<tr>
        <td>${esc(format(new Date(r.created_at), "yyyy-MM-dd HH:mm:ss"))}</td>
        <td>${esc(r.event_type)}</td>
        <td>${esc(r.severity)}</td>
        <td>${r.reviewed_at ? esc(format(new Date(r.reviewed_at), "yyyy-MM-dd HH:mm")) : "—"}</td>
        <td>${esc(r.reviewer_note ?? "")}</td>
      </tr>`).join("");
      win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>SideEye Audit Log</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}h1{margin:0 0 8px}table{border-collapse:collapse;width:100%;font-size:11px;margin-top:12px}th,td{border:1px solid #ddd;padding:4px 6px;text-align:left;vertical-align:top}th{background:#f5f5f5}@media print{button{display:none}}</style>
</head><body>
<button onclick="window.print()" style="float:right;padding:8px 16px">Print / Save as PDF</button>
<h1>SideEye Audit Log</h1>
<p style="color:#666">Session <code>${esc(sessionId)}</code> · ${fetched} row(s) · filters: severity=${esc(sevFilter)}, hideReviewed=${hideReviewed}</p>
<table><thead><tr><th>Time</th><th>Event</th><th>Sev</th><th>Reviewed</th><th>Reviewer note</th></tr></thead><tbody>${rowsHtml}</tbody></table>
</body></html>`);
      win.document.close();
      await logSideEyeAction("sideeye_audit_export_pdf", sessionId, {
        count: fetched, filters: { hideReviewed, severity: sevFilter },
      });
      toast.success(`Prepared PDF for ${fetched} row(s)`);
    } catch (e: any) {
      toast.error("PDF export failed", { description: e?.message });
    } finally {
      setExportProgress(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const visibleRows = hideLowConfidence
    ? rows.filter((r) => {
        const c = (r.detail as any)?.summary?.confidence ?? (r.detail as any)?.confidence;
        return c !== "low";
      })
    : rows;

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
          <label className="flex items-center gap-1.5" title="Hide AI findings flagged as low confidence (e.g. matches the candidate's calibrated baseline)">
            <Checkbox
              checked={hideLowConfidence}
              onCheckedChange={(v) => {
                const b = !!v;
                setHideLowConfidence(b);
                try { localStorage.setItem("sideeye:hideLowConfidence", b ? "1" : "0"); } catch {}
              }}
            />
            <span>Hide low-confidence</span>
          </label>
          <Select value={sevFilter} onValueChange={setSevFilter}>
            <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All severities</SelectItem>
              {SEVERITIES.map((s) => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="h-7" onClick={exportCsv} disabled={!!exportProgress}>
            <Download className="mr-1 h-3 w-3" /> CSV
          </Button>
          <Button size="sm" variant="outline" className="h-7" onClick={() => exportJson(false)} disabled={!!exportProgress}>
            <FileJson className="mr-1 h-3 w-3" /> JSON
          </Button>
          <Button size="sm" variant="outline" className="h-7" onClick={() => exportJson(true)} disabled={!!exportProgress} title="Gzip-compressed JSON">
            <FileArchive className="mr-1 h-3 w-3" /> JSON.gz
          </Button>
          <Button size="sm" variant="outline" className="h-7" onClick={exportPdf} disabled={!!exportProgress}>
            <FileDown className="mr-1 h-3 w-3" /> PDF
          </Button>
        </div>
      </div>

      {exportProgress && (
        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="font-medium text-foreground">{exportProgress.format}</span>
          <span>· {exportProgress.phase}: {exportProgress.fetched.toLocaleString()} / {exportProgress.total.toLocaleString()} row(s)</span>
          <div className="flex-1 h-1 bg-muted rounded overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${exportProgress.total ? (exportProgress.fetched / exportProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="border border-border/40 rounded max-h-[420px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/40 backdrop-blur z-10">
            <tr>
              <th className="p-2 w-8">
                <Checkbox
                  checked={visibleRows.length > 0 && visibleRows.every((r) => selected.has(r.id))}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
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
            {visibleRows.map((r) => (
              <tr key={r.id} className="border-t border-border/30 hover:bg-muted/20">
                <td className="p-2">
                  <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} aria-label="Select row" />
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-amber-600 hover:text-amber-600"
                        disabled={rowSavingId === r.id}
                        onClick={() => markFalsePositive(r)}
                        title="Records a reviewer false-positive vote, lowering the unified risk score and tuning future thresholds."
                      >
                        <ThumbsDown className="mr-1 h-3 w-3" />
                        Mark false positive
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
