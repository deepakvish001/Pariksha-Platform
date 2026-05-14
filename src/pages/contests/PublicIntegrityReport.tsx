import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Report {
  contest_id: string;
  total_participants: number;
  flagged_count: number;
  dq_count: number;
  viva_count: number;
  summary: Record<string, unknown>;
  is_published: boolean;
  published_at: string | null;
}

/**
 * Public Integrity Report — published per contest. Anyone (including
 * unauthenticated visitors) can view this page when admins flip the
 * published flag. Demonstrates what proctoring detected and acted on.
 */
export default function PublicIntegrityReport() {
  const { contestId } = useParams<{ contestId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [contestTitle, setContestTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contestId) return;
    (async () => {
      const [{ data }, { data: c }] = await Promise.all([
        supabase
          .from("contest_integrity_reports")
          .select("*")
          .eq("contest_id", contestId)
          .eq("is_published", true)
          .maybeSingle(),
        supabase.from("contests").select("title").eq("id", contestId).maybeSingle(),
      ]);
      setReport(data as Report | null);
      setContestTitle((c as { title?: string } | null)?.title ?? null);
      setLoading(false);
    })();
  }, [contestId]);

  const pageTitle = contestTitle
    ? `Integrity Report — ${contestTitle} | Parikshaa`
    : "Contest Integrity Report | Parikshaa";
  const pageDesc = contestTitle
    ? `Public integrity report for the ${contestTitle} contest on Parikshaa — proctoring signals, flagged attempts, and audit summary.`
    : "Public integrity report for a Parikshaa contest — proctoring signals, flagged attempts, and audit summary.";
  const canonical = `https://www.parikshaa.org/contests/${contestId}/integrity`;

  const sharedHead = (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="article" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
    </Helmet>
  );

  if (loading) return <Skeleton className="m-6 h-64" />;
  if (!report) return (
    <div className="mx-auto max-w-2xl p-6">
      {sharedHead}
      <Card className="p-6">
        <h1 className="text-xl font-bold">No public report</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The integrity report for this contest hasn't been published yet.
        </p>
      </Card>
    </div>
  );

  const { total_participants, flagged_count, dq_count, viva_count, summary, published_at } = report;
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {sharedHead}
      <header>
        <h1 className="text-3xl font-bold">Contest Integrity Report</h1>
        <p className="text-sm text-muted-foreground">
          Published {published_at ? new Date(published_at).toLocaleString() : "—"}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Participants" value={total_participants} />
        <Stat label="Flagged" value={flagged_count} tone="warn" />
        <Stat label="Disqualified" value={dq_count} tone="bad" />
        <Stat label="Viva taken" value={viva_count} />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Summary</h2>
        <pre className="mt-3 max-h-96 overflow-auto rounded bg-muted p-3 text-xs">
          {JSON.stringify(summary, null, 2)}
        </pre>
      </Card>

      <p className="text-xs text-muted-foreground">
        Generated automatically from proctoring signals: identity verification,
        room scan, presence analysis, screen audit, behavioral biometrics,
        code provenance, solve-time analysis, and cross-contest similarity.
      </p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" | "bad" }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone === "bad" ? "text-destructive" : tone === "warn" ? "text-amber-500" : ""}`}>
        {value}
      </div>
    </Card>
  );
}
