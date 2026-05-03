import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AuditRow {
  id: string;
  actor_id: string;
  actor_name: string | null;
  challenge_date: string;
  inspected_user_id: string;
  inspected_user_name: string | null;
  seeded_problem_slug: string | null;
  attempt_count: number | null;
  submission_count: number | null;
  created_at: string;
}

const PAGE = 25;

export function DailyReviewAuditCard() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [done, setDone] = useState(false);

  async function load(reset = false) {
    setLoading(true);
    try {
      const nextOffset = reset ? 0 : offset;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("admin_get_daily_review_audit", {
        _limit: PAGE, _offset: nextOffset,
      });
      if (error) throw error;
      const fetched = (data as AuditRow[]) ?? [];
      setRows(reset ? fetched : [...rows, ...fetched]);
      setOffset(nextOffset + fetched.length);
      setDone(fetched.length < PAGE);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(true); /* eslint-disable-next-line */ }, []);

  return (
    <Card className="p-4 space-y-3" data-testid="daily-review-audit-card">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Eye className="h-4 w-4" /> Daily Review Access Log
        </h2>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => load(true)} disabled={loading}>
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </div>

      {rows.length === 0 && !loading ? (
        <p className="text-xs text-muted-foreground">No daily review accesses recorded yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {rows.map((r) => (
            <div key={r.id} className="rounded border border-border/40 px-2 py-1.5 text-xs space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium truncate">
                  {r.actor_name ?? r.actor_id.slice(0, 8)}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-muted-foreground">
                inspected{" "}
                <span className="font-medium text-foreground">
                  {r.inspected_user_name ?? r.inspected_user_id.slice(0, 8)}
                </span>{" "}
                · <span className="font-mono">{r.challenge_date}</span>
                {r.seeded_problem_slug && <> · seeded <span className="font-mono">{r.seeded_problem_slug}</span></>}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {r.attempt_count ?? 0} attempts · {r.submission_count ?? 0} submissions
              </div>
            </div>
          ))}
        </div>
      )}

      {!done && (
        <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => load(false)} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Load more
        </Button>
      )}
    </Card>
  );
}
