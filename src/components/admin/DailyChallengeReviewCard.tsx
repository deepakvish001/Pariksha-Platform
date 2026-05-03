import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, RotateCcw, Trophy, Users } from "lucide-react";

interface Claimer {
  user_id: string;
  display_name: string | null;
  solved: boolean;
  solve_time_sec: number | null;
  xp_awarded: number;
  attempted_at: string;
  solved_at: string | null;
}

interface Challenge {
  id: string;
  challenge_date: string;
  problem_slug: string;
  bonus_xp: number;
}

/**
 * Per-date review of the daily challenge: who attempted/solved + the seeded
 * problem + a rollback button (only safe when no solves exist yet).
 */
export function DailyChallengeReviewCard({ initialDate }: { initialDate?: string }) {
  const [date, setDate] = useState(initialDate ?? new Date().toISOString().slice(0, 10));
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [claimers, setClaimers] = useState<Claimer[]>([]);
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState(false);

  async function load() {
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

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [date]);

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
        await load();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRolling(false);
    }
  }

  const solvedCount = claimers.filter((c) => c.solved).length;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4" /> Daily Review
        </h2>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-8 w-auto text-xs"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : challenge ? (
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
              <span>
                {solvedCount} solved · {claimers.length} attempted
              </span>
            </div>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={rollback}
            disabled={rolling || solvedCount > 0}
            className="w-full"
            title={solvedCount > 0 ? "Cannot rollback — players already solved it" : "Remove this day's daily so a new one can be assigned"}
          >
            {rolling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
            Roll back
          </Button>

          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Players ({claimers.length})
            </div>
            {claimers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No attempts yet.</p>
            ) : (
              claimers.map((c) => (
                <div key={c.user_id} className="flex items-center justify-between rounded border border-border/40 px-2 py-1.5 text-xs">
                  <span className="truncate">{c.display_name ?? c.user_id.slice(0, 8)}</span>
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
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">No daily challenge published for {date}.</p>
      )}
    </Card>
  );
}
