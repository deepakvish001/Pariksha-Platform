import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { CodeTimelineReplay } from "@/components/admin/contests/CodeTimelineReplay";
import { SessionSealPanel } from "@/components/admin/contests/SessionSealPanel";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Counts {
  proctor: number;
  screen: number;
  network: number;
  keystrokes: number;
  mouse: number;
  solve: number;
  cross: number;
}

const TABLES = [
  "contest_proctor_findings",
  "contest_screen_audits",
  "contest_network_audit",
  "contest_keystroke_samples",
  "contest_mouse_metrics",
  "contest_solve_time_analysis",
  "contest_cross_similarity",
] as const;

/**
 * Session Forensics — single-page view aggregating every proctoring
 * signal for one contest session. Includes a "Propose DQ" button
 * that opens the two-admin sign-off flow from Batch C.
 */
export default function AdminSessionForensics() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<Record<string, unknown[]>>({});

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      setLoading(true);
      const sess = await supabase.from("contest_sessions").select("*").eq("id", sessionId).maybeSingle();
      setSession(sess.data as Record<string, unknown> | null);

      const results: Record<string, unknown[]> = {};
      for (const t of TABLES) {
        const col = t === "contest_cross_similarity" ? "source_session_id" : "session_id";
        const { data } = await supabase.from(t as never).select("*").eq(col, sessionId).limit(200);
        results[t] = (data as unknown[]) ?? [];
      }
      setCounts({
        proctor: results.contest_proctor_findings.length,
        screen: results.contest_screen_audits.length,
        network: results.contest_network_audit.length,
        keystrokes: results.contest_keystroke_samples.length,
        mouse: results.contest_mouse_metrics.length,
        solve: results.contest_solve_time_analysis.length,
        cross: results.contest_cross_similarity.length,
      });
      setDetails(results);
      setLoading(false);
    })();
  }, [sessionId]);

  const proposeDQ = async () => {
    if (!sessionId || !session || !user) return;
    const reason = window.prompt("Reason for proposing disqualification:");
    if (!reason) return;
    const { error } = await supabase.from("contest_dq_signoffs").insert([{
      contest_id: session.contest_id as string,
      session_id: sessionId,
      user_id: session.user_id as string,
      proposed_by: user.id,
      proposed_reason: reason,
      evidence: { counts, snapshot_at: new Date().toISOString() } as never,
    }]);
    if (error) toast.error(error.message);
    else toast.success("DQ proposal submitted — awaiting second admin");
  };

  if (loading || !session) return <Skeleton className="m-6 h-96" />;

  return (
    <div className="space-y-6 p-6">
      <Helmet><title>Session Forensics · Admin</title></Helmet>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/contests" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-3 w-3" /> All contests
          </Link>
          <h1 className="text-2xl font-bold">Session Forensics</h1>
          <p className="font-mono text-xs text-muted-foreground">
            session {sessionId?.slice(0, 8)} · user {String(session.user_id).slice(0, 8)} · contest {String(session.contest_id).slice(0, 8)}
          </p>
        </div>
        <Button variant="destructive" onClick={proposeDQ}>Propose DQ</Button>
      </div>

      {counts && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <Stat label="Proctor" value={counts.proctor} />
          <Stat label="Screen" value={counts.screen} />
          <Stat label="Network" value={counts.network} />
          <Stat label="Keystrokes" value={counts.keystrokes} />
          <Stat label="Mouse" value={counts.mouse} />
          <Stat label="Solve" value={counts.solve} />
          <Stat label="Cross-sim" value={counts.cross} />
        </div>
      )}

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Code timeline</TabsTrigger>
          <TabsTrigger value="proctor">Proctor</TabsTrigger>
          <TabsTrigger value="screen">Screen</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="solve">Solve</TabsTrigger>
          <TabsTrigger value="cross">Cross-sim</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline" className="mt-4">
          <CodeTimelineReplay sessionId={sessionId!} />
        </TabsContent>
        <TabsContent value="proctor" className="mt-4">
          <RawList rows={details.contest_proctor_findings ?? []} />
        </TabsContent>
        <TabsContent value="screen" className="mt-4">
          <RawList rows={details.contest_screen_audits ?? []} />
        </TabsContent>
        <TabsContent value="network" className="mt-4">
          <RawList rows={details.contest_network_audit ?? []} />
        </TabsContent>
        <TabsContent value="solve" className="mt-4">
          <RawList rows={details.contest_solve_time_analysis ?? []} />
        </TabsContent>
        <TabsContent value="cross" className="mt-4">
          <RawList rows={details.contest_cross_similarity ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${value > 0 ? "text-destructive" : ""}`}>{value}</div>
    </Card>
  );
}

function RawList({ rows }: { rows: unknown[] }) {
  if (rows.length === 0) return <Card className="p-4 text-sm text-muted-foreground">No records.</Card>;
  return (
    <div className="space-y-2">
      {rows.slice(0, 50).map((r, i) => {
        const row = r as Record<string, unknown>;
        return (
          <Card key={(row.id as string) ?? i} className="p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {typeof row.severity === "string" && <Badge variant="destructive">{row.severity as string}</Badge>}
              {typeof row.event_type === "string" && <Badge variant="outline">{row.event_type as string}</Badge>}
              {typeof row.verdict === "string" && <Badge variant="secondary">{row.verdict as string}</Badge>}
              {typeof row.created_at === "string" && (
                <span className="text-muted-foreground">{new Date(row.created_at as string).toLocaleString()}</span>
              )}
            </div>
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-2 text-[11px]">
              {JSON.stringify(r, null, 2)}
            </pre>
          </Card>
        );
      })}
    </div>
  );
}
