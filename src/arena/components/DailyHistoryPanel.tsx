import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Circle, Filter, Flame, History, Loader2, RefreshCw, Trophy, X } from "lucide-react";
import { useState } from "react";
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
  const { history, loading, loadingMore, hasMore, loadMore, refresh, loadRange } = useDailyHistory(30);
  const [showRange, setShowRange] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rangeActive, setRangeActive] = useState(false);

  const completed = history.filter((h) => h.solved).length;
  const totalXp = history.reduce((acc, h) => acc + (h.xp_awarded || 0), 0);

  return (
    <GlassPanel className="p-5 space-y-4" data-testid="daily-history-panel">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
          <History className="h-4 w-4" /> Daily Challenge History
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase">
            {rangeActive ? `${from} → ${to}` : "last 30 days"}
          </span>
          <button
            onClick={() => setShowRange((v) => !v)}
            className="rounded border border-border/60 p-1 text-muted-foreground hover:text-foreground"
            data-testid="history-range-toggle"
            aria-label="Filter by date range"
          >
            <Filter className="h-3 w-3" />
          </button>
          {rangeActive && (
            <button
              onClick={() => { setRangeActive(false); setShowRange(false); refresh(); }}
              className="rounded border border-border/60 p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear date range"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      {showRange && (
        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card/40 p-2" data-testid="history-range-form">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-7 flex-1 rounded border border-border bg-card/60 px-2 text-xs"
          />
          <span className="text-xs text-muted-foreground">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-7 flex-1 rounded border border-border bg-card/60 px-2 text-xs"
          />
          <button
            onClick={async () => {
              if (!from || !to) return;
              await loadRange(from, to);
              setRangeActive(true);
              setShowRange(false);
            }}
            disabled={!from || !to || loading}
            className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
            data-testid="history-range-apply"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Go
          </button>
        </div>
      )}

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
        <>
          <ul className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
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
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              data-testid="history-load-more"
              className="w-full rounded-md border border-border/60 bg-card/30 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "View More"}
            </button>
          )}
        </>
      )}
    </GlassPanel>
  );
}
