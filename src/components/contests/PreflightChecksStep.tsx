import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEnvironmentChecks, type ProbeStatus } from "@/hooks/useEnvironmentChecks";
import { toast } from "sonner";

interface Props {
  contestId: string;
  sessionId?: string | null;
  onPassed: () => void;
}

const ICONS: Record<ProbeStatus, typeof CheckCircle2> = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
};

const TONES: Record<ProbeStatus, string> = {
  pass: "text-emerald-300 border-emerald-500/30",
  warn: "text-amber-300 border-amber-500/30",
  fail: "text-red-300 border-red-500/40",
};

/**
 * Tier 4 pre-flight gate. Runs environment integrity checks and records
 * the verdict to `contest_preflight_checks`. Blocks proceed on `fail`,
 * lets the user continue (with a logged warning) on `warn`.
 */
export function PreflightChecksStep({ contestId, sessionId, onPassed }: Props) {
  const { report, running, rerun } = useEnvironmentChecks();
  const [submitting, setSubmitting] = useState(false);

  const overall = report?.status ?? "warn";
  const canProceed = overall !== "fail";

  const summary = useMemo(() => {
    if (!report) return "";
    const fails = report.probes.filter((p) => p.status === "fail").length;
    const warns = report.probes.filter((p) => p.status === "warn").length;
    if (fails) return `${fails} blocking issue${fails > 1 ? "s" : ""} found.`;
    if (warns) return `${warns} warning${warns > 1 ? "s" : ""} — you can continue.`;
    return "All environment checks passed.";
  }, [report]);

  const handleProceed = async () => {
    if (!report) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("contest_record_preflight" as never, {
      _contest_id: contestId,
      _session_id: sessionId ?? null,
      _status: report.status,
      _details: { probes: report.probes, screen: { w: window.screen.width, h: window.screen.height } },
      _user_agent: navigator.userAgent,
    } as never);
    setSubmitting(false);
    if (error) {
      toast.error("Failed to record pre-flight check", { description: error.message });
      return;
    }
    if (report.status === "warn") {
      toast.warning("Pre-flight passed with warnings", { description: "Admins have been notified." });
    } else {
      toast.success("Pre-flight passed");
    }
    onPassed();
  };

  return (
    <Card className="space-y-4 border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Pre-flight: environment integrity</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        We're checking your machine, browser, and camera setup before the secure session starts.
        Anything blocking must be fixed before you can continue.
      </p>

      <div className="space-y-2">
        {running && !report && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Running checks…
          </div>
        )}
        {report?.probes.map((p) => {
          const Icon = ICONS[p.status];
          return (
            <div
              key={p.id}
              className={`flex items-start justify-between gap-3 rounded border p-2.5 text-sm ${TONES[p.status]}`}
            >
              <div className="flex min-w-0 items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{p.label}</div>
                  {p.detail && (
                    <div className="truncate text-xs text-muted-foreground">{p.detail}</div>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={TONES[p.status]}>
                {p.status.toUpperCase()}
              </Badge>
            </div>
          );
        })}
      </div>

      {report?.status === "fail" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Cannot start secure session</AlertTitle>
          <AlertDescription>
            Resolve the blocking issues above (close VMs / remote desktop, disconnect extra monitors,
            disable virtual cameras, switch to a Chromium-based browser), then re-run the check.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">{summary}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={rerun} disabled={running}>
            <RefreshCw className={`mr-1 h-3 w-3 ${running ? "animate-spin" : ""}`} />
            Re-run
          </Button>
          <Button size="sm" onClick={handleProceed} disabled={!canProceed || submitting || !report}>
            {submitting ? "Saving…" : overall === "warn" ? "Continue with warnings" : "Continue"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
