import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, Shield } from "lucide-react";
import { useMyInstitutions } from "@/lib/sideeye/institutions";

interface LiveContest {
  id: string;
  title: string;
  institution_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  active_sessions: number;
  pending_alerts: number;
}

/**
 * Multi-contest SideEye console — aggregates every active contest the
 * current admin can supervise across institutions, with severity counts.
 */
export default function AdminSideEyeConsole() {
  const { data: memberships, loading } = useMyInstitutions();
  const [rows, setRows] = useState<LiveContest[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!memberships || memberships.length === 0) { setRows([]); return; }
    (async () => {
      const instIds = memberships.map((m) => m.institution_id);
      const nowIso = new Date().toISOString();
      const { data: contests } = await supabase
        .from("contests" as never)
        .select("id, title, institution_id, starts_at, ends_at" as never)
        .in("institution_id", instIds)
        .lte("starts_at", nowIso)
        .gte("ends_at", nowIso)
        .order("starts_at", { ascending: false })
        .limit(50);
      if (cancelled || !contests) return;

      const enriched = await Promise.all(
        (contests as any[]).map(async (c) => {
          const [{ count: sessions }, { count: alerts }] = await Promise.all([
            supabase.from("contest_sessions" as never)
              .select("id", { count: "exact", head: true } as never)
              .eq("contest_id", c.id)
              .is("submitted_at", null),
            supabase.from("contest_side_camera_audit_logs" as never)
              .select("id", { count: "exact", head: true } as never)
              .eq("contest_id", c.id)
              .gte("created_at", new Date(Date.now() - 30 * 60_000).toISOString()),
          ]);
          return {
            id: c.id, title: c.title,
            institution_id: c.institution_id,
            starts_at: c.starts_at, ends_at: c.ends_at,
            active_sessions: sessions ?? 0,
            pending_alerts: alerts ?? 0,
          } as LiveContest;
        }),
      );
      if (cancelled) return;
      setRows(enriched);
    })();
    return () => { cancelled = true; };
  }, [memberships]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <Helmet><title>Second Eye Console — Live Proctoring</title></Helmet>

      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            Second Eye Console
          </h1>
          <p className="text-sm text-muted-foreground">
            Every live contest you can supervise, in one place.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" />
          {memberships?.length ?? 0} institution{(memberships?.length ?? 0) === 1 ? "" : "s"}
        </Badge>
      </header>

      {loading || rows === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No live contests right now.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((r) => {
            const sev = r.pending_alerts >= 10 ? "high" : r.pending_alerts >= 3 ? "med" : "low";
            return (
              <Card key={r.id} className="border-border/60 backdrop-blur bg-card/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-start justify-between gap-2">
                    <span className="line-clamp-2">{r.title}</span>
                    <span
                      className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                        sev === "high" ? "bg-red-500" : sev === "med" ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      aria-label={`Severity ${sev}`}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-border/60 p-2">
                      <div className="text-xs text-muted-foreground">Live sessions</div>
                      <div className="font-semibold">{r.active_sessions}</div>
                    </div>
                    <div className="rounded-lg border border-border/60 p-2">
                      <div className="text-xs text-muted-foreground">Alerts (30m)</div>
                      <div className="font-semibold">{r.pending_alerts}</div>
                    </div>
                  </div>
                  <Button asChild size="sm" className="w-full">
                    <Link to={`/admin/contests/${r.id}/proctor`}>
                      Open proctor
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
