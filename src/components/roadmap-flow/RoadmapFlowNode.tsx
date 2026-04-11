import { memo } from 'react';
import { CheckCircle2, Clock, SkipForward } from 'lucide-react';
import type { NodeStatus } from '@/data/fullStackRoadmapData';

interface Props {
  data: {
    id: string;
    title: string;
    difficulty: string;
    sectionColor: string;
    section: string;
    nodeType: string;
    isAlternative?: boolean;
    status?: NodeStatus;
    dimmed?: boolean;
  };
  selected?: boolean;
}

const statusBorder: Record<string, string> = {
  done: '#22c55e',
  'in-progress': '#eab308',
  skipped: '#525252',
};

const statusIcon: Record<string, React.ReactNode> = {
  done: <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />,
  'in-progress': <Clock className="w-3 h-3 text-yellow-400 shrink-0" />,
  skipped: <SkipForward className="w-3 h-3 text-muted-foreground shrink-0" />,
};

function RoadmapFlowNode({ data, selected }: Props) {
  const status = data.status || 'pending';
  const borderColor = statusBorder[status] || (data.isAlternative ? '#a78bfa' : data.sectionColor);
  const isDone = status === 'done';
  const isSkipped = status === 'skipped';

  return (
    <div
      className={`
        relative flex items-center gap-1.5 px-3 py-1.5 rounded-md border
        cursor-pointer transition-all duration-150 text-[13px] font-medium
        hover:shadow-md hover:brightness-110
        ${isDone ? 'bg-emerald-500/10' : isSkipped ? 'bg-muted/40 opacity-60' : 'bg-card'}
        ${selected ? 'ring-2 ring-primary shadow-lg' : ''}
        ${data.dimmed ? 'opacity-20 pointer-events-none' : ''}
      `}
      style={{
        borderColor,
        borderWidth: status !== 'pending' ? 2 : 1,
        minWidth: 140,
        maxWidth: 200,
      }}
    >
      {statusIcon[status] && <span>{statusIcon[status]}</span>}
      <span className="truncate text-foreground leading-tight">{data.title}</span>
      {data.isAlternative && (
        <span className="ml-auto text-[9px] px-1 py-0.5 rounded bg-violet-500/20 text-violet-400 shrink-0">alt</span>
      )}
    </div>
  );
}

export default memo(RoadmapFlowNode);
