import { memo } from 'react';
import { CheckCircle2, Clock, SkipForward } from 'lucide-react';
import type { RoadmapNodeData, NodeStatus } from '@/data/fullStackRoadmapData';

interface Props {
  node: RoadmapNodeData;
  status: NodeStatus;
  dimmed: boolean;
  onClick: () => void;
}

const sectionGradients: Record<string, { from: string; to: string; glow: string }> = {
  Internet:   { from: '#475569', to: '#64748b', glow: '100,116,139' },
  Frontend:   { from: '#2563eb', to: '#3b82f6', glow: '59,130,246' },
  Testing:    { from: '#0d9488', to: '#14b8a6', glow: '20,184,166' },
  Backend:    { from: '#16a34a', to: '#22c55e', glow: '34,197,94' },
  Security:   { from: '#dc2626', to: '#ef4444', glow: '239,68,68' },
  DevOps:     { from: '#d97706', to: '#f59e0b', glow: '245,158,11' },
  Deployment: { from: '#059669', to: '#10b981', glow: '16,185,129' },
};

function RoadmapFlowNodeCard({ node, status, dimmed, onClick }: Props) {
  const isAlt = node.isAlternative;
  const gradient = sectionGradients[node.section] || sectionGradients.Frontend;

  const isDone = status === 'done';
  const isIP = status === 'in-progress';
  const isSkipped = status === 'skipped';

  // Background & border based on status
  let bg: string, borderColor: string, textColor: string, shadow: string;
  if (isDone) {
    bg = 'rgba(34,197,94,0.12)';
    borderColor = '#22c55e';
    textColor = '#86efac';
    shadow = '0 0 20px rgba(34,197,94,0.15)';
  } else if (isIP) {
    bg = 'rgba(234,179,8,0.12)';
    borderColor = '#eab308';
    textColor = '#fde047';
    shadow = '0 0 20px rgba(234,179,8,0.15)';
  } else if (isSkipped) {
    bg = 'rgba(100,116,139,0.1)';
    borderColor = '#475569';
    textColor = '#94a3b8';
    shadow = 'none';
  } else if (isAlt) {
    bg = 'rgba(139,92,246,0.08)';
    borderColor = '#7c3aed';
    textColor = '#c4b5fd';
    shadow = '0 0 16px rgba(139,92,246,0.1)';
  } else {
    bg = `rgba(${gradient.glow},0.08)`;
    borderColor = gradient.to;
    textColor = '#e2e8f0';
    shadow = `0 0 16px rgba(${gradient.glow},0.1)`;
  }

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex items-center gap-2 px-4 py-2.5 rounded-lg
        text-[13px] font-semibold cursor-pointer
        transition-all duration-300 ease-out
        hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
        ${dimmed ? 'opacity-15 pointer-events-none' : ''}
      `}
      style={{
        background: bg,
        border: `1.5px ${isAlt && status === 'pending' ? 'dashed' : 'solid'} ${borderColor}`,
        color: textColor,
        boxShadow: shadow,
        minWidth: 100,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
        style={{ boxShadow: `0 0 30px rgba(${gradient.glow},0.2)` }}
      />

      {/* Status icon */}
      {isDone && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />}
      {isIP && <Clock className="w-3.5 h-3.5 shrink-0 text-yellow-400" />}
      {isSkipped && <SkipForward className="w-3.5 h-3.5 shrink-0 text-slate-400" />}

      {/* Left accent bar */}
      {status === 'pending' && !isAlt && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/5 rounded-full"
          style={{ background: `linear-gradient(180deg, ${gradient.from}, ${gradient.to})` }}
        />
      )}

      <span className="truncate leading-tight">{node.title}</span>

      {/* Difficulty dot */}
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0 opacity-60"
        style={{
          background: node.difficulty === 'Beginner' ? '#22c55e' :
                      node.difficulty === 'Intermediate' ? '#eab308' : '#ef4444'
        }}
      />
    </button>
  );
}

export default memo(RoadmapFlowNodeCard);
