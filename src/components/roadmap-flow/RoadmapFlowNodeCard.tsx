import { memo } from 'react';
import {
  CheckCircle2, Clock, SkipForward, Globe, Shield, Server,
  Code2, FileCode, Palette, Box, GitBranch, Terminal, Database,
  Lock, Cloud, Gauge, Rocket, TestTube, Wrench, Zap, Layers,
  type LucideIcon,
} from 'lucide-react';
import type { RoadmapNodeData, NodeStatus } from '@/data/fullStackRoadmapData';

interface Props {
  node: RoadmapNodeData;
  status: NodeStatus;
  dimmed: boolean;
  onClick: () => void;
}

// Tech-specific icon mapping
const techIcons: Record<string, { icon: LucideIcon; color: string }> = {
  'internet-how': { icon: Globe, color: '#60a5fa' },
  'http-https': { icon: Lock, color: '#a78bfa' },
  'dns': { icon: Server, color: '#67e8f9' },
  'browsers': { icon: Globe, color: '#fbbf24' },
  'html': { icon: FileCode, color: '#f97316' },
  'css': { icon: Palette, color: '#3b82f6' },
  'javascript': { icon: Zap, color: '#eab308' },
  'npm': { icon: Box, color: '#ef4444' },
  'react': { icon: Code2, color: '#06b6d4' },
  'tailwind': { icon: Palette, color: '#06b6d4' },
  'github': { icon: GitBranch, color: '#e2e8f0' },
  'git': { icon: GitBranch, color: '#f97316' },
  'typescript': { icon: FileCode, color: '#3178c6' },
  'vite': { icon: Zap, color: '#a855f7' },
  'webpack': { icon: Box, color: '#8dd6f9' },
  'eslint': { icon: Wrench, color: '#4b32c3' },
  'jest': { icon: TestTube, color: '#c21325' },
  'rtl': { icon: TestTube, color: '#e33332' },
  'cypress': { icon: TestTube, color: '#69d3a7' },
  'nodejs': { icon: Terminal, color: '#68a063' },
  'express': { icon: Server, color: '#e2e8f0' },
  'postgres': { icon: Database, color: '#336791' },
  'redis': { icon: Database, color: '#dc382d' },
  'jwt': { icon: Shield, color: '#d63aff' },
  'rest-api': { icon: Layers, color: '#22c55e' },
  'graphql': { icon: Layers, color: '#e10098' },
  'websockets': { icon: Zap, color: '#10b981' },
  'prisma': { icon: Database, color: '#5a67d8' },
  'mongodb': { icon: Database, color: '#00ed64' },
  'cors': { icon: Shield, color: '#ef4444' },
  'xss': { icon: Shield, color: '#f59e0b' },
  'owasp': { icon: Shield, color: '#ef4444' },
  'linux': { icon: Terminal, color: '#fcc624' },
  'aws': { icon: Cloud, color: '#ff9900' },
  'docker': { icon: Box, color: '#2496ed' },
  'github-actions': { icon: Rocket, color: '#2088ff' },
  'ansible': { icon: Wrench, color: '#ee0000' },
  'terraform': { icon: Cloud, color: '#7b42bc' },
  'nginx': { icon: Server, color: '#009639' },
  'monitoring': { icon: Gauge, color: '#362d59' },
  'vercel': { icon: Rocket, color: '#e2e8f0' },
  'railway': { icon: Rocket, color: '#a855f7' },
};

const sectionGradients: Record<string, { from: string; to: string; glow: string }> = {
  Internet:   { from: '#475569', to: '#64748b', glow: '100,116,139' },
  Frontend:   { from: '#2563eb', to: '#3b82f6', glow: '59,130,246' },
  Testing:    { from: '#0d9488', to: '#14b8a6', glow: '20,184,166' },
  Backend:    { from: '#16a34a', to: '#22c55e', glow: '34,197,94' },
  Security:   { from: '#dc2626', to: '#ef4444', glow: '239,68,68' },
  DevOps:     { from: '#d97706', to: '#f59e0b', glow: '245,158,11' },
  Deployment: { from: '#059669', to: '#10b981', glow: '16,185,129' },
};

const difficultyConfig = {
  Beginner:     { label: 'Beginner', bg: 'rgba(34,197,94,0.15)', text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  Intermediate: { label: 'Medium', bg: 'rgba(234,179,8,0.15)', text: '#fde047', border: 'rgba(234,179,8,0.3)' },
  Advanced:     { label: 'Advanced', bg: 'rgba(239,68,68,0.15)', text: '#fca5a5', border: 'rgba(239,68,68,0.3)' },
};

function RoadmapFlowNodeCard({ node, status, dimmed, onClick }: Props) {
  const isAlt = node.isAlternative;
  const gradient = sectionGradients[node.section] || sectionGradients.Frontend;
  const tech = techIcons[node.id];
  const TechIcon = tech?.icon || Code2;
  const techColor = tech?.color || gradient.to;
  const diff = difficultyConfig[node.difficulty];

  const isDone = status === 'done';
  const isIP = status === 'in-progress';
  const isSkipped = status === 'skipped';

  let bg: string, borderColor: string, textColor: string, shadow: string, borderStyle: string;
  if (isDone) {
    bg = 'rgba(34,197,94,0.10)';
    borderColor = '#22c55e';
    textColor = '#86efac';
    shadow = '0 0 24px rgba(34,197,94,0.2), inset 0 1px 0 rgba(255,255,255,0.05)';
    borderStyle = 'solid';
  } else if (isIP) {
    bg = 'rgba(234,179,8,0.10)';
    borderColor = '#eab308';
    textColor = '#fde047';
    shadow = '0 0 24px rgba(234,179,8,0.2), inset 0 1px 0 rgba(255,255,255,0.05)';
    borderStyle = 'solid';
  } else if (isSkipped) {
    bg = 'rgba(100,116,139,0.08)';
    borderColor = '#334155';
    textColor = '#94a3b8';
    shadow = 'none';
    borderStyle = 'solid';
  } else if (isAlt) {
    bg = 'rgba(139,92,246,0.06)';
    borderColor = '#6d28d9';
    textColor = '#c4b5fd';
    shadow = '0 0 20px rgba(139,92,246,0.08)';
    borderStyle = 'dashed';
  } else {
    bg = `rgba(${gradient.glow},0.06)`;
    borderColor = gradient.to;
    textColor = '#e2e8f0';
    shadow = `0 4px 20px rgba(0,0,0,0.3), 0 0 20px rgba(${gradient.glow},0.08)`;
    borderStyle = 'solid';
  }

  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col gap-1.5 rounded-xl cursor-pointer
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:brightness-110 active:translate-y-0 active:scale-[0.98]
        ${dimmed ? 'opacity-10 pointer-events-none' : ''}
      `}
      style={{
        background: bg,
        border: `1.5px ${borderStyle} ${borderColor}`,
        color: textColor,
        boxShadow: shadow,
        width: 190,
        backdropFilter: 'blur(12px)',
        padding: '10px 14px',
      }}
    >
      {/* Gradient top accent */}
      {!isDone && !isIP && !isSkipped && (
        <div
          className="absolute top-0 left-3 right-3 h-[2px] rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${borderColor}, transparent)`,
            opacity: 0.6,
          }}
        />
      )}

      {/* Hover glow ring */}
      <div
        className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${borderColor}22, transparent, ${borderColor}11)`,
        }}
      />

      {/* Top row: Icon + Title + Status */}
      <div className="flex items-center gap-2 w-full">
        {/* Tech icon */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `${techColor}18`,
            border: `1px solid ${techColor}30`,
          }}
        >
          {isDone ? (
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
          ) : isIP ? (
            <Clock className="w-3.5 h-3.5" style={{ color: '#facc15' }} />
          ) : isSkipped ? (
            <SkipForward className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
          ) : (
            <TechIcon className="w-3.5 h-3.5" style={{ color: techColor }} />
          )}
        </div>

        <span className="text-[13px] font-bold truncate leading-tight flex-1 text-left">
          {node.title}
        </span>
      </div>

      {/* Bottom row: Tags */}
      <div className="flex items-center gap-1.5 pl-9">
        {/* Difficulty tag */}
        <span
          className="text-[9px] font-semibold px-1.5 py-[1px] rounded-full leading-tight"
          style={{
            background: diff.bg,
            color: diff.text,
            border: `1px solid ${diff.border}`,
          }}
        >
          {diff.label}
        </span>

        {/* Section tag */}
        <span
          className="text-[9px] font-medium px-1.5 py-[1px] rounded-full leading-tight"
          style={{
            background: `rgba(${gradient.glow},0.1)`,
            color: `rgba(${gradient.glow.split(',').map(() => '200').join(',')},0.8)`,
            border: `1px solid rgba(${gradient.glow},0.15)`,
          }}
        >
          {node.section}
        </span>

        {/* Alternative badge */}
        {isAlt && (
          <span className="text-[9px] font-medium px-1.5 py-[1px] rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
            Alt
          </span>
        )}
      </div>
    </button>
  );
}

export default memo(RoadmapFlowNodeCard);
