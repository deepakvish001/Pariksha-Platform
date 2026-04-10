import { memo, useState } from 'react';
import {
  CheckCircle2, Clock, SkipForward, Globe, Shield, Server,
  Code2, FileCode, Palette, Box, GitBranch, Terminal, Database,
  Lock, Cloud, Gauge, Rocket, TestTube, Wrench, Zap, Layers,
  Timer, BookOpen, ArrowRight, Star, Sparkles, ExternalLink,
  CircleDot, Flame, Award,
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

const techIcons: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  'internet-how': { icon: Globe, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  'http-https': { icon: Lock, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  'dns': { icon: Server, color: '#67e8f9', bg: 'rgba(103,232,249,0.12)' },
  'browsers': { icon: Globe, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  'html': { icon: FileCode, color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  'css': { icon: Palette, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  'javascript': { icon: Zap, color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  'npm': { icon: Box, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  'react': { icon: Code2, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  'tailwind': { icon: Palette, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  'github': { icon: GitBranch, color: '#e2e8f0', bg: 'rgba(226,232,240,0.08)' },
  'git': { icon: GitBranch, color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  'typescript': { icon: FileCode, color: '#3178c6', bg: 'rgba(49,120,198,0.12)' },
  'vite': { icon: Zap, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  'webpack': { icon: Box, color: '#8dd6f9', bg: 'rgba(141,214,249,0.12)' },
  'eslint': { icon: Wrench, color: '#4b32c3', bg: 'rgba(75,50,195,0.12)' },
  'jest': { icon: TestTube, color: '#c21325', bg: 'rgba(194,19,37,0.12)' },
  'rtl': { icon: TestTube, color: '#e33332', bg: 'rgba(227,51,50,0.12)' },
  'cypress': { icon: TestTube, color: '#69d3a7', bg: 'rgba(105,211,167,0.12)' },
  'nodejs': { icon: Terminal, color: '#68a063', bg: 'rgba(104,160,99,0.12)' },
  'express': { icon: Server, color: '#e2e8f0', bg: 'rgba(226,232,240,0.08)' },
  'postgres': { icon: Database, color: '#336791', bg: 'rgba(51,103,145,0.12)' },
  'redis': { icon: Database, color: '#dc382d', bg: 'rgba(220,56,45,0.12)' },
  'jwt': { icon: Shield, color: '#d63aff', bg: 'rgba(214,58,255,0.12)' },
  'rest-api': { icon: Layers, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  'graphql': { icon: Layers, color: '#e10098', bg: 'rgba(225,0,152,0.12)' },
  'websockets': { icon: Zap, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'prisma': { icon: Database, color: '#5a67d8', bg: 'rgba(90,103,216,0.12)' },
  'mongodb': { icon: Database, color: '#00ed64', bg: 'rgba(0,237,100,0.12)' },
  'cors': { icon: Shield, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  'xss': { icon: Shield, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'owasp': { icon: Shield, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  'linux': { icon: Terminal, color: '#fcc624', bg: 'rgba(252,198,36,0.12)' },
  'aws': { icon: Cloud, color: '#ff9900', bg: 'rgba(255,153,0,0.12)' },
  'docker': { icon: Box, color: '#2496ed', bg: 'rgba(36,150,237,0.12)' },
  'github-actions': { icon: Rocket, color: '#2088ff', bg: 'rgba(32,136,255,0.12)' },
  'ansible': { icon: Wrench, color: '#ee0000', bg: 'rgba(238,0,0,0.12)' },
  'terraform': { icon: Cloud, color: '#7b42bc', bg: 'rgba(123,66,188,0.12)' },
  'nginx': { icon: Server, color: '#009639', bg: 'rgba(0,150,57,0.12)' },
  'monitoring': { icon: Gauge, color: '#362d59', bg: 'rgba(54,45,89,0.15)' },
  'vercel': { icon: Rocket, color: '#e2e8f0', bg: 'rgba(226,232,240,0.08)' },
  'railway': { icon: Rocket, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
};

const sectionGradients: Record<string, { from: string; to: string; glow: string; accent: string }> = {
  Internet:   { from: '#475569', to: '#64748b', glow: '100,116,139', accent: '#94a3b8' },
  Frontend:   { from: '#2563eb', to: '#3b82f6', glow: '59,130,246', accent: '#60a5fa' },
  Testing:    { from: '#0d9488', to: '#14b8a6', glow: '20,184,166', accent: '#2dd4bf' },
  Backend:    { from: '#16a34a', to: '#22c55e', glow: '34,197,94', accent: '#4ade80' },
  Security:   { from: '#dc2626', to: '#ef4444', glow: '239,68,68', accent: '#f87171' },
  DevOps:     { from: '#d97706', to: '#f59e0b', glow: '245,158,11', accent: '#fbbf24' },
  Deployment: { from: '#059669', to: '#10b981', glow: '16,185,129', accent: '#34d399' },
};

const difficultyConfig = {
  Beginner:     { label: 'Beginner', bg: 'rgba(34,197,94,0.10)', text: '#4ade80', border: 'rgba(34,197,94,0.25)', dot: '#22c55e' },
  Intermediate: { label: 'Intermediate', bg: 'rgba(234,179,8,0.10)', text: '#fde047', border: 'rgba(234,179,8,0.25)', dot: '#eab308' },
  Advanced:     { label: 'Advanced', bg: 'rgba(239,68,68,0.10)', text: '#fca5a5', border: 'rgba(239,68,68,0.25)', dot: '#ef4444' },
};

function RoadmapFlowNodeCard({ node, status, dimmed, isRecommended, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const isAlt = node.isAlternative;
  const gradient = sectionGradients[node.section] || sectionGradients.Frontend;
  const tech = techIcons[node.id];
  const TechIcon = tech?.icon || Code2;
  const techColor = tech?.color || gradient.to;
  const techBg = tech?.bg || `rgba(${gradient.glow},0.12)`;
  const diff = difficultyConfig[node.difficulty];
  const resourceCount = node.resources.length;
  const prereqCount = node.prerequisites?.length || 0;

  const isDone = status === 'done';
  const isIP = status === 'in-progress';
  const isSkipped = status === 'skipped';

  let cardBg: string, borderColor: string, textColor: string, statusGlow: string, borderStyle: string;
  if (isDone) {
    cardBg = 'linear-gradient(145deg, rgba(34,197,94,0.14) 0%, rgba(16,185,129,0.06) 50%, rgba(6,78,40,0.04) 100%)';
    borderColor = 'rgba(34,197,94,0.5)';
    textColor = '#a7f3d0';
    statusGlow = '34,197,94';
    borderStyle = 'solid';
  } else if (isIP) {
    cardBg = 'linear-gradient(145deg, rgba(234,179,8,0.14) 0%, rgba(245,158,11,0.06) 50%, rgba(120,80,0,0.04) 100%)';
    borderColor = 'rgba(234,179,8,0.5)';
    textColor = '#fef08a';
    statusGlow = '234,179,8';
    borderStyle = 'solid';
  } else if (isSkipped) {
    cardBg = 'linear-gradient(145deg, rgba(100,116,139,0.06) 0%, rgba(71,85,105,0.03) 100%)';
    borderColor = 'rgba(51,65,85,0.4)';
    textColor = '#94a3b8';
    statusGlow = '100,116,139';
    borderStyle = 'solid';
  } else if (isAlt) {
    cardBg = 'linear-gradient(145deg, rgba(139,92,246,0.08) 0%, rgba(168,85,247,0.04) 100%)';
    borderColor = 'rgba(109,40,217,0.35)';
    textColor = '#c4b5fd';
    statusGlow = '139,92,246';
    borderStyle = 'dashed';
  } else {
    cardBg = `linear-gradient(145deg, rgba(${gradient.glow},0.10) 0%, rgba(${gradient.glow},0.04) 50%, rgba(15,23,42,0.6) 100%)`;
    borderColor = `rgba(${gradient.glow},0.25)`;
    textColor = '#e2e8f0';
    statusGlow = gradient.glow;
    borderStyle = 'solid';
  }

  const descPreview = node.description.length > 55 ? node.description.slice(0, 55) + '…' : node.description;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        group relative flex flex-col rounded-2xl cursor-pointer text-left
        transition-all duration-300 ease-out
        hover:-translate-y-1.5 active:translate-y-0 active:scale-[0.98]
        ${dimmed ? 'opacity-[0.06] pointer-events-none' : ''}
      `}
      style={{
        background: cardBg,
        border: `1.5px ${borderStyle} ${borderColor}`,
        color: textColor,
        boxShadow: hovered
          ? `0 20px 60px rgba(0,0,0,0.5), 0 0 50px rgba(${statusGlow},0.15), inset 0 1px 0 rgba(255,255,255,0.08)`
          : `0 8px 36px rgba(0,0,0,0.35), 0 0 28px rgba(${statusGlow},0.06), inset 0 1px 0 rgba(255,255,255,0.04)`,
        width: 250,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '16px 18px 14px',
      }}
    >
      {/* Recommended badge */}
      {isRecommended && !isDone && !isIP && (
        <div
          className="absolute -top-3.5 -right-3 flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest z-20"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            color: '#1c1917',
            boxShadow: '0 4px 16px rgba(249,115,22,0.5), 0 0 24px rgba(249,115,22,0.25)',
          }}
        >
          <Star className="w-3 h-3 fill-current" />
          Up Next
        </div>
      )}

      {/* Completion ribbon for done */}
      {isDone && (
        <div className="absolute -top-1 -left-1 w-8 h-8 overflow-hidden z-20">
          <div
            className="absolute top-[6px] -left-[6px] w-12 h-4 rotate-[-45deg] flex items-center justify-center"
            style={{ background: 'linear-gradient(90deg, #16a34a, #22c55e)' }}
          >
            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
      )}

      {/* Top gradient accent line */}
      <div
        className="absolute top-0 left-4 right-4 h-[2px] rounded-full transition-opacity duration-300"
        style={{
          background: isDone
            ? 'linear-gradient(90deg, transparent, #22c55e, #4ade80, #22c55e, transparent)'
            : isIP
              ? 'linear-gradient(90deg, transparent, #eab308, #fde047, #eab308, transparent)'
              : `linear-gradient(90deg, transparent, ${gradient.accent}, transparent)`,
          opacity: hovered ? 1 : 0.4,
        }}
      />

      {/* Bottom gradient accent line */}
      <div
        className="absolute bottom-0 left-6 right-6 h-[1px] rounded-full transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${statusGlow},0.2), transparent)`,
          opacity: hovered ? 0.8 : 0,
        }}
      />

      {/* Animated border glow on hover */}
      <div
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-[-1]"
        style={{
          background: `linear-gradient(135deg, rgba(${statusGlow},0.15), transparent 40%, rgba(${statusGlow},0.08))`,
          filter: 'blur(3px)',
        }}
      />

      {/* Row 1: Icon + Title + Status */}
      <div className="flex items-start gap-3 w-full">
        {/* Tech icon */}
        <div className="relative shrink-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{
              background: isDone ? 'rgba(34,197,94,0.15)' : isIP ? 'rgba(234,179,8,0.15)' : techBg,
              border: `1.5px solid ${isDone ? 'rgba(34,197,94,0.35)' : isIP ? 'rgba(234,179,8,0.35)' : `${techColor}35`}`,
              boxShadow: `0 0 20px ${isDone ? 'rgba(34,197,94,0.12)' : isIP ? 'rgba(234,179,8,0.12)' : `${techColor}12`}`,
            }}
          >
            {isDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : isIP ? (
              <Clock className="w-5 h-5 text-yellow-300 animate-pulse" />
            ) : isSkipped ? (
              <SkipForward className="w-5 h-5 text-slate-400" />
            ) : (
              <TechIcon className="w-5 h-5" style={{ color: techColor }} />
            )}
          </div>
          {isIP && (
            <div className="absolute -inset-1.5 rounded-xl border-2 border-yellow-400/20 animate-ping" style={{ animationDuration: '2.5s' }} />
          )}
          {isDone && (
            <div className="absolute -inset-1 rounded-xl border border-emerald-400/15 animate-pulse" style={{ animationDuration: '3s' }} />
          )}
          {/* Difficulty dot on icon corner */}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{
              background: diff.dot,
              borderColor: 'rgba(15,23,42,0.9)',
              boxShadow: `0 0 6px ${diff.dot}60`,
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-bold leading-tight block truncate">{node.title}</span>
          {node.timeEstimate && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 mt-0.5">
              <Timer className="w-2.5 h-2.5" />
              {node.timeEstimate}
            </span>
          )}
        </div>

        {/* Status micro-icon */}
        <div className="shrink-0 mt-0.5">
          {isDone ? (
            <Award className="w-4 h-4 text-emerald-400/70" />
          ) : isIP ? (
            <Flame className="w-4 h-4 text-yellow-400/70 animate-pulse" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-all duration-200 group-hover:translate-x-0.5" />
          )}
        </div>
      </div>

      {/* Row 2: Description */}
      <p className="text-[10px] leading-[1.5] text-muted-foreground/45 mt-2.5 pl-[56px] pr-1 line-clamp-2">
        {descPreview}
      </p>

      {/* Row 3: Tags */}
      <div className="flex items-center gap-1.5 mt-2.5 pl-[56px] flex-wrap">
        {/* Difficulty badge */}
        <span
          className="text-[8px] font-bold px-2 py-[3px] rounded-md leading-tight tracking-wider uppercase"
          style={{ background: diff.bg, color: diff.text, border: `1px solid ${diff.border}` }}
        >
          {diff.label}
        </span>

        {/* Section badge */}
        <span
          className="text-[8px] font-semibold px-2 py-[3px] rounded-md leading-tight"
          style={{
            background: `rgba(${gradient.glow},0.08)`,
            color: gradient.accent,
            border: `1px solid rgba(${gradient.glow},0.15)`,
          }}
        >
          {node.section}
        </span>

        {isAlt && (
          <span className="text-[8px] font-bold px-2 py-[3px] rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase tracking-wider">
            Alt
          </span>
        )}

        {prereqCount > 0 && (
          <span className="text-[8px] font-semibold px-2 py-[3px] rounded-md bg-sky-500/8 text-sky-300/70 border border-sky-500/15">
            {prereqCount} prereq
          </span>
        )}
      </div>

      {/* Row 4: Bottom meta */}
      <div className="flex items-center justify-between mt-2.5 pl-[56px] pr-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground/45">
            <BookOpen className="w-2.5 h-2.5" />
            {resourceCount} resources
          </span>
        </div>

        {/* Status line indicator */}
        <div className="flex items-center gap-1">
          <div
            className="w-6 h-1 rounded-full transition-colors duration-300"
            style={{
              background: isDone ? '#22c55e' : isIP ? '#eab308' : isSkipped ? '#64748b' : `rgba(${gradient.glow},0.15)`,
              boxShadow: isDone ? '0 0 8px rgba(34,197,94,0.4)' : isIP ? '0 0 8px rgba(234,179,8,0.4)' : 'none',
            }}
          />
          <CircleDot
            className="w-2.5 h-2.5 transition-colors duration-300"
            style={{
              color: isDone ? '#22c55e' : isIP ? '#eab308' : isSkipped ? '#64748b' : `rgba(${gradient.glow},0.2)`,
            }}
          />
        </div>
      </div>

      {/* Hover tooltip */}
      {hovered && !dimmed && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-[52px] z-50 px-4 py-2 rounded-xl text-[10px] leading-[1.4] max-w-[230px] text-center pointer-events-none"
          style={{
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(148,163,184,0.12)',
            color: '#94a3b8',
            boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
          }}
        >
          Click to view details & resources
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style={{ background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(148,163,184,0.12)', borderLeft: '1px solid rgba(148,163,184,0.12)' }} />
        </div>
      )}
    </button>
  );
}

export default memo(RoadmapFlowNodeCard);
