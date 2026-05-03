import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Battle, BattleSubmission } from "../types";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { motion } from "framer-motion";
import { Trophy, Skull, Equal, AlertTriangle, Loader2, RefreshCw, Flame, Sparkles } from "lucide-react";
import { createCodeRoom } from "../hooks";
import { tickArenaStreak, completeDailyChallenge, useDailyChallenge } from "../dailyLoop";

export default function BattleResult() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [subs, setSubs] = useState<BattleSubmission[]>([]);
  const [rematchState, setRematchState] = useState<"idle" | "loading" | "error">("idle");
  const [rematchError, setRematchError] = useState<string | null>(null);
  const [streakInfo, setStreakInfo] = useState<{ current: number; used_freeze: boolean } | null>(null);
  const [dailyXp, setDailyXp] = useState<number | null>(null);
  const { data: dailyChallenge } = useDailyChallenge();

  async function handleRematch() {
    if (!battle) return;
    setRematchState("loading");
    setRematchError(null);
    try {
      const { invite_id, code } = await createCodeRoom({
        problemSlug: battle.problem_slug,
        difficulty: battle.difficulty,
        duration: battle.duration_sec,
      });
      navigate(`/arena/room/${code}`, { state: { inviteId: invite_id } });
    } catch (e) {
      setRematchError((e as Error).message || "Couldn't create rematch room");
      setRematchState("error");
    }
  }

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: b } = await supabase.from("battles" as never).select("*").eq("id", id).maybeSingle();
      const { data: s } = await supabase.from("battle_submissions" as never).select("*").eq("battle_id", id).order("created_at");
      const battleRow = b as Battle | null;
      setBattle(battleRow);
      setSubs((s as BattleSubmission[]) ?? []);

      if (!battleRow || !user?.id) return;

      // Tick the player's daily Arena streak (idempotent per day)
      try {
        const tick = await tickArenaStreak();
        setStreakInfo({ current: tick.current, used_freeze: tick.used_freeze });
      } catch {
        /* non-blocking */
      }

      // If the battle's problem is today's daily challenge AND the player won
      // (winner) or solved it (any accepted submission), award the bonus XP.
      const todaySlug = dailyChallenge?.problem_slug;
      const playerSolved = (s as BattleSubmission[] | null ?? []).some(
        (sub) => sub.user_id === user.id && sub.verdict === "accepted",
      );
      if (todaySlug && battleRow.problem_slug === todaySlug && playerSolved && !dailyChallenge?.solved) {
        const startedAt = battleRow.started_at ? new Date(battleRow.started_at).getTime() : Date.now();
        const endedAt = battleRow.ended_at ? new Date(battleRow.ended_at).getTime() : Date.now();
        const elapsed = Math.max(1, Math.round((endedAt - startedAt) / 1000));
        try {
          const res = await completeDailyChallenge(battleRow.id, elapsed);
          if (res.ok && res.xp) setDailyXp(res.xp);
        } catch {
          /* non-blocking */
        }
      }
    })();
  }, [id, user?.id, dailyChallenge?.problem_slug, dailyChallenge?.solved]);

  if (!battle) return null;

  const isPlayerA = battle.player_a === user?.id;
  const won = battle.winner_id === user?.id;
  const draw = !battle.winner_id;
  const myDelta = isPlayerA
    ? (battle.elo_a_after ?? 0) - (battle.elo_a_before ?? 0)
    : (battle.elo_b_after ?? 0) - (battle.elo_b_before ?? 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
        <GlassPanel glow={won ? "lime" : draw ? "cyan" : "magenta"} className="p-10 text-center">
          {won ? (
            <Trophy className="h-20 w-20 mx-auto text-lime-400" style={{ filter: "drop-shadow(0 0 20px rgba(132,204,22,0.7))" }} />
          ) : draw ? (
            <Equal className="h-20 w-20 mx-auto text-primary" />
          ) : (
            <Skull className="h-20 w-20 mx-auto text-accent-foreground" />
          )}
          <h1 className="mt-4 text-5xl font-black">
            {won ? "VICTORY" : draw ? "DRAW" : "DEFEAT"}
          </h1>
          {!draw && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className={`mt-3 text-2xl font-mono font-bold ${myDelta > 0 ? "text-lime-400" : "text-red-400"}`}
            >
              {myDelta > 0 ? "+" : ""}{myDelta} Elo
            </motion.div>
          )}
          <p className="mt-2 text-sm text-muted-foreground">{battle.end_reason}</p>
        </GlassPanel>
      </motion.div>

      {(streakInfo || dailyXp) && (
        <div className="grid gap-3 md:grid-cols-2" data-testid="rewards-row">
          {streakInfo && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <GlassPanel glow={streakInfo.current >= 3 ? "lime" : "cyan"} className="p-4 text-center">
                <Flame className="h-7 w-7 mx-auto text-orange-400" />
                <p className="mt-1 text-2xl font-black">{streakInfo.current} day{streakInfo.current === 1 ? "" : "s"}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Arena Streak</p>
                {streakInfo.used_freeze && (
                  <p className="mt-1 text-[10px] text-primary">Freeze used to save your streak</p>
                )}
              </GlassPanel>
            </motion.div>
          )}
          {dailyXp && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <GlassPanel glow="magenta" className="p-4 text-center" data-testid="daily-xp-banner">
                <Sparkles className="h-7 w-7 mx-auto text-primary" />
                <p className="mt-1 text-2xl font-black text-primary">+{dailyXp} XP</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Daily Challenge Bonus</p>
              </GlassPanel>
            </motion.div>
          )}
        </div>
      )}

      <GlassPanel className="p-4">
        <h3 className="text-xs uppercase tracking-wider text-primary/80 mb-2">Submissions ({subs.length})</h3>
        <ul className="space-y-2 text-sm">
          {subs.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded border border-border bg-card/40 p-2">
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${s.verdict === "accepted" ? "bg-lime-500/20 text-lime-300" : "bg-red-500/20 text-red-300"}`}>{s.verdict}</span>
              <span className="text-xs text-muted-foreground">{s.passed}/{s.total} · {s.language}</span>
              <span className={`ml-auto text-xs ${s.user_id === user?.id ? "text-primary" : "text-accent-foreground"}`}>
                {s.user_id === user?.id ? "You" : "Opponent"}
              </span>
            </li>
          ))}
          {subs.length === 0 && <li className="text-xs text-muted-foreground/60">No submissions recorded.</li>}
        </ul>
      </GlassPanel>

      <div className="flex flex-wrap gap-3 justify-center" data-testid="rematch-actions">
        <NeonButton onClick={handleRematch} disabled={rematchState === "loading"}>
          {rematchState === "loading" ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating…</span>
          ) : rematchState === "error" ? (
            <span className="inline-flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Retry Rematch</span>
          ) : "Rematch"}
        </NeonButton>
        <NeonButton onClick={() => navigate("/arena")}>Back to Arena</NeonButton>
        <Link to="/arena/leaderboard"><NeonButton>Leaderboard</NeonButton></Link>
      </div>

      {rematchState === "error" && (
        <GlassPanel glow="magenta" className="p-4 text-center" data-testid="rematch-error">
          <div className="flex flex-col items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm font-bold text-destructive">Rematch failed</p>
            <p className="text-xs text-muted-foreground break-words max-w-md">{rematchError}</p>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}

