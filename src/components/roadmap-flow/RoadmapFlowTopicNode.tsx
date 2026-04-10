import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, Clock, SkipForward } from 'lucide-react';

function RoadmapFlowTopicNode({ data }: { data: any }) {
  if (data.invisible) return null;

  const status = data.status || 'pending';
  const isAlt = data.isAlternative || data.dashed;
  const dimmed = data.dimmed;

  const isDone = status === 'done';
  const isIP = status === 'in-progress';
  const isSkipped = status === 'skipped';

  let bg: string, borderColor: string, textColor: string;
  if (isDone) {
    bg = 'rgba(34,197,94,0.15)';
    borderColor = '#22c55e';
    textColor = '#86efac';
  } else if (isIP) {
    bg = 'rgba(234,179,8,0.15)';
    borderColor = '#eab308';
    textColor = '#fde047';
  } else if (isSkipped) {
    bg = 'rgba(100,116,139,0.12)';
    borderColor = '#64748b';
    textColor = '#94a3b8';
  } else if (isAlt) {
    bg = 'rgba(139,92,246,0.1)';
    borderColor = '#8b5cf6';
    textColor = '#c4b5fd';
  } else {
    bg = `${data.sectionColor}18`;
    borderColor = data.sectionColor || '#3b82f6';
    textColor = '#e2e8f0';
  }

  return (
    <div
      className={`
        relative flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer
        transition-all duration-200 hover:scale-105 hover:shadow-lg
        ${dimmed ? 'opacity-15 pointer-events-none' : ''}
      `}
      style={{
        background: bg,
        border: `2px ${isAlt && !isDone && !isIP ? 'dashed' : 'solid'} ${borderColor}`,
        color: textColor,
        width: 180,
        backdropFilter: 'blur(8px)',
        boxShadow: isDone || isIP ? `0 0 16px ${borderColor}33` : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0 !w-0 !h-0" />

      {/* Left accent */}
      {!isDone && !isIP && !isSkipped && !isAlt && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 rounded-full"
          style={{ background: data.sectionColor }}
        />
      )}

      {isDone && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#4ade80' }} />}
      {isIP && <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: '#facc15' }} />}
      {isSkipped && <SkipForward className="w-3.5 h-3.5 shrink-0" style={{ color: '#94a3b8' }} />}

      <span className="text-[13px] font-semibold truncate leading-tight">{data.label}</span>

      {/* Difficulty indicator */}
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0 ml-auto"
        style={{
          background: data.difficulty === 'Beginner' ? '#22c55e' :
                      data.difficulty === 'Intermediate' ? '#eab308' : '#ef4444',
          opacity: 0.6,
        }}
      />
    </div>
  );
}

export default memo(RoadmapFlowTopicNode);
