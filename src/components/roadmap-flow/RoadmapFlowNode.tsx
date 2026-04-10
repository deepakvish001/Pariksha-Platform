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

const statusStyles: Record<string, { bg: string; border: string; text: string }> = {
  done: { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', text: '#4ade80' },
  'in-progress': { bg: 'rgba(234,179,8,0.15)', border: '#eab308', text: '#facc15' },
  skipped: { bg: 'rgba(82,82,82,0.2)', border: '#525252', text: '#737373' },
};

const statusIcon: Record<string, React.ReactNode> = {
  done: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#4ade80' }} />,
  'in-progress': <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: '#facc15' }} />,
  skipped: <SkipForward className="w-3.5 h-3.5 shrink-0" style={{ color: '#737373' }} />,
};

function RoadmapFlowNode({ data, selected }: Props) {
  const status = data.status || 'pending';
  const isAlt = data.isAlternative;
  const styles = statusStyles[status];

  // roadmap.sh style: pending nodes have a warm white/cream bg, done = green tint, etc.
  const bg = styles?.bg || (isAlt ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.05)');
  const borderColor = styles?.border || (isAlt ? '#7c3aed' : 'rgba(255,255,255,0.12)');
  const borderStyle = isAlt && status === 'pending' ? 'dashed' : 'solid';

  return (
    <div
      className={`
        relative flex items-center justify-center gap-1.5 px-4 py-2 rounded
        cursor-pointer transition-all duration-200 text-[13px] font-medium
        hover:brightness-125 hover:scale-[1.03]
        ${selected ? 'ring-2 ring-primary shadow-lg scale-[1.03]' : ''}
        ${data.dimmed ? 'opacity-15 pointer-events-none' : ''}
      `}
      style={{
        background: bg,
        borderColor,
        borderWidth: status !== 'pending' ? 2 : 1,
        borderStyle,
        width: 180,
        backdropFilter: 'blur(4px)',
      }}
    >
      {statusIcon[status] && <span className="shrink-0">{statusIcon[status]}</span>}
      <span
        className="truncate leading-tight text-center"
        style={{ color: styles?.text || (isAlt ? '#c4b5fd' : '#e2e8f0') }}
      >
        {data.title}
      </span>
    </div>
  );
}

export default memo(RoadmapFlowNode);
