import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
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
    status?: NodeStatus;
    dimmed?: boolean;
  };
  selected?: boolean;
}

const statusStyles: Record<string, string> = {
  done: 'border-emerald-500 bg-emerald-500/10',
  'in-progress': 'border-yellow-500 bg-yellow-500/10',
  skipped: 'border-muted bg-muted/30 opacity-60',
  pending: 'border-border bg-card',
};

const statusIcon: Record<string, React.ReactNode> = {
  done: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  'in-progress': <Clock className="w-4 h-4 text-yellow-400" />,
  skipped: <SkipForward className="w-4 h-4 text-muted-foreground" />,
};

const difficultyBadge: Record<string, string> = {
  Beginner: 'bg-emerald-500/20 text-emerald-400',
  Intermediate: 'bg-yellow-500/20 text-yellow-400',
  Advanced: 'bg-red-500/20 text-red-400',
};

function RoadmapFlowNode({ data, selected }: Props) {
  const status = data.status || 'pending';

  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl border-2 min-w-[200px] max-w-[240px]
        cursor-pointer transition-all duration-200
        hover:shadow-lg hover:scale-[1.03]
        ${statusStyles[status]}
        ${selected ? 'ring-2 ring-primary shadow-xl scale-[1.04]' : ''}
        ${data.dimmed ? 'opacity-30 pointer-events-none' : ''}
      `}
      style={{ borderColor: status === 'pending' ? data.sectionColor + '80' : undefined }}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-2 !h-2" />

      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{data.title}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${difficultyBadge[data.difficulty] || ''}`}>
              {data.difficulty}
            </span>
            <span className="text-[10px] text-muted-foreground">{data.section}</span>
          </div>
        </div>
        {statusIcon[status] && <div className="mt-0.5">{statusIcon[status]}</div>}
      </div>
    </div>
  );
}

export default memo(RoadmapFlowNode);
