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
    order?: number;
  };
  selected?: boolean;
}

const statusBg: Record<string, string> = {
  done: 'bg-emerald-500/10',
  'in-progress': 'bg-yellow-500/5',
  skipped: 'bg-muted/40 opacity-60',
};

const statusBorder: Record<string, string> = {
  done: '#22c55e',
  'in-progress': '#eab308',
  skipped: '#525252',
};

const statusIcon: Record<string, React.ReactNode> = {
  done: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
  'in-progress': <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />,
  skipped: <SkipForward className="w-3.5 h-3.5 text-muted-foreground shrink-0" />,
};

function RoadmapFlowNode({ data, selected }: Props) {
  const status = data.status || 'pending';
  const borderColor = statusBorder[status] || (data.isAlternative ? '#a78bfa' : data.sectionColor);

  return (
    <div
      className={`
        relative flex items-center gap-2 px-3 py-2 rounded-lg border
        cursor-pointer transition-all duration-150 text-sm font-medium
        hover:shadow-lg hover:scale-[1.02] hover:brightness-110
        ${statusBg[status] || 'bg-card'}
        ${selected ? 'ring-2 ring-primary shadow-lg' : ''}
        ${data.dimmed ? 'opacity-20 pointer-events-none' : ''}
      `}
      style={{
        borderColor,
        borderWidth: status !== 'pending' ? 2 : 1,
        width: 200,
      }}
    >
      {/* Order number badge */}
      {data.order && (
        <span
          className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
          style={{ background: data.sectionColor }}
        >
          {data.order}
        </span>
      )}

      {statusIcon[status] && <span>{statusIcon[status]}</span>}
      <span className="truncate text-foreground leading-tight">{data.title}</span>
      {data.isAlternative && (
        <span className="ml-auto text-[9px] px-1 py-0.5 rounded bg-violet-500/20 text-violet-400 shrink-0">alt</span>
      )}
    </div>
  );
}

export default memo(RoadmapFlowNode);
