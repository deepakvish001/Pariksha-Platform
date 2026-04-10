import { memo, useState } from 'react';
import {
  CheckCircle2, Clock, SkipForward, Globe, Shield, Server,
  Code2, FileCode, Palette, Box, GitBranch, Terminal, Database,
  Lock, Cloud, Gauge, Rocket, TestTube, Wrench, Zap, Layers,
  Timer, BookOpen, ArrowRight, Star,
  type LucideIcon,
} from 'lucide-react';
import type { RoadmapNodeData, NodeStatus } from '@/data/fullStackRoadmapData';

interface Props {
  node: RoadmapNodeData;
  status: NodeStatus;
  dimmed: boolean;
  isRecommended?: boolean;
  onClick: () => void;
}

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
  Beginner:     { label: 'Beginner', bg: 'rgba(34,197,94,0.12)', text: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  Intermediate: { label: 'Medium', bg: 'rgba(234,179,8,0.12)', text: '#fde047', border: 'rgba(234,179,8,0.25)' },
  Advanced:     { label: 'Advanced', bg: 'rgba(239,68,68,0.12)', text: '#fca5a5', border: 'rgba(239,68,68,0.25)' },
};

function RoadmapFlowNodeCard({ node, status, dimmed, isRecommended, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const isAlt = node.isAlternative;
  const gradient = sectionGradients[node.section] || sectionGradients.Frontend;
  const tech = techIcons[node.id];
  const TechIcon = tech?.icon || Code2;
  const techColor = tech?.color || gradient.to;
  const diff = difficultyConfig[node.difficulty];
  const resourceCount = node.resources.length;
  const prereqCount = node.prerequisites?.length || 0;

  const isDone = status === 'done';
  const isIP = status === 'in-progress';
  const isSkipped = status === 'skipped';

  let bg: string, borderColor: string, textColor: string, shadow: string, borderStyle: string;
  if (isDone) {
    bg = 'linear-gradient(135deg, rgba(34,197,94,0.14), rgba(34,197,94,0.06))';
    borderColor = '#22c55e';
    textColor = '#86efac';
    shadow = '0 0 32px rgba(34,197,94,0.2), 0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)';
    borderStyle = 'solid';
  } else if (isIP) {
    bg = 'linear-gradient(135deg, rgba(234,179,8,0.14), rgba(234,179,8,0.06))';
    borderColor = '#eab308';
    textColor = '#fde047';
    shadow = '0 0 32px rgba(234,179,8,0.2), 0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)';
    borderStyle = 'solid';
  } else if (isSkipped) {
    bg = 'linear-gradient(135deg, rgba(100,116,139,0.08), rgba(100,116,139,0.03))';
    borderColor = '#334155';
    textColor = '#94a3b8';
    shadow = '0 4px 12px rgba(0,0,0,0.15)';
    borderStyle = 'solid';
  } else if (isAlt) {
    bg = 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.03))';
    borderColor = '#6d28d9';
    textColor = '#c4b5fd';
    shadow = '0 0 20px rgba(139,92,246,0.1), 0 8px 24px rgba(0,0,0,0.2)';
    borderStyle = 'dashed';
  } else {
    bg = `linear-gradient(135deg, rgba(${gradient.glow},0.10), rgba(${gradient.glow},0.03))`;
    borderColor = gradient.to;
    textColor = '#e2e8f0';
    shadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 24px rgba(${gradient.glow},0.08), inset 0 1px 0 rgba(255,255,255,0.04)`;
    borderStyle = 'solid';
  }

  // Truncate description for preview
  const descPreview = node.description.length > 55 ? node.description.slice(0, 55) + '…' : node.description;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        group relative flex flex-col gap-1.5 rounded-xl cursor-pointer text-left
        transition-all duration-300 ease-out
        hover:-translate-y-2 hover:brightness-110 active:translate-y-0 active:scale-[0.98]
        ${dimmed ? 'opacity-10 pointer-events-none' : ''}
      `}
      style={{
        background: bg,
        border: `1.5px ${borderStyle} ${borderColor}`,
        color: textColor,
        boxShadow: hovered
          ? `0 12px 40px rgba(0,0,0,0.4), 0 0 36px rgba(${gradient.glow},0.15)`
          : shadow,
        width: 220,
        backdropFilter: 'blur(16px)',
        padding: '12px 14px 10px',
      }}
    >
      {/* Recommended badge */}
      {isRecommended && !isDone && !isIP && (
        <div
          className="absolute -top-2.5 -right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider z-20"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            color: '#1e1b4b',
            boxShadow: '0 2px 8px rgba(249,115,22,0.4)',
          }}
        >
          <Star className="w-2.5 h-2.5" />
          Next
        </div>
      )}

      {/* Gradient top accent line */}
      {!isDone && !isIP && !isSkipped && (
        <div
          className="absolute top-0 left-3 right-3 h-[2px] rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${borderColor}, transparent)`,
            opacity: 0.5,
          }}
        />
      )}

      {/* Status completion bar at top */}
      {(isDone || isIP) && (
        <div
          className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
          style={{
            background: isDone
              ? 'linear-gradient(90deg, #22c55e, #4ade80, #22c55e)'
              : 'linear-gradient(90deg, #eab308, #fde047, #eab308)',
          }}
        />
      )}

      {/* Hover glow overlay */}
      <div
        className="absolute -inset-[2px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${borderColor}20, transparent 60%, ${borderColor}10)`,
          filter: 'blur(1px)',
        }}
      />

      {/* Row 1: Icon + Title */}
      <div className="flex items-center gap-2.5 w-full">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{
            background: `linear-gradient(135deg, ${techColor}22, ${techColor}08)`,
            border: `1px solid ${techColor}35`,
            boxShadow: `0 0 14px ${techColor}15`,
          }}
        >
          {isDone ? (
            <CheckCircle2 className="w-4.5 h-4.5" style={{ color: '#4ade80' }} />
          ) : isIP ? (
            <Clock className="w-4.5 h-4.5 animate-pulse" style={{ color: '#facc15' }} />
          ) : isSkipped ? (
            <SkipForward className="w-4.5 h-4.5" style={{ color: '#94a3b8' }} />
          ) : (
            <TechIcon className="w-4.5 h-4.5" style={{ color: techColor }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-bold truncate leading-tight block">
            {node.title}
          </span>
        </div>

        {/* Click indicator */}
        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
      </div>

      {/* Row 2: Description preview */}
      <p className="text-[10px] leading-[1.4] text-muted-foreground/50 pl-[46px] pr-1 line-clamp-2">
        {descPreview}
      </p>

      {/* Row 3: Tags */}
      <div className="flex items-center gap-1 pl-[46px] flex-wrap">
        <span
          className="text-[8px] font-bold px-1.5 py-[2px] rounded-md leading-tight uppercase tracking-wider"
          style={{
            background: diff.bg,
            color: diff.text,
            border: `1px solid ${diff.border}`,
          }}
        >
          {diff.label}
        </span>

        <span
          className="text-[8px] font-semibold px-1.5 py-[2px] rounded-md leading-tight"
          style={{
            background: `rgba(${gradient.glow},0.08)`,
            color: textColor,
            border: `1px solid rgba(${gradient.glow},0.12)`,
            opacity: 0.7,
          }}
        >
          {node.section}
        </span>

        {isAlt && (
          <span className="text-[8px] font-bold px-1.5 py-[2px] rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase tracking-wider">
            Alt
          </span>
        )}

        {prereqCount > 0 && (
          <span className="text-[8px] font-semibold px-1.5 py-[2px] rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20">
            {prereqCount} prereq
          </span>
        )}
      </div>

      {/* Row 4: Time + Resources */}
      <div className="flex items-center gap-3 pl-[46px] mt-0.5">
        {node.timeEstimate && (
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
            <Timer className="w-2.5 h-2.5" />
            {node.timeEstimate}
          </span>
        )}
        <span className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
          <BookOpen className="w-2.5 h-2.5" />
          {resourceCount} resources
        </span>
      </div>

      {/* Hover tooltip with full description */}
      {hovered && !dimmed && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-[52px] z-50 px-3 py-2 rounded-lg text-[10px] leading-[1.4] max-w-[240px] text-center pointer-events-none"
          style={{
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(148,163,184,0.15)',
            color: '#cbd5e1',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(12px)',
          }}
        >
          Click to view details & resources
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style={{ background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(148,163,184,0.15)', borderLeft: '1px solid rgba(148,163,184,0.15)' }} />
        </div>
      )}
    </button>
  );
}

export default memo(RoadmapFlowNodeCard);
