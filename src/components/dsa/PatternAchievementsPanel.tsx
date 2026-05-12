import { useMemo, useState } from "react";
import {
  Trophy,
  Award,
  Flame,
  Calendar,
  ChevronDown,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { COMMON_PATTERNS, PATTERN_TOTAL } from "@/data/dsaCommonPatternsData";
import type { PatternHistoryStats } from "@/hooks/useDsaPatternHistory";

const TIERS = [
  { pct: 25, label: "Bronze",   color: "border-amber-700/50 bg-amber-700/10 text-amber-400" },
  { pct: 50, label: "Silver",   color: "border-zinc-400/50 bg-zinc-400/10 text-zinc-200" },
  { pct: 100, label: "Gold",    color: "border-yellow-500/60 bg-yellow-500/15 text-yellow-300" },
] as const;

interface Props {
  done: Set<string>;
  history: PatternHistoryStats;
}

export default function PatternAchievementsPanel({ done, history }: Props) {
  const [open, setOpen] = useState(false);

  // Per-category percentage
  const categoryPct = useMemo(() => {
    const m = new Map<string, number>();
    COMMON_PATTERNS.forEach((cat) => {
      const total = cat.patterns.length;
      const d = cat.patterns.reduce((n, p) => n + (done.has(p.id) ? 1 : 0), 0);
      m.set(cat.id, total > 0 ? (d / total) * 100 : 0);
    });
    return m;
  }, [done]);

  const overallPct = PATTERN_TOTAL > 0 ? (done.size / PATTERN_TOTAL) * 100 : 0;

  // Count unlocked badges
  const unlockedCount = useMemo(() => {
    let n = 0;
    categoryPct.forEach((pct) => TIERS.forEach((t) => pct >= t.pct && (n += 1)));
    if (overallPct >= 100) n += 1;
    return n;
  }, [categoryPct, overallPct]);
  const totalBadges = COMMON_PATTERNS.length * TIERS.length + 1;

  // Heatmap intensity
  const maxDay = Math.max(1, ...history.last30Days.map((d) => d.count));
  const intensity = (n: number) => {
    if (n === 0) return "bg-muted/30";
    const ratio = n / maxDay;
    if (ratio > 0.75) return "bg-emerald-500";
    if (ratio > 0.5) return "bg-emerald-500/70";
    if (ratio > 0.25) return "bg-emerald-500/45";
    return "bg-emerald-500/25";
  };

  return (
    <section className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-card/60 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className="font-semibold text-sm">Achievements & Streaks</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-yellow-500/15 text-yellow-300 border-yellow-500/30">
            <Award className="h-3 w-3 mr-1" />
            {unlockedCount}/{totalBadges} badges
          </Badge>
          <Badge className="bg-orange-500/15 text-orange-300 border-orange-500/30">
            <Flame className="h-3 w-3 mr-1" />
            {history.currentStreak}d streak
          </Badge>
        </div>
      </button>

      {open && (
        <div className="border-t border-border/40 p-4 space-y-5">
          {/* Streak stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatTile
              icon={<Flame className="h-4 w-4 text-orange-400" />}
              label="Current streak"
              value={`${history.currentStreak}d`}
            />
            <StatTile
              icon={<Sparkles className="h-4 w-4 text-yellow-400" />}
              label="Longest streak"
              value={`${history.longestStreak}d`}
            />
            <StatTile
              icon={<Calendar className="h-4 w-4 text-sky-400" />}
              label="This week"
              value={`${history.thisWeekCount}`}
              hint={`Last week: ${history.lastWeekCount}`}
            />
            <StatTile
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              label="Active days"
              value={`${history.activeDays}`}
            />
          </div>

          {/* 30-day heatmap */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Last 30 days
              </h4>
              <span className="text-[10px] text-muted-foreground">
                {history.last30Days.reduce((s, d) => s + d.count, 0)} completions
              </span>
            </div>
            <div className="grid grid-cols-15 gap-1" style={{ gridTemplateColumns: "repeat(30, minmax(0, 1fr))" }}>
              {history.last30Days.map((d) => (
                <div
                  key={d.day}
                  title={`${d.day}: ${d.count} pattern${d.count === 1 ? "" : "s"} completed`}
                  className={cn(
                    "aspect-square rounded-[3px] border border-border/30",
                    intensity(d.count),
                  )}
                />
              ))}
            </div>
          </div>

          {/* Achievement grid */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Mastery badges
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Overall mastery first */}
              <div
                className={cn(
                  "rounded-lg border p-3 flex items-center gap-3",
                  overallPct >= 100
                    ? "border-yellow-500/60 bg-yellow-500/10"
                    : "border-border/40 bg-card/40 opacity-70",
                )}
              >
                <div
                  className={cn(
                    "h-10 w-10 grid place-items-center rounded-full text-lg shrink-0",
                    overallPct >= 100 ? "bg-yellow-500/20" : "bg-muted/40",
                  )}
                >
                  {overallPct >= 100 ? "👑" : <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">Grand Master</div>
                  <div className="text-[11px] text-muted-foreground">
                    100% of all patterns • {Math.round(overallPct)}% complete
                  </div>
                </div>
              </div>

              {COMMON_PATTERNS.map((cat) => {
                const pct = categoryPct.get(cat.id) || 0;
                const highest = [...TIERS].reverse().find((t) => pct >= t.pct);
                return (
                  <div
                    key={cat.id}
                    className={cn(
                      "rounded-lg border p-3 flex items-center gap-3",
                      highest
                        ? highest.color
                        : "border-border/40 bg-card/40 opacity-70",
                    )}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 grid place-items-center rounded-full text-lg shrink-0",
                        highest ? "bg-background/30" : "bg-muted/40",
                      )}
                    >
                      {highest ? cat.emoji : <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold flex items-center gap-1.5">
                        <span className="truncate">{cat.title}</span>
                        {highest && (
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1 border-current/40"
                          >
                            {highest.label}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] opacity-80">
                        {Math.round(pct)}% complete
                        {!highest && " • 25% unlocks Bronze"}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {TIERS.map((t) => (
                          <span
                            key={t.label}
                            className={cn(
                              "h-1 flex-1 rounded-full",
                              pct >= t.pct ? "bg-current opacity-90" : "bg-muted/40",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold mt-0.5">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
