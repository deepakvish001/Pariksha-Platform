import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Circle, Flame, History, Loader2, Trophy } from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { useDailyHistory } from "../dailyLoop";
import { useArenaStreak } from "../dailyLoop";
import { useAuth } from "@/contexts/AuthContext";

function fmtDate(d: string) {
  const dt = new Date(d + "T00:00:00Z");
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtTime(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = String(sec % 60).padStart(2, "0");
  return `${m}m ${s}s`;
}

/**
 * Daily challenge history surfaced on ArenaHome. Shows current/longest streak,
 * total completed days, and a row per day for the past 30 days with the XP
 * earned. Helps players visualise consistency and re-engage on missed days.
 */
export function DailyHistoryPanel() {
  const { user } = useAuth();
  const streak = useArenaStreak(user?.id);
  const { history, loading, loadingMore, hasMore, loadMore } = useDailyHistory(30);

  const completed = history.filter((h) => h.solved).length;
  const totalXp = history.reduce((acc, h) => acc + (h.xp_awarded || 0), 0);

  return (
    <GlassPanel className="p-5 space-y-4" data-testid="daily-history-panel">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
          <History className="h-4 w-4" /> Daily Challenge History
        </h3>
        <span className="text-[10px] text-muted-foreground uppercase">last 30 days</span>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-card/40 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-orange-400">
            <Flame className="h-4 w-4" />
            <span className="text-lg font-black">{streak?.current_streak ?? 0}</span>
          </div>
          <div className="text-[10px] uppercase text-muted-foreground">Current streak</div>
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-lime-400">
            <Trophy className="h-4 w-4" />
            <span className="text-lg font-black">{completed}</span>
          </div>
          <div className="text-[10px] uppercase text-muted-foreground">Days completed</div>
        </div>
        <div className="rounded-lg border border-border bg-card/40 p-3 text-center">
          <div className="text-lg font-black text-primary">+{totalXp}</div>
          <div className="text-[10px] uppercase text-muted-foreground">XP earned</div>
        </div>
      </div>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
      ) : history.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          No daily challenges yet. Today is a great day to start!
        </p>
      ) : (
        <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {history.map((h, i) => (
            <motion.li
              key={h.challenge_date}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i, 10) * 0.02 }}
              className="flex items-center gap-3 rounded-md border border-border/60 bg-card/30 px-3 py-2"
              data-testid={`history-row-${h.challenge_date}`}
            >
              {h.solved ? (
                <CheckCircle2 className="h-4 w-4 text-lime-400 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono">{fmtDate(h.challenge_date)}</span>
                  <span className="truncate text-muted-foreground">
                    {h.problem_title ?? h.problem_slug}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] font-mono">{fmtTime(h.solve_time_sec)}</div>
                {h.xp_awarded > 0 && (
                  <div className="text-[10px] text-primary">+{h.xp_awarded} XP</div>
                )}
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}
