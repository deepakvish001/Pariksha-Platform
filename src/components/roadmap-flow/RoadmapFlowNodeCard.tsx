import { memo } from 'react';
import { CheckCircle2, Clock, SkipForward, Star, Timer } from 'lucide-react';
import type { RoadmapNodeData, NodeStatus } from '@/data/fullStackRoadmapData';

interface Props {
  node: RoadmapNodeData;
  status: NodeStatus;
  dimmed: boolean;
  isUpNext?: boolean;
  onClick: () => void;
}

const sectionGradients: Record<string, { from: string; to: string; glow: string; tag: string }> = {
  Internet:   { from: '#475569', to: '#64748b', glow: '100,116,139', tag: '#475569' },
  Frontend:   { from: '#2563eb', to: '#3b82f6', glow: '59,130,246', tag: '#2563eb' },
  Testing:    { from: '#0d9488', to: '#14b8a6', glow: '20,184,166', tag: '#0d9488' },
  Backend:    { from: '#16a34a', to: '#22c55e', glow: '34,197,94', tag: '#16a34a' },
  Security:   { from: '#dc2626', to: '#ef4444', glow: '239,68,68', tag: '#dc2626' },
  DevOps:     { from: '#d97706', to: '#f59e0b', glow: '245,158,11', tag: '#d97706' },
  Deployment: { from: '#059669', to: '#10b981', glow: '16,185,129', tag: '#059669' },
};

const diffConfig = {
  Beginner: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', label: 'Easy' },
  Intermediate: { color: '#eab308', bg: 'rgba(234,179,8,0.15)', label: 'Medium' },
  Advanced: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Hard' },
};

function RoadmapFlowNodeCard({ node, status, dimmed, isUpNext, onClick }: Props) {
  const isAlt = node.isAlternative;
  const gradient = sectionGradients[node.section] || sectionGradients.Frontend;
  const diff = diffConfig[node.difficulty];

  const isDone = status === 'done';
  const isIP = status === 'in-progress';
  const isSkipped = status === 'skipped';

  // Background & border based on status
  let bg: string, borderColor: string, textColor: string, shadow: string;
  if (isDone) {
    bg = 'rgba(34,197,94,0.10)';
    borderColor = '#22c55e';
    textColor = '#a7f3d0';
    shadow = '0 0 24px rgba(34,197,94,0.12)';
  } else if (isIP) {
    bg = 'rgba(234,179,8,0.10)';
    borderColor = '#eab308';
    textColor = '#fef08a';
    shadow = '0 0 24px rgba(234,179,8,0.12)';
  } else if (isSkipped) {
    bg = 'rgba(100,116,139,0.08)';
    borderColor = '#334155';
    textColor = '#64748b';
    shadow = 'none';
  } else if (isAlt) {
    bg = 'rgba(139,92,246,0.06)';
    borderColor = '#6d28d9';
    textColor = '#c4b5fd';
    shadow = '0 0 20px rgba(139,92,246,0.08)';
  } else if (isUpNext) {
    bg = 'rgba(59,130,246,0.12)';
    borderColor = '#3b82f6';
    textColor = '#93c5fd';
    shadow = '0 0 24px rgba(59,130,246,0.15)';
  } else {
    bg = `rgba(${gradient.glow},0.06)`;
    borderColor = `rgba(${gradient.glow},0.5)`;
    textColor = '#e2e8f0';
    shadow = `0 0 16px rgba(${gradient.glow},0.08)`;
  }

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col gap-1.5 px-3.5 py-2.5 rounded-xl
        text-left cursor-pointer
        transition-all duration-300 ease-out
        hover:-translate-y-0.5 hover:scale-[1.02]
        active:translate-y-0 active:scale-[0.98]
        ${dimmed ? 'opacity-10 pointer-events-none' : ''}
        ${isSkipped ? 'line-through decoration-slate-500/50' : ''}
      `}
      style={{
        background: bg,
        border: `1.5px ${isAlt && status === 'pending' ? 'dashed' : 'solid'} ${borderColor}`,
        color: textColor,
        boxShadow: shadow,
        minWidth: 160,
        maxWidth: 200,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Hover glow layer */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
        style={{ boxShadow: `0 0 40px rgba(${gradient.glow},0.18)` }}
      />

      {/* Top row: section tag + status icon */}
      <div className="flex items-center justify-between w-full gap-1">
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] leading-none"
          style={{ background: `${gradient.tag}30`, color: gradient.to }}
        >
          {node.section}
        </span>
        <div className="flex items-center gap-1">
          {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          {isIP && <Clock className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />}
          {isSkipped && <SkipForward className="w-3.5 h-3.5 text-slate-500" />}
          {isUpNext && !isDone && !isIP && <Star className="w-3.5 h-3.5 text-blue-400 animate-pulse" />}
        </div>
      </div>

      {/* Title */}
      <span className="text-[13px] font-bold leading-tight truncate w-full">{node.title}</span>

      {/* Bottom row: difficulty + time */}
      <div className="flex items-center gap-1.5 w-full">
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-[3px] leading-none"
          style={{ background: diff.bg, color: diff.color }}
        >
          {diff.label}
        </span>
        {node.timeEstimate && (
          <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
            <Timer className="w-2.5 h-2.5" />
            {node.timeEstimate}
          </span>
        )}
      </div>

      {/* Left accent bar */}
      {!isDone && !isIP && !isSkipped && !isAlt && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 rounded-full"
          style={{ background: `linear-gradient(180deg, ${gradient.from}, ${gradient.to})` }}
        />
      )}

      {/* Up Next badge */}
      {isUpNext && !isDone && !isIP && !isSkipped && (
        <div className="absolute -top-2 -right-2 text-[8px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full shadow-lg shadow-blue-500/30 animate-bounce">
          UP NEXT
        </div>
      )}

      {/* Alternative badge */}
      {isAlt && status === 'pending' && (
        <div className="absolute -top-2 -right-2 text-[8px] font-bold bg-violet-600 text-white px-1.5 py-0.5 rounded-full">
          ALT
        </div>
      )}
    </button>
  );
}

export default memo(RoadmapFlowNodeCard);
