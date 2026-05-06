import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Loader2, Hash } from "lucide-react";

interface ChainStatus {
  ok: boolean;
  total: number;
  broken: Array<{ seq: number; expected: string; actual: string }>;
  generated_at?: string;
}

/**
 * Public verification page — anyone (recruiters, HoD, parents) can view the
 * tamper-evident integrity report for a session by URL alone, no login.
 * Reads only from columns that are publicly safe (no signed media URLs here).
 */
export default function PublicVerifyReport() {
  const { reportId } = useParams<{ reportId: string }>();
  const [status, setStatus] = useState<ChainStatus | null>(null);
  const [meta, setMeta] = useState<{
    contest_title: string | null;
    institution: string | null;
    created_at: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("contest-sideeye-verify-chain", {
          body: { report_id: reportId, public: true },
        });
        if (cancelled) return;
        if (error) throw error;
        const r = data as any;
        setStatus({
          ok: !!r.ok,
          total: r.total ?? 0,
          broken: r.broken ?? [],
          generated_at: r.generated_at,
        });
        setMeta({
          contest_title: r.contest_title ?? null,
          institution: r.institution_name ?? null,
          created_at: r.created_at ?? null,
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Verification failed");
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reportId]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Verify Integrity Report — Second Eye</title>
        <meta name="description" content="Tamper-evident verification of a Second Eye proctored session." />
      </Helmet>

      <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Public Integrity Verification
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Report ID <code className="text-xs">{reportId}</code>
          </p>
        </header>

        {loading ? (
          <Card><CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </CardContent></Card>
        ) : err ? (
          <Card><CardContent className="p-6 text-sm text-destructive">{err}</CardContent></Card>
        ) : status ? (
          <Card className={status.ok ? "border-emerald-500/40" : "border-destructive/40"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {status.ok ? (
                  <><ShieldCheck className="h-5 w-5 text-emerald-500" /> Chain intact</>
                ) : (
                  <><ShieldAlert className="h-5 w-5 text-destructive" /> Chain broken</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border/60 p-2">
                  <div className="text-xs text-muted-foreground">Total entries</div>
                  <div className="font-semibold">{status.total}</div>
                </div>
                <div className="rounded-lg border border-border/60 p-2">
                  <div className="text-xs text-muted-foreground">Broken links</div>
                  <div className="font-semibold">{status.broken.length}</div>
                </div>
              </div>

              {meta?.contest_title && (
                <div className="text-sm">
                  <div><span className="text-muted-foreground">Contest:</span> {meta.contest_title}</div>
                  {meta.institution && <div><span className="text-muted-foreground">Institution:</span> {meta.institution}</div>}
                  {meta.created_at && (
                    <div><span className="text-muted-foreground">Generated:</span> {new Date(meta.created_at).toLocaleString()}</div>
                  )}
                </div>
              )}

              {!status.ok && status.broken.length > 0 && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-2">
                  <div className="font-medium flex items-center gap-1">
                    <Hash className="h-4 w-4" /> Broken links
                  </div>
                  <ul className="text-xs space-y-1 max-h-48 overflow-y-auto">
                    {status.broken.slice(0, 20).map((b) => (
                      <li key={b.seq} className="font-mono break-all">
                        #{b.seq}: expected <span className="text-emerald-500">{b.expected.slice(0, 16)}…</span>{" "}
                        got <span className="text-destructive">{b.actual.slice(0, 16)}…</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Badge variant={status.ok ? "default" : "destructive"} className="w-full justify-center py-2">
                {status.ok ? "Tamper-evident chain VERIFIED" : "EVIDENCE TAMPERING DETECTED"}
              </Badge>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
