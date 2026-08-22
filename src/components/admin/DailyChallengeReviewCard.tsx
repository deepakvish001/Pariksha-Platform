import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Loader2, Lock, RotateCcw, Trophy, Users } from "lucide-react";
import { toCSV, downloadCSV } from "@/lib/admin/csv";
import { useUserRole } from "@/hooks/useUserRole";
import { DailyChallengeUserDetailDrawer } from "./DailyChallengeUserDetailDrawer";

interface Claimer {
  challenge_date?: string;
  problem_slug?: string;
  user_id: string;
  display_name: string | null;
  solved: boolean;
  solve_time_sec: number | null;
  xp_awarded: number;
  attempted_at: string;
  solved_at: string | null;
  claimed?: boolean;
}

interface Challenge {
  id: string;
  challenge_date: string;
  problem_slug: string;
  bonus_xp: number;
}

type FilterMode = "all" | "attempted" | "solved" | "not_claimed";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Per-date review of the daily challenge: who attempted/solved + the seeded
 * problem + a rollback button (only safe when no solves exist yet).
 *
 * Also supports a date-range mode with attempted/solved/not-claimed filters
 * and CSV export for offline analysis.
 */
export function DailyChallengeReviewCard({ initialDate }: { initialDate?: string }) {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [date, setDate] = useState(initialDate ?? today());
  const [rangeMode, setRangeMode] = useState(false);
  const [from, setFrom] = useState(initialDate ?? today());
  const [to, setTo] = useState(initialDate ?? today());
  const [filter, setFilter] = useState<FilterMode>("all");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [claimers, setClaimers] = useState<Claimer[]>([]);
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [detail, setDetail] = useState<{ userId: string; date: string; name: string | null } | null>(null);

  async function loadSingle() {
    setLoading(true);
    try {
      const [{ data: chal }, { data: rows, error }] = await Promise.all([
        supabase
          .from("arena_daily_challenges")
          .select("id, challenge_date, problem_slug, bonus_xp")
          .eq("challenge_date", date)
          .maybeSingle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.rpc as any)("admin_daily_challenge_claimers", { _date: date }),
      ]);
      setChallenge((chal as Challenge | null) ?? null);
      if (error) throw error;
      setClaimers((rows as Claimer[]) ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadRange() {
    setLoading(true);
    setChallenge(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("admin_daily_challenge_claimers_range", {
        _from: from, _to: to,
      });
      if (error) throw error;
      setClaimers((data as Claimer[]) ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    if (rangeMode) loadRange();
    else loadSingle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, rangeMode, isAdmin]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "attempted": return claimers.filter((c) => !c.solved);
      case "solved": return claimers.filter((c) => c.solved);
      case "not_claimed": return claimers.filter((c) => c.solved && (c.xp_awarded ?? 0) === 0);
      default: return claimers;
    }
  }, [claimers, filter]);

  async function rollback() {
    if (!challenge) return;
    if (!confirm(`Roll back daily challenge for ${date}? Only allowed if nobody solved it yet.`)) return;
    setRolling(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("admin_rollback_daily_challenge", { _date: date });
      if (error) throw error;
      const res = data as { ok: boolean; reason?: string; solves?: number };
      if (!res.ok) {
        toast.error(`Cannot rollback — ${res.solves ?? 0} player(s) already solved it.`);
      } else {
        toast.success("Rolled back. Pick a new problem in the schedule grid.");
        await loadSingle();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRolling(false);
    }
  }

  function exportCSV() {
    if (!filtered.length) {
      toast.info("Nothing to export for the current filter.");
      return;
    }
    const rows = filtered.map((c) => ({
      challenge_date: c.challenge_date ?? date,
      problem_slug: c.problem_slug ?? challenge?.problem_slug ?? "",
      user_id: c.user_id,
      display_name: c.display_name ?? "",
      solved: c.solved,
      solve_time_sec: c.solve_time_sec ?? "",
      xp_awarded: c.xp_awarded ?? 0,
      claimed: c.claimed ?? (c.xp_awarded > 0),
      attempted_at: c.attempted_at,
      solved_at: c.solved_at ?? "",
    }));
    const tag = rangeMode ? `${from}_to_${to}` : date;
    downloadCSV(`daily-claimers-${tag}-${filter}.csv`, toCSV(rows));
    toast.success(`Exported ${rows.length} row${rows.length === 1 ? "" : "s"}`);
  }

  const solvedCount = claimers.filter((c) => c.solved).length;

  if (roleLoading) {
    return (
      <Card className="p-4 flex items-center gap-2 text-xs text-muted-foreground" data-testid="daily-review-card">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking access…
      </Card>
    );
  }
  if (!isAdmin) {
    return (
      <Card className="p-4 flex items-center gap-2 text-xs text-muted-foreground" data-testid="daily-review-card">
        <Lock className="h-4 w-4" /> Admin access required to view Daily Review filters and exports.
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3" data-testid="daily-review-card">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4" /> Daily Review
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={rangeMode ? "outline" : "secondary"}
            className="h-7 text-xs"
            onClick={() => setRangeMode(false)}
          >Day</Button>
          <Button
            size="sm"
            variant={rangeMode ? "secondary" : "outline"}
            className="h-7 text-xs"
            onClick={() => setRangeMode(true)}
            data-testid="review-range-toggle"
          >Range</Button>
        </div>
      </div>

      {rangeMode ? (
        <div className="flex items-end gap-2 flex-wrap" data-testid="review-range-form">
          <div>
            <label htmlFor="daily-challenge-review-from" className="text-[10px] uppercase text-muted-foreground">From</label>
            <Input id="daily-challenge-review-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <label htmlFor="daily-challenge-review-to" className="text-[10px] uppercase text-muted-foreground">To</label>
            <Input id="daily-challenge-review-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 text-xs" />
          </div>
          <Button size="sm" className="h-8" onClick={loadRange} data-testid="review-range-apply">Apply</Button>
        </div>
      ) : (
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-8 w-auto text-xs"
        />
      )}

      <div className="flex items-center gap-1 flex-wrap" role="tablist" aria-label="Filter claimers">
        {([
          ["all", "All"],
          ["attempted", "Attempted"],
          ["solved", "Solved"],
          ["not_claimed", "Not claimed"],
        ] as [FilterMode, string][]).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? "default" : "outline"}
            className="h-7 text-[11px]"
            onClick={() => setFilter(key)}
            data-testid={`review-filter-${key}`}
          >{label}</Button>
        ))}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px] ml-auto"
          onClick={exportCSV}
          data-testid="review-export-csv"
        >
          <Download className="h-3 w-3 mr-1" /> CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> 
        </div>
      ) : (
        <>
          {!rangeMode && challenge && (
            <>
              <div className="rounded-md border border-border/60 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Problem</span>
                  <span className="font-mono">{challenge.problem_slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bonus XP</span>
                  <span>+{challenge.bonus_xp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Claimers</span>
                  <span>{solvedCount} solved · {claimers.length} attempted</span>
                </div>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={rollback}
                disabled={rolling || solvedCount > 0}
                className="w-full"
                data-testid="review-rollback"
                title={solvedCount > 0 ? "Cannot rollback — players already solved it" : "Remove this day's daily so a new one can be assigned"}
              >
                {rolling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
                Roll back
              </Button>
            </>
          )}
          {!rangeMode && !challenge && (
            <p className="text-xs text-muted-foreground">No daily challenge published for {date}.</p>
          )}

          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Players ({filtered.length}{filtered.length !== claimers.length ? ` / ${claimers.length}` : ""})
            </div>
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground">No rows match the current filter.</p>
            ) : (
              filtered.map((c, i) => (
                <button
                  type="button"
                  key={`${c.user_id}-${c.challenge_date ?? date}-${i}`}
                  onClick={() => setDetail({ userId: c.user_id, date: c.challenge_date ?? date, name: c.display_name })}
                  className="w-full flex items-center justify-between rounded border border-border/40 px-2 py-1.5 text-xs text-left hover:bg-accent/50 transition-colors"
                  data-testid="review-row"
                >
                  <span className="truncate">
                    {rangeMode && (
                      <span className="font-mono text-muted-foreground mr-2">{(c.challenge_date ?? "").slice(5)}</span>
                    )}
                    {c.display_name ?? c.user_id.slice(0, 8)}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.solved ? (
                      <Badge variant="default" className="h-5 text-[10px]">+{c.xp_awarded} XP</Badge>
                    ) : (
                      <Badge variant="secondary" className="h-5 text-[10px]">Attempt</Badge>
                    )}
                    {c.solve_time_sec != null && (
                      <span className="font-mono text-muted-foreground">
                        {Math.floor(c.solve_time_sec / 60)}m{String(c.solve_time_sec % 60).padStart(2, "0")}s
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
      <DailyChallengeUserDetailDrawer
        open={!!detail}
        onOpenChange={(v) => !v && setDetail(null)}
        userId={detail?.userId ?? null}
        date={detail?.date ?? null}
        displayName={detail?.name}
      />
    </Card>
  );
}
