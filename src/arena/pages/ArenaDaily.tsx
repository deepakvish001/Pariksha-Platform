import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { useDailyChallenge } from "../dailyLoop";
import { joinQueue, createCodeRoom } from "../hooks";
import { Loader2, Calendar, Users, Trophy, Hash } from "lucide-react";
import { toast } from "sonner";
import { DailyReminderCard } from "../components/DailyReminderCard";
import { DailyQuestProgress } from "../components/DailyQuestProgress";

/**
 * Daily challenge launcher.
 *
 * Two play paths:
 *   1. "Find an opponent" — drops the player into the matchmaking queue with
 *      the daily problem's difficulty. The completer flow on the BattleResult
 *      page calls arena_complete_daily_challenge with the solve time so XP
 *      is awarded server-side.
 *   2. "Solo practice" — creates a code room scoped to the daily problem and
 *      shares it as a solo run. Useful for players with no peer online.
 */
export default function ArenaDaily() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: challenge, loading } = useDailyChallenge();
  const [busy, setBusy] = useState<"queue" | "room" | null>(null);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  async function findOpponent() {
    if (!challenge) return;
    setBusy("queue");
    try {
      // Use the problem's difficulty (default medium) so the queue narrows
      // to compatible opponents.
      const battleId = await joinQueue(null, "medium");
      if (battleId) navigate(`/arena/battle/${battleId}`);
      else navigate("/arena/queue", { state: { topic: null, difficulty: "medium", daily: true } });
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  }

  async function shareRoom() {
    if (!challenge) return;
    setBusy("room");
    try {
      const { code } = await createCodeRoom({
        problemSlug: challenge.problem_slug,
        difficulty: "medium",
        duration: 1800,
      });
      navigate(`/arena/room/${code}`);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <GlassPanel glow="magenta" className="p-8 text-center space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.18),transparent_60%)]" />
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-widest text-primary">
            <Calendar className="h-3.5 w-3.5" /> Daily Challenge
          </div>
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          ) : challenge ? (
            <>
              <h1 className="text-3xl md:text-4xl font-black gradient-text">{challenge.problem_slug}</h1>
              <p className="text-sm text-muted-foreground">
                Solve today's curated battle to earn{" "}
                <span className="text-primary font-bold">+{challenge.bonus_xp} XP</span>
                {challenge.global_solves > 0 && (
                  <> · joined by <span className="text-foreground">{challenge.global_solves}</span> students</>
                )}
              </p>
              {challenge.solved && (
                <div className="inline-flex items-center gap-2 rounded-md bg-lime-500/10 border border-lime-500/30 px-3 py-1.5 text-sm text-lime-400">
                  <Trophy className="h-4 w-4" /> Already solved in{" "}
                  {Math.floor((challenge.solve_time_sec ?? 0) / 60)}m{" "}
                  {String((challenge.solve_time_sec ?? 0) % 60).padStart(2, "0")}s
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black">No challenge today</h1>
              <p className="text-sm text-muted-foreground">Check back at midnight UTC for a fresh problem.</p>
            </>
          )}
        </div>
      </GlassPanel>

      {challenge && !challenge.solved && (
        <div className="grid gap-3 md:grid-cols-2">
          <GlassPanel className="p-5 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Users className="h-4 w-4" /> Find an Opponent
            </h3>
            <p className="text-xs text-muted-foreground">Get matched with someone tackling today's problem.</p>
            <NeonButton className="w-full" onClick={findOpponent} disabled={!!busy}>
              {busy === "queue" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Quick Match"}
            </NeonButton>
          </GlassPanel>

          <GlassPanel className="p-5 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Hash className="h-4 w-4" /> Share a Room
            </h3>
            <p className="text-xs text-muted-foreground">Generate a code and challenge a friend to today's problem.</p>
            <NeonButton tone="lime" className="w-full" onClick={shareRoom} disabled={!!busy}>
              {busy === "room" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Room"}
            </NeonButton>
          </GlassPanel>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={() => navigate("/arena")}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to Arena
        </button>
      </div>
    </div>
  );
}
