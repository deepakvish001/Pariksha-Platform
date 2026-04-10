import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, SkipForward, RotateCcw, Trophy, Flame } from 'lucide-react';
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

function getLevel(pct: number) {
  if (pct >= 100) return { label: 'Master', emoji: '👑', color: '#eab308' };
  if (pct >= 75) return { label: 'Pro', emoji: '🔥', color: '#ef4444' };
  if (pct >= 40) return { label: 'Rising', emoji: '⚡', color: '#3b82f6' };
  if (pct >= 10) return { label: 'Learner', emoji: '📚', color: '#22c55e' };
  return { label: 'Starter', emoji: '🌱', color: '#64748b' };
}

export default function RoadmapFlowProgressBar({ stats, onReset }: Props) {
  const level = getLevel(stats.percentage);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Level badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold"
            style={{ background: `${level.color}15`, border: `1.5px solid ${level.color}40`, color: level.color }}
          >
            <span>{level.emoji}</span>
            <span>{level.label}</span>
          </div>
          <div>
            <span className="text-lg font-extrabold">{stats.percentage}%</span>
            <span className="text-xs text-muted-foreground ml-1.5">{stats.done}/{stats.total} topics</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> {stats.done}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 font-medium">
            <Clock className="w-3.5 h-3.5" /> {stats.inProgress}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 text-muted-foreground font-medium">
            <SkipForward className="w-3.5 h-3.5" /> {stats.skipped}
          </span>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onReset}>
            <RotateCcw className="w-3 h-3 mr-1" /> Reset
          </Button>
        </div>
      </div>

      <Progress
        value={stats.percentage}
        className="h-2.5"
        indicatorClassName={
          stats.percentage === 100 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
          stats.percentage >= 50 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
          'bg-gradient-to-r from-emerald-500 to-teal-500'
        }
      />
    </div>
  );
}
