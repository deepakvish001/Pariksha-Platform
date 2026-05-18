import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Loader2, Lock, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface VerifyResult {
  valid: boolean;
  hmac_valid: boolean;
  stored_root: string;
  expected_root: string;
  sealed_at: string;
  drift: Record<string, { stored: unknown; current: unknown }>;
}

/**
 * Admin-side Layer 6 panel: shows current seal status for a session and
 * lets admins manually seal (if the session has ended but the trigger
 * didn't fire) or re-verify integrity at any time.
 */
export function SessionSealPanel({ sessionId }: { sessionId: string }) {
  const [hasSeal, setHasSeal] = useState<boolean | null>(null);
  const [sealedAt, setSealedAt] = useState<string | null>(null);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [busy, setBusy] = useState<"verify" | "seal" | null>(null);

  const refresh = async () => {
    const { data } = await supabase
      .from("contest_session_seals")
      .select("sealed_at")
      .eq("session_id", sessionId)
      .maybeSingle();
    setHasSeal(!!data);
    setSealedAt(data?.sealed_at ?? null);
  };

  useEffect(() => { void refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [sessionId]);

  const runVerify = async () => {
    setBusy("verify");
    try {
      const { data, error } = await supabase.functions.invoke("contest-session-seal", {
        body: { mode: "verify", sessionId },
      });
      if (error) throw error;
      setVerify(data as VerifyResult);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setBusy(null);
    }
  };

  const runSeal = async () => {
    setBusy("seal");
    try {
      const { data, error } = await supabase.functions.invoke("contest-session-seal", {
        body: { mode: "seal", sessionId },
      });
      if (error) throw error;
      const r = data as { sealed?: boolean; alreadySealed?: boolean; error?: string };
      if (r.error) toast.error(r.error);
      else if (r.sealed) toast.success("Session sealed");
      else if (r.alreadySealed) toast.info("Already sealed");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Seal failed");
    } finally {
      setBusy(null);
    }
  };

  const driftKeys = verify ? Object.keys(verify.drift ?? {}) : [];
  const intact = verify?.valid && verify?.hmac_valid && driftKeys.length === 0;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-semibold">Forensic seal</div>
            <div className="text-xs text-muted-foreground">
              {hasSeal === null
                ? "Checking…"
                : hasSeal
                  ? `Sealed ${sealedAt ? new Date(sealedAt).toLocaleString() : ""}`
                  : "Not yet sealed"}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={runVerify} disabled={busy !== null || hasSeal === false}>
            {busy === "verify" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
            Verify integrity
          </Button>
          {hasSeal === false && (
            <Button size="sm" onClick={runSeal} disabled={busy !== null}>
              {busy === "seal" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              Seal now
            </Button>
          )}
          {hasSeal && (
            <Button asChild size="sm" variant="ghost">
              <Link to={`/verify-seal/${sessionId}`} target="_blank" rel="noopener noreferrer">
                Public page <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {verify && (
        <div className="mt-4 space-y-3 border-t pt-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {intact ? (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold text-emerald-500">Seal intact</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4 text-destructive" />
                <span className="font-semibold text-destructive">Tampering detected</span>
              </>
            )}
            <Badge variant={verify.valid ? "default" : "destructive"}>
              root {verify.valid ? "match" : "mismatch"}
            </Badge>
            <Badge variant={verify.hmac_valid ? "default" : "destructive"}>
              hmac {verify.hmac_valid ? "valid" : "invalid"}
            </Badge>
            <Badge variant={driftKeys.length === 0 ? "default" : "destructive"}>
              drift {driftKeys.length}
            </Badge>
          </div>
          {driftKeys.length > 0 && (
            <div className="space-y-2">
              {driftKeys.map((k) => (
                <div key={k} className="rounded-md border border-destructive/40 p-2 text-xs">
                  <div className="mb-1 font-semibold">{k}</div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <pre className="overflow-auto rounded bg-muted p-2">
{JSON.stringify(verify.drift[k].stored, null, 2)}
                    </pre>
                    <pre className="overflow-auto rounded bg-muted p-2">
{JSON.stringify(verify.drift[k].current, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="font-mono text-[10px] text-muted-foreground break-all">
            root: {verify.stored_root}
          </div>
        </div>
      )}
    </Card>
  );
}
