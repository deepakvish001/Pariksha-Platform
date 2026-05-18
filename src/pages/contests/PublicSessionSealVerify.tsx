import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Loader2, Hash, Fingerprint } from "lucide-react";

interface SealVerify {
  ok: boolean;
  valid: boolean;
  hmac_valid: boolean;
  stored_root: string;
  expected_root: string;
  sealed_at: string;
  drift: Record<string, { stored: unknown; current: unknown }>;
}

/**
 * Public Layer-6 forensic seal verifier — anyone with a session id can confirm
 * the integrity of a sealed contest session without logging in.
 */
export default function PublicSessionSealVerify() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [result, setResult] = useState<SealVerify | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("contest-session-seal", {
          body: { mode: "verify", sessionId },
        });
        if (cancelled) return;
        if (error) throw error;
        setResult(data as SealVerify);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Verification failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  const driftKeys = result ? Object.keys(result.drift ?? {}) : [];
  const intact = result?.valid && result?.hmac_valid && driftKeys.length === 0;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <Helmet>
        <title>Session Integrity Verification</title>
        <meta name="description" content="Tamper-evident verification of a sealed contest session." />
      </Helmet>
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Session Integrity Verification</h1>
          <p className="text-sm text-muted-foreground">
            Recomputes the forensic seal and compares against the value locked at session end.
          </p>
        </header>

        {loading && (
          <Card>
            <CardContent className="flex items-center gap-3 py-10">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm text-muted-foreground">Verifying seal…</span>
            </CardContent>
          </Card>
        )}

        {err && !loading && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-5 w-5" /> Verification error
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{err}</CardContent>
          </Card>
        )}

        {!loading && result && (
          <>
            <Card className={intact ? "border-emerald-500/50" : "border-destructive/50"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {intact ? (
                    <>
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      <span className="text-emerald-500">Seal intact</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-5 w-5 text-destructive" />
                      <span className="text-destructive">Tampering detected</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sealed at</span>
                  <span>{new Date(result.sealed_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Root hash match</span>
                  <Badge variant={result.valid ? "default" : "destructive"}>
                    {result.valid ? "match" : "mismatch"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">HMAC signature</span>
                  <Badge variant={result.hmac_valid ? "default" : "destructive"}>
                    {result.hmac_valid ? "valid" : "invalid"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Component drift</span>
                  <Badge variant={driftKeys.length === 0 ? "default" : "destructive"}>
                    {driftKeys.length === 0 ? "none" : `${driftKeys.length} field(s)`}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Hash className="h-4 w-4" /> Root hash
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 font-mono text-xs break-all">
                <div>
                  <div className="text-muted-foreground">Stored</div>
                  <div>{result.stored_root}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Recomputed</div>
                  <div>{result.expected_root}</div>
                </div>
              </CardContent>
            </Card>

            {driftKeys.length > 0 && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-destructive">
                    <Fingerprint className="h-4 w-4" /> Drift detected
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {driftKeys.map((k) => (
                    <div key={k} className="rounded-md border border-border/50 p-3">
                      <div className="mb-1 font-semibold">{k}</div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <pre className="overflow-auto rounded bg-muted p-2">
{JSON.stringify(result.drift[k].stored, null, 2)}
                        </pre>
                        <pre className="overflow-auto rounded bg-muted p-2">
{JSON.stringify(result.drift[k].current, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
