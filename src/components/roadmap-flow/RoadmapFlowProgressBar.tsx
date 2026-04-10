import { CheckCircle2, Clock, SkipForward, RotateCcw, TrendingUp, Trophy } from 'lucide-react';
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

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 sm:p-5 rounded-2xl border border-border bg-card/80 backdrop-blur-sm">
      {/* Circular progress */}
      <div className="relative w-16 h-16 shrink-0">
        <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
          <circle cx="32" cy="32" r="28" fill="none" strokeWidth="4" className="stroke-muted/30" />
          <circle
            cx="32" cy="32" r="28"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            stroke={progressColor}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {stats.percentage === 100 ? (
            <Trophy className="w-5 h-5 text-emerald-400" />
          ) : (
            <span className="text-sm font-bold">{stats.percentage}%</span>
          )}
        </div>
      </div>

      {/* Progress bar + stats */}
      <div className="flex-1 w-full space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Progress</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {stats.done} of {stats.total} completed
          </span>
        </div>
        {/* Multi-segment progress bar */}
        <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden flex">
          {stats.done > 0 && (
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-l-full"
              style={{ width: `${(stats.done / stats.total) * 100}%` }}
            />
          )}
          {stats.inProgress > 0 && (
            <div
              className="h-full bg-yellow-500 transition-all duration-500"
              style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
            />
          )}
          {stats.skipped > 0 && (
            <div
              className="h-full bg-slate-500 transition-all duration-500"
              style={{ width: `${(stats.skipped / stats.total) * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* Stats badges */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
        <StatBadge icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />} count={stats.done} label="Done" color="emerald" />
        <StatBadge icon={<Clock className="w-3.5 h-3.5 text-yellow-400" />} count={stats.inProgress} label="Active" color="yellow" />
        <StatBadge icon={<SkipForward className="w-3.5 h-3.5 text-slate-400" />} count={stats.skipped} label="Skip" color="slate" />
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={onReset}>
          <RotateCcw className="w-3 h-3 mr-1" /> Reset
        </Button>
      </div>
    </div>
  );
}

function StatBadge({ icon, count, label, color }: { icon: React.ReactNode; count: number; label: string; color: string }) {
  return (
    <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/30 border border-border/50">
      {icon}
      <span className="font-bold">{count}</span>
      <span className="text-muted-foreground hidden sm:inline">{label}</span>
    </span>
  );
}
