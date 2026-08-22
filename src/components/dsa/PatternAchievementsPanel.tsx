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
  Settings as SettingsIcon,
  Bell,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { COMMON_PATTERNS, PATTERN_TOTAL } from "@/data/dsaCommonPatternsData";
import type { PatternHistoryStats } from "@/hooks/useDsaPatternHistory";
import type { DsaPatternSettings } from "@/hooks/useDsaPatternSettings";
import type { AchievementFeedItem } from "@/hooks/useDsaPatternAchievements";
import type { BadgeDrawerTarget } from "./BadgeDetailsDrawer";

const TIERS = [
  { pct: 25, label: "Bronze" as const, color: "border-amber-700/50 bg-amber-700/10 text-amber-400" },
  { pct: 50, label: "Silver" as const, color: "border-zinc-400/50 bg-zinc-400/10 text-zinc-200" },
  { pct: 100, label: "Gold" as const, color: "border-yellow-500/60 bg-yellow-500/15 text-yellow-300" },
];

interface Props {
  done: Set<string>;
  history: PatternHistoryStats;
  settings: DsaPatternSettings;
  onUpdateSettings: (patch: Partial<DsaPatternSettings>) => void;
  feed: AchievementFeedItem[];
  onClearFeed: () => void;
  onOpenBadge: (target: BadgeDrawerTarget) => void;
}

export default function PatternAchievementsPanel({
  done,
  history,
  settings,
  onUpdateSettings,
  feed,
  onClearFeed,
  onOpenBadge,
}: Props) {
  const [open, setOpen] = useState(false);

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

  const unlockedCount = useMemo(() => {
    let n = 0;
    categoryPct.forEach((pct) => TIERS.forEach((t) => pct >= t.pct && (n += 1)));
    if (overallPct >= 100) n += 1;
    return n;
  }, [categoryPct, overallPct]);
  const totalBadges = COMMON_PATTERNS.length * TIERS.length + 1;

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
      <div className="w-full flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 hover:opacity-90 transition-opacity"
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className="font-semibold text-sm">Achievements & Streaks</span>
        </button>
        <div className="flex items-center gap-2">
          <Badge className="bg-yellow-500/15 text-yellow-300 border-yellow-500/30">
            <Award className="h-3 w-3 mr-1" />
            {unlockedCount}/{totalBadges} badges
          </Badge>
          <Badge className="bg-orange-500/15 text-orange-300 border-orange-500/30">
            <Flame className="h-3 w-3 mr-1" />
            {history.currentStreak}d streak
          </Badge>
          <SettingsPopover settings={settings} onUpdate={onUpdateSettings} />
        </div>
      </div>

      {open && (
        <div className="border-t border-border/40 p-4 space-y-5">
          {/* Recent unlocks feed */}
          {feed.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Bell className="h-3 w-3" /> Recent unlocks
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClearFeed}
                  className="h-6 px-2 text-[11px] text-muted-foreground"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Clear
                </Button>
              </div>
              <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {feed.slice(0, 8).map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center gap-2 rounded-md border border-border/40 bg-card/40 px-2.5 py-1.5"
                  >
                    <span className="text-base" aria-hidden>
                      {it.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{it.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{it.detail}</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(it.ts).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Streak stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatTile
              icon={<Flame className="h-4 w-4 text-orange-400" />}
              label="Current streak"
              value={`${history.currentStreak}d`}
              hint={settings.dailyThreshold > 1 ? `≥${settings.dailyThreshold}/day` : undefined}
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
            <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(30, minmax(0, 1fr))" }}>
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
              {/* Overall */}
              <button
                type="button"
                onClick={() =>
                  onOpenBadge({ scope: "overall", tier: overallPct >= 100 ? "Gold" : null })
                }
                className={cn(
                  "rounded-lg border p-3 flex items-center gap-3 text-left hover:opacity-95 transition-opacity",
                  overallPct >= 100
                    ? "border-yellow-500/60 bg-yellow-500/10"
                    : "border-border/40 bg-card/40 opacity-80",
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
              </button>

              {COMMON_PATTERNS.map((cat) => {
                const pct = categoryPct.get(cat.id) || 0;
                const highest = [...TIERS].reverse().find((t) => pct >= t.pct);
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() =>
                      onOpenBadge({ scope: cat.id, tier: highest?.label ?? null })
                    }
                    className={cn(
                      "rounded-lg border p-3 flex items-center gap-3 text-left hover:opacity-95 transition-opacity",
                      highest ? highest.color : "border-border/40 bg-card/40 opacity-80",
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
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-current/40">
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
                  </button>
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

function SettingsPopover({
  settings,
  onUpdate,
}: {
  settings: DsaPatternSettings;
  onUpdate: (patch: Partial<DsaPatternSettings>) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          aria-label="Streak settings"
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-1">Streak settings</h4>
          <p className="text-[11px] text-muted-foreground">
            Customize how streaks and weekly stats are computed.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dsa-threshold" className="text-xs">
            Daily completion threshold
          </Label>
          <Input
            id="dsa-threshold"
            type="number"
            min={1}
            max={20}
            value={settings.dailyThreshold}
            onChange={(e) =>
              onUpdate({
                dailyThreshold: Math.max(1, Math.min(20, Number(e.target.value) || 1)),
              })
            }
            className="h-8 text-sm"
          />
          <p className="text-[10px] text-muted-foreground">
            Patterns to complete in a day for it to count toward your streak.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pattern-week-start" className="text-xs">Week starts on</Label>
          <Select
            value={String(settings.weekStart)}
            onValueChange={(v) => onUpdate({ weekStart: v === "0" ? 0 : 1 })}
          >
            <SelectTrigger id="pattern-week-start" className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Monday</SelectItem>
              <SelectItem value="0">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
