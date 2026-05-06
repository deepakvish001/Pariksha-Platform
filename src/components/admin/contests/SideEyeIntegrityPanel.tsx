import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldCheck, ShieldAlert, Loader2, FileJson, FileDown, Package } from "lucide-react";
import { toast } from "sonner";
import { logSideEyeAction } from "./lib/adminAuditLog";

interface VerifyResult {
  ok: boolean;
  links: number;
  intact: boolean;
  verified_at: string;
  breaks: Array<{ seq: number; reason: string; expected?: string; got?: string }>;
}

/**
 * Admin panel: re-walk the SHA-256 evidence chain on demand,
 * download verified report as JSON, or render a plain-text PDF summary.
 */
export const SideEyeIntegrityPanel = ({ sessionId }: { sessionId: string }) => {
  const [busy, setBusy] = useState<"verify" | "json" | "pdf" | "pack" | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [confirm, setConfirm] = useState<null | "verify" | "json" | "pdf" | "pack">(null);

  const downloadEvidencePack = async () => {
    setBusy("pack");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contest-sideeye-evidence-pack`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
        },
        body: JSON.stringify({ sessionId }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `sideeye-evidence-${sessionId}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(a.href);
      await logSideEyeAction("sideeye_evidence_pack", sessionId, { format: "zip" });
      toast.success("Evidence pack downloaded");
    } catch (e: any) {
      toast.error("Evidence pack failed", { description: e?.message });
    } finally {
      setBusy(null);
    }
  };

  const callEdge = async <T,>(fn: string): Promise<T> => {
    const { data: { session } } = await supabase.auth.getSession();
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
      },
      body: JSON.stringify({ sessionId }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return (await resp.json()) as T;
  };

  const verify = async () => {
    setBusy("verify");
    try {
      const r = await callEdge<VerifyResult>("contest-sideeye-verify-chain");
      setResult(r);
      await logSideEyeAction("sideeye_verify_chain", sessionId, {
        intact: r.intact, links: r.links, breaks: r.breaks.length,
      });
      if (r.intact) toast.success(`Chain intact — ${r.links} link(s) verified`);
      else toast.error(`Chain broken: ${r.breaks.length} issue(s)`);
    } catch (e: any) {
      toast.error("Verification failed", { description: e?.message });
    } finally {
      setBusy(null);
    }
  };

  const downloadJson = async () => {
    setBusy("json");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contest-sideeye-report`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
        },
        body: JSON.stringify({ sessionId }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `sideeye-integrity-${sessionId}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      await logSideEyeAction("sideeye_export_json", sessionId, { format: "json" });
      toast.success("JSON report downloaded");
    } catch (e: any) {
      toast.error("JSON download failed", { description: e?.message });
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = async () => {
    setBusy("pdf");
    try {
      // Fetch latest report JSON
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contest-sideeye-report`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
        },
        body: JSON.stringify({ sessionId }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const report = await resp.json();

      // Render a simple printable page → user prints to PDF.
      // Avoids bundling jsPDF; relies on built-in print dialog.
      const win = window.open("", "_blank");
      if (!win) throw new Error("Popup blocked — allow popups to export PDF");
      const s = report.summary ?? {};
      const breaks = (s.evidence_chain_breaks ?? []) as any[];
      const html = `
<!doctype html><html><head><meta charset="utf-8"><title>SideEye Integrity Report</title>
<style>
body { font-family: -apple-system, system-ui, sans-serif; padding: 32px; max-width: 800px; margin: auto; color: #111; }
h1 { margin: 0 0 4px 0; } h2 { margin-top: 28px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
.tag { display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; }
.ok { background:#dcfce7; color:#166534; } .bad { background:#fee2e2; color:#991b1b; }
table { border-collapse: collapse; width: 100%; margin-top: 8px; font-size: 12px; }
th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
th { background: #f5f5f5; } code { font-family: ui-monospace, monospace; font-size: 11px; }
.kv { display:grid; grid-template-columns:200px 1fr; gap:4px 16px; font-size:13px; }
.kv div:nth-child(odd){ color:#666; }
@media print { button { display:none } }
</style></head><body>
<button onclick="window.print()" style="float:right;padding:8px 16px;">Print / Save as PDF</button>
<h1>SideEye Integrity Report</h1>
<p style="color:#666;margin:0 0 16px">Generated ${new Date(report.generated_at).toLocaleString()}</p>
<p>Evidence chain:
  <span class="tag ${s.evidence_chain_intact ? "ok" : "bad"}">
    ${s.evidence_chain_intact ? "INTACT" : "BROKEN"}
  </span>
  ${s.evidence_chain_links ?? 0} link(s)
</p>
<h2>Session</h2>
<div class="kv">
  <div>Session ID</div><div><code>${report.session?.id ?? "—"}</code></div>
  <div>User ID</div><div><code>${report.session?.user_id ?? "—"}</code></div>
  <div>Status</div><div>${report.session?.side_camera_status ?? "—"}</div>
  <div>Started</div><div>${report.session?.started_at ?? "—"}</div>
  <div>Ended</div><div>${report.session?.ended_at ?? "—"}</div>
</div>
<h2>Summary</h2>
<div class="kv">
  <div>Frames analyzed</div><div>${s.frames_total ?? 0}</div>
  <div>Recordings</div><div>${s.recordings_total ?? 0} (${s.recording_bytes ?? 0} bytes)</div>
  <div>Pairings</div><div>${s.pairings_total ?? 0}</div>
  <div>Pauses</div><div>${s.pauses_total ?? 0}</div>
  <div>Findings</div><div>${s.findings_total ?? 0}</div>
</div>
<h2>Severity breakdown</h2>
<table><tr>${Object.keys(s.severity_breakdown ?? {}).map(k => `<th>${k}</th>`).join("")}</tr>
<tr>${Object.values(s.severity_breakdown ?? {}).map(v => `<td>${v}</td>`).join("")}</tr></table>
<h2>Anomaly kinds</h2>
<table><tr>${Object.keys(s.flag_kind_breakdown ?? {}).map(k => `<th>${k}</th>`).join("") || "<th>None</th>"}</tr>
<tr>${Object.values(s.flag_kind_breakdown ?? {}).map(v => `<td>${v}</td>`).join("") || "<td>—</td>"}</tr></table>
<h2>Chain breaks</h2>
${breaks.length === 0 ? "<p><span class='tag ok'>No breaks detected</span></p>" : `
<table><tr><th>Seq</th><th>Reason</th><th>Expected</th><th>Got</th></tr>
${breaks.map(b => `<tr><td>${b.seq}</td><td>${b.reason}</td><td><code>${(b.expected ?? "").slice(0,16)}…</code></td><td><code>${(b.got ?? "").slice(0,16)}…</code></td></tr>`).join("")}
</table>`}
</body></html>`;
      win.document.write(html);
      win.document.close();
      await logSideEyeAction("sideeye_export_pdf", sessionId, { format: "pdf" });
      toast.success("Use the print dialog to save as PDF");
    } catch (e: any) {
      toast.error("PDF export failed", { description: e?.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {result?.intact ? (
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          ) : result && !result.intact ? (
            <ShieldAlert className="h-4 w-4 text-destructive" />
          ) : (
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          )}
          <h3 className="text-sm font-semibold">Integrity report</h3>
          {result && (
            <Badge variant="outline" className={result.intact ? "border-emerald-500/40 text-emerald-300" : "border-red-500/40 text-red-300"}>
              {result.intact ? "Chain intact" : `${result.breaks.length} break(s)`}
            </Badge>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setConfirm("verify")} disabled={busy !== null}>
            {busy === "verify" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ShieldCheck className="mr-1 h-3 w-3" />}
            Verify chain
          </Button>
          <Button size="sm" variant="outline" onClick={() => setConfirm("json")} disabled={busy !== null}>
            {busy === "json" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <FileJson className="mr-1 h-3 w-3" />}
            JSON
          </Button>
          <Button size="sm" variant="outline" onClick={() => setConfirm("pdf")} disabled={busy !== null}>
            {busy === "pdf" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <FileDown className="mr-1 h-3 w-3" />}
            PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => setConfirm("pack")} disabled={busy !== null} title="ZIP: audit CSV, chain, findings, 7-day signed evidence URLs">
            {busy === "pack" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Package className="mr-1 h-3 w-3" />}
            Evidence pack
          </Button>
        </div>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "verify" && "Re-verify evidence chain?"}
              {confirm === "json" && "Download integrity report as JSON?"}
              {confirm === "pdf" && "Generate PDF integrity report?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will be logged in the admin audit log against this session.
              {confirm === "verify" && " The chain walk re-hashes every evidence link and may take a moment."}
              {confirm === "pdf" && " A new browser tab will open — allow popups."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const c = confirm;
                setConfirm(null);
                if (c === "verify") verify();
                else if (c === "json") downloadJson();
                else if (c === "pdf") downloadPdf();
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {result && (
        <div className="text-xs space-y-1.5">
          <div className="text-muted-foreground">
            Verified {new Date(result.verified_at).toLocaleString()} · {result.links} link(s)
          </div>
          {result.breaks.length > 0 && (
            <div className="border border-destructive/40 rounded p-2 bg-destructive/5 max-h-40 overflow-auto">
              <div className="font-semibold text-destructive mb-1">Broken links</div>
              <ul className="space-y-1 font-mono text-[10px]">
                {result.breaks.map((b, i) => (
                  <li key={i}>
                    seq #{b.seq} — {b.reason}
                    {b.expected && b.got && (
                      <span className="text-muted-foreground"> · expected <code>{b.expected.slice(0, 12)}…</code> got <code>{b.got.slice(0, 12)}…</code></span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default SideEyeIntegrityPanel;
