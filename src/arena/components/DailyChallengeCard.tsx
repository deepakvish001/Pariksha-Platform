import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Calendar, Flame, Trophy, Loader2, CheckCircle2 } from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { NeonButton } from "./NeonButton";
import { useDailyChallenge, useArenaStreak } from "../dailyLoop";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hero card on ArenaHome surfacing today's daily challenge + the player's
 * current Arena streak. Designed to be the first thing a returning student
 * sees so they can re-up their streak and earn bonus XP.
 */
export function DailyChallengeCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading } = useDailyChallenge();
  const streak = useArenaStreak(user?.id);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <GlassPanel
        glow={data?.solved ? "lime" : "magenta"}
        className="p-5 md:p-6 relative overflow-hidden"
        data-testid="daily-challenge-card"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,hsl(var(--primary)/0.18),transparent_55%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
              <Calendar className="h-3.5 w-3.5" /> Daily Challenge
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              {loading ? "" : data ? "Today's Battle Awaits" : "No challenge today"}
            </h2>
            {data && (
              <p className="text-xs text-muted-foreground">
                Solve to earn <span className="text-primary font-bold">+{data.bonus_xp} XP</span>
                {data.global_solves > 0 && (
                  <> · <span className="text-foreground">{data.global_solves}</span> students solved today</>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {streak && (
              <div
                className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5"
                data-testid="streak-pill"
              >
                <Flame className={`h-4 w-4 ${streak.current_streak > 0 ? "text-orange-400" : "text-muted-foreground"}`} />
                <span className="text-xs font-bold">{streak.current_streak} day{streak.current_streak === 1 ? "" : "s"}</span>
                <span className="text-[10px] text-muted-foreground uppercase">streak</span>
              </div>
            )}
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : data?.solved ? (
              <div className="flex items-center gap-2 text-lime-400 text-sm font-bold" data-testid="daily-solved">
                <CheckCircle2 className="h-5 w-5" /> Solved in {Math.floor((data.solve_time_sec ?? 0) / 60)}m
              </div>
            ) : data ? (
              <NeonButton tone="magenta" onClick={() => navigate(`/arena/daily`)} data-testid="play-daily">
                <Trophy className="mr-2 h-4 w-4" /> Play Daily
              </NeonButton>
            ) : null}
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}
