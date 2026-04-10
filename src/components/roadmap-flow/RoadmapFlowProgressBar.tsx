import { CheckCircle2, Clock, SkipForward, RotateCcw, TrendingUp, Trophy, Flame, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  stats: {
    done: number;
    inProgress: number;
    skipped: number;
    pending: number;
    total: number;
    percentage: number;
  };
  onReset: () => void;
}

export default function RoadmapFlowProgressBar({ stats, onReset }: Props) {
  const progressColor = stats.percentage === 100 ? '#22c55e' : stats.percentage > 50 ? '#3b82f6' : '#6366f1';
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (stats.percentage / 100) * circumference;

  const streakLevel = stats.done >= 20 ? 'Master' : stats.done >= 10 ? 'Pro' : stats.done >= 5 ? 'Rising' : 'Starter';
  const streakColor = stats.done >= 20 ? '#f59e0b' : stats.done >= 10 ? '#8b5cf6' : stats.done >= 5 ? '#3b82f6' : '#64748b';

  return (
    <div
      className="flex flex-col sm:flex-row items-center gap-4 p-5 sm:p-6 rounded-2xl border border-border/60"
      style={{
        background: 'linear-gradient(145deg, rgba(15,23,42,0.6), rgba(30,41,59,0.3))',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Circular progress */}
      <div className="relative w-[72px] h-[72px] shrink-0">
        <svg width="72" height="72" viewBox="0 0 64 64" className="-rotate-90">
          <circle cx="32" cy="32" r="28" fill="none" strokeWidth="3.5" className="stroke-muted/20" />
          <circle
            cx="32" cy="32" r="28" fill="none"
            strokeWidth="4" strokeLinecap="round"
            stroke={progressColor}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${progressColor}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {stats.percentage === 100 ? (
            <Trophy className="w-5 h-5 text-emerald-400" />
          ) : (
            <>
              <span className="text-sm font-black leading-none">{stats.percentage}%</span>
              <span className="text-[8px] text-muted-foreground/50 mt-0.5">done</span>
            </>
          )}
        </div>
      </div>

      {/* Progress bar + stats */}
      <div className="flex-1 w-full space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Your Progress</span>
            {/* Level badge */}
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: `${streakColor}15`, color: streakColor, border: `1px solid ${streakColor}25` }}
            >
              {streakLevel}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {stats.done} of {stats.total} completed
          </span>
        </div>
        {/* Multi-segment progress bar */}
        <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden flex">
          {stats.done > 0 && (
            <div
              className="h-full transition-all duration-500 rounded-l-full"
              style={{
                width: `${(stats.done / stats.total) * 100}%`,
                background: 'linear-gradient(90deg, #16a34a, #22c55e, #4ade80)',
                boxShadow: '0 0 8px rgba(34,197,94,0.3)',
              }}
            />
          )}
          {stats.inProgress > 0 && (
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(stats.inProgress / stats.total) * 100}%`,
                background: 'linear-gradient(90deg, #d97706, #eab308)',
                boxShadow: '0 0 8px rgba(234,179,8,0.2)',
              }}
            />
          )}
          {stats.skipped > 0 && (
            <div
              className="h-full bg-slate-600 transition-all duration-500"
              style={{ width: `${(stats.skipped / stats.total) * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* Stats badges */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
        <StatBadge icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />} count={stats.done} label="Done" glow="rgba(34,197,94,0.08)" />
        <StatBadge icon={<Clock className="w-3.5 h-3.5 text-yellow-400" />} count={stats.inProgress} label="Active" glow="rgba(234,179,8,0.08)" />
        <StatBadge icon={<SkipForward className="w-3.5 h-3.5 text-slate-400" />} count={stats.skipped} label="Skip" glow="rgba(100,116,139,0.08)" />
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={onReset}>
          <RotateCcw className="w-3 h-3 mr-1" /> Reset
        </Button>
      </div>
    </div>
  );
}

function StatBadge({ icon, count, label, glow }: { icon: React.ReactNode; count: number; label: string; glow: string }) {
  return (
    <span
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/40"
      style={{ background: glow }}
    >
      {icon}
      <span className="font-bold">{count}</span>
      <span className="text-muted-foreground hidden sm:inline">{label}</span>
    </span>
  );
}
