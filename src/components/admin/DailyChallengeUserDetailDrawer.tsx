import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Attempt {
  id: string;
  battle_id: string | null;
  solved: boolean;
  solve_time_sec: number | null;
  xp_awarded: number;
  attempted_at: string;
  solved_at: string | null;
}

interface Submission {
  id: string;
  battle_id: string;
  problem_slug: string;
  verdict: string;
  passed: number;
  total: number;
  language: string;
  runtime_ms: number | null;
  created_at: string;
  matches_seeded: boolean;
}

interface Detail {
  user_id: string;
  challenge_date: string;
  seeded_problem_slug: string | null;
  bonus_xp: number | null;
  attempts: Attempt[];
  submissions: Submission[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string | null;
  date: string | null;
  displayName?: string | null;
}

/**
 * Admin-only drilldown: shows a single user's attempts and submissions for a
 * given daily-challenge date with server-validated `matches_seeded` status.
 */
export function DailyChallengeUserDetailDrawer({ open, onOpenChange, userId, date, displayName }: Props) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    if (!open || !userId || !date) return;
    setLoading(true);
    setDetail(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.rpc as any)("admin_daily_challenge_user_detail", { _user_id: userId, _date: date })
      .then(({ data, error }: { data: Detail | null; error: { message: string } | null }) => {
        if (error) { toast.error(error.message); return; }
        setDetail(data);
      })
      .finally(() => setLoading(false));
  }, [open, userId, date]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto" data-testid="daily-user-detail-drawer">
        <SheetHeader>
          <SheetTitle>Daily Review · {displayName ?? userId?.slice(0, 8)}</SheetTitle>
          <SheetDescription>
            {date} · Seeded:{" "}
            <span className="font-mono">{detail?.seeded_problem_slug ?? "—"}</span>
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : !detail ? (
          <p className="p-4 text-sm text-muted-foreground">No data.</p>
        ) : (
          <div className="space-y-4 mt-4">
            <section>
              <h3 className="text-xs uppercase text-muted-foreground mb-2">Attempts ({detail.attempts.length})</h3>
              {detail.attempts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No attempts logged.</p>
              ) : (
                <ul className="space-y-1.5">
                  {detail.attempts.map((a) => (
                    <li key={a.id} className="rounded border border-border/40 p-2 text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono">{new Date(a.attempted_at).toLocaleString()}</span>
                        {a.solved ? (
                          <Badge variant="default" className="h-5 text-[10px]">+{a.xp_awarded} XP</Badge>
                        ) : (
                          <Badge variant="secondary" className="h-5 text-[10px]">Attempt</Badge>
                        )}
                      </div>
                      {a.solve_time_sec != null && (
                        <div className="text-muted-foreground">
                          Solve time: {Math.floor(a.solve_time_sec / 60)}m{String(a.solve_time_sec % 60).padStart(2, "0")}s
                        </div>
                      )}
                      {a.battle_id && <div className="text-muted-foreground font-mono truncate">battle: {a.battle_id}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="text-xs uppercase text-muted-foreground mb-2">
                Submissions ({detail.submissions.length})
              </h3>
              {detail.submissions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No code submissions on this date.</p>
              ) : (
                <ul className="space-y-1.5">
                  {detail.submissions.map((s) => (
                    <li key={s.id} className="rounded border border-border/40 p-2 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono truncate" title={s.problem_slug}>{s.problem_slug}</span>
                        <Badge variant={s.verdict === "AC" ? "default" : "destructive"} className="h-5 text-[10px]">
                          {s.verdict}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>{s.language} · {s.passed}/{s.total} {s.runtime_ms != null && `· ${s.runtime_ms}ms`}</span>
                        {s.matches_seeded ? (
                          <span className="inline-flex items-center gap-1 text-emerald-500">
                            <CheckCircle2 className="h-3 w-3" /> matches seeded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-500">
                            <AlertTriangle className="h-3 w-3" /> mismatch
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        {new Date(s.created_at).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {detail.submissions.length > 0 && detail.submissions.every((s) => !s.matches_seeded) && (
              <div className="flex items-start gap-2 rounded border border-destructive/40 bg-destructive/10 p-2 text-xs">
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <span>None of this user's submissions match today's seeded problem. XP should not have been credited.</span>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
