import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, SkipForward, RotateCcw } from 'lucide-react';
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
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl border border-border bg-card">
      <div className="flex-1 w-full space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{stats.percentage}% Complete</span>
          <span className="text-xs text-muted-foreground">{stats.done}/{stats.total} topics</span>
        </div>
        <Progress
          value={stats.percentage}
          className="h-2.5"
          indicatorClassName={stats.percentage === 100 ? 'bg-emerald-500' : 'bg-primary'}
        />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {stats.done}</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-yellow-400" /> {stats.inProgress}</span>
        <span className="flex items-center gap-1"><SkipForward className="w-3.5 h-3.5" /> {stats.skipped}</span>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onReset}>
          <RotateCcw className="w-3 h-3 mr-1" /> Reset
        </Button>
      </div>
    </div>
  );
}
