import { memo, useState } from 'react';
import {
  CheckCircle2, Clock, SkipForward, Globe, Shield, Server,
  Code2, FileCode, Palette, Box, GitBranch, Terminal, Database,
  Lock, Cloud, Gauge, Rocket, TestTube, Wrench, Zap, Layers,
  Timer, BookOpen, ArrowRight, Star, Sparkles,
  CircleDot, Flame, Award, TrendingUp, Eye,
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
  'internet-how': { icon: Globe, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  'http-https': { icon: Lock, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  'dns': { icon: Server, color: '#67e8f9', bg: 'rgba(103,232,249,0.15)' },
  'browsers': { icon: Globe, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  'html': { icon: FileCode, color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  'css': { icon: Palette, color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' },
  'javascript': { icon: Zap, color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  'npm': { icon: Box, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  'react': { icon: Code2, color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  'tailwind': { icon: Palette, color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  'github': { icon: GitBranch, color: '#e2e8f0', bg: 'rgba(226,232,240,0.10)' },
  'git': { icon: GitBranch, color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  'typescript': { icon: FileCode, color: '#3178c6', bg: 'rgba(49,120,198,0.15)' },
  'vite': { icon: Zap, color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  'webpack': { icon: Box, color: '#8dd6f9', bg: 'rgba(141,214,249,0.15)' },
  'eslint': { icon: Wrench, color: '#4b32c3', bg: 'rgba(75,50,195,0.15)' },
  'jest': { icon: TestTube, color: '#c21325', bg: 'rgba(194,19,37,0.15)' },
  'rtl': { icon: TestTube, color: '#e33332', bg: 'rgba(227,51,50,0.15)' },
  'cypress': { icon: TestTube, color: '#69d3a7', bg: 'rgba(105,211,167,0.15)' },
  'nodejs': { icon: Terminal, color: '#68a063', bg: 'rgba(104,160,99,0.15)' },
  'express': { icon: Server, color: '#e2e8f0', bg: 'rgba(226,232,240,0.10)' },
  'postgres': { icon: Database, color: '#336791', bg: 'rgba(51,103,145,0.15)' },
  'redis': { icon: Database, color: '#dc382d', bg: 'rgba(220,56,45,0.15)' },
  'jwt': { icon: Shield, color: '#d63aff', bg: 'rgba(214,58,255,0.15)' },
  'rest-api': { icon: Layers, color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  'graphql': { icon: Layers, color: '#e10098', bg: 'rgba(225,0,152,0.15)' },
  'websockets': { icon: Zap, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  'prisma': { icon: Database, color: '#5a67d8', bg: 'rgba(90,103,216,0.15)' },
  'mongodb': { icon: Database, color: '#00ed64', bg: 'rgba(0,237,100,0.15)' },
  'cors': { icon: Shield, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  'xss': { icon: Shield, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  'owasp': { icon: Shield, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  'linux': { icon: Terminal, color: '#fcc624', bg: 'rgba(252,198,36,0.15)' },
  'aws': { icon: Cloud, color: '#ff9900', bg: 'rgba(255,153,0,0.15)' },
  'docker': { icon: Box, color: '#2496ed', bg: 'rgba(36,150,237,0.15)' },
  'github-actions': { icon: Rocket, color: '#2088ff', bg: 'rgba(32,136,255,0.15)' },
  'ansible': { icon: Wrench, color: '#ee0000', bg: 'rgba(238,0,0,0.15)' },
  'terraform': { icon: Cloud, color: '#7b42bc', bg: 'rgba(123,66,188,0.15)' },
  'nginx': { icon: Server, color: '#009639', bg: 'rgba(0,150,57,0.15)' },
  'monitoring': { icon: Gauge, color: '#362d59', bg: 'rgba(54,45,89,0.18)' },
  'vercel': { icon: Rocket, color: '#e2e8f0', bg: 'rgba(226,232,240,0.10)' },
  'railway': { icon: Rocket, color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
};

const sectionGradients: Record<string, { from: string; to: string; glow: string; accent: string; ring: string }> = {
  Internet:   { from: '#475569', to: '#64748b', glow: '100,116,139', accent: '#94a3b8', ring: '#64748b' },
  Frontend:   { from: '#2563eb', to: '#3b82f6', glow: '59,130,246', accent: '#60a5fa', ring: '#3b82f6' },
  Testing:    { from: '#0d9488', to: '#14b8a6', glow: '20,184,166', accent: '#2dd4bf', ring: '#14b8a6' },
  Backend:    { from: '#16a34a', to: '#22c55e', glow: '34,197,94', accent: '#4ade80', ring: '#22c55e' },
  Security:   { from: '#dc2626', to: '#ef4444', glow: '239,68,68', accent: '#f87171', ring: '#ef4444' },
  DevOps:     { from: '#d97706', to: '#f59e0b', glow: '245,158,11', accent: '#fbbf24', ring: '#f59e0b' },
  Deployment: { from: '#059669', to: '#10b981', glow: '16,185,129', accent: '#34d399', ring: '#10b981' },
};

const difficultyConfig: Record<string, { label: string; bg: string; text: string; border: string; dot: string; icon: LucideIcon }> = {
  Beginner:     { label: 'Beginner', bg: 'rgba(34,197,94,0.12)', text: '#4ade80', border: 'rgba(34,197,94,0.30)', dot: '#22c55e', icon: TrendingUp },
  Intermediate: { label: 'Intermediate', bg: 'rgba(234,179,8,0.12)', text: '#fde047', border: 'rgba(234,179,8,0.30)', dot: '#eab308', icon: Flame },
  Advanced:     { label: 'Advanced', bg: 'rgba(239,68,68,0.12)', text: '#fca5a5', border: 'rgba(239,68,68,0.30)', dot: '#ef4444', icon: Sparkles },
};

const xpByDifficulty: Record<string, number> = {
  Beginner: 10,
  Intermediate: 25,
  Advanced: 50,
};

function RoadmapFlowNodeCard({ node, status, dimmed, isRecommended, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const isAlt = node.isAlternative;
  const gradient = sectionGradients[node.section] || sectionGradients.Frontend;
  const tech = techIcons[node.id];
  const TechIcon = tech?.icon || Code2;
  const techColor = tech?.color || gradient.to;
  const techBg = tech?.bg || `rgba(${gradient.glow},0.15)`;
  const diff = difficultyConfig[node.difficulty] || difficultyConfig.Beginner;
  const DiffIcon = diff.icon;
  const resourceCount = node.resources.length;
  const prereqCount = node.prerequisites?.length || 0;
  const xp = xpByDifficulty[node.difficulty] || 10;

  const isDone = status === 'done';
  const isIP = status === 'in-progress';
  const isSkipped = status === 'skipped';

  let cardBg: string, borderColor: string, textColor: string, statusGlow: string, borderStyle: string;
  if (isDone) {
    cardBg = 'linear-gradient(145deg, rgba(34,197,94,0.16) 0%, rgba(16,185,129,0.08) 40%, rgba(6,78,40,0.04) 100%)';
    borderColor = 'rgba(34,197,94,0.55)';
    textColor = '#a7f3d0';
    statusGlow = '34,197,94';
    borderStyle = 'solid';
  } else if (isIP) {
    cardBg = 'linear-gradient(145deg, rgba(234,179,8,0.16) 0%, rgba(245,158,11,0.08) 40%, rgba(120,80,0,0.04) 100%)';
    borderColor = 'rgba(234,179,8,0.55)';
    textColor = '#fef08a';
    statusGlow = '234,179,8';
    borderStyle = 'solid';
  } else if (isSkipped) {
    cardBg = 'linear-gradient(145deg, rgba(100,116,139,0.08) 0%, rgba(71,85,105,0.04) 100%)';
    borderColor = 'rgba(51,65,85,0.4)';
    textColor = '#94a3b8';
    statusGlow = '100,116,139';
    borderStyle = 'solid';
  } else if (isAlt) {
    cardBg = 'linear-gradient(145deg, rgba(139,92,246,0.10) 0%, rgba(168,85,247,0.05) 100%)';
    borderColor = 'rgba(109,40,217,0.40)';
    textColor = '#c4b5fd';
    statusGlow = '139,92,246';
    borderStyle = 'dashed';
  } else {
    cardBg = `linear-gradient(145deg, rgba(${gradient.glow},0.12) 0%, rgba(${gradient.glow},0.05) 40%, rgba(15,23,42,0.65) 100%)`;
    borderColor = `rgba(${gradient.glow},0.30)`;
    textColor = '#e2e8f0';
    statusGlow = gradient.glow;
    borderStyle = 'solid';
  }

  const descPreview = node.description.length > 60 ? node.description.slice(0, 60) + '…' : node.description;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        group relative flex flex-col rounded-2xl cursor-pointer text-left
        transition-all duration-300 ease-out
        hover:-translate-y-2 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98]
        ${dimmed ? 'opacity-[0.06] pointer-events-none' : ''}
      `}
      style={{
        background: cardBg,
        border: `1.5px ${borderStyle} ${borderColor}`,
        color: textColor,
        boxShadow: hovered
          ? `0 24px 64px rgba(0,0,0,0.55), 0 0 60px rgba(${statusGlow},0.18), inset 0 1px 0 rgba(255,255,255,0.10)`
          : `0 10px 40px rgba(0,0,0,0.35), 0 0 30px rgba(${statusGlow},0.07), inset 0 1px 0 rgba(255,255,255,0.05)`,
        width: 260,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: '18px 20px 16px',
      }}
    >
      {/* Animated rotating border gradient on hover */}
      <div
        className="absolute -inset-[2px] rounded-2xl transition-opacity duration-500 pointer-events-none z-[-1]"
        style={{
          background: hovered
            ? `conic-gradient(from 0deg, rgba(${statusGlow},0.25), transparent 60%, rgba(${statusGlow},0.15), transparent)`
            : 'none',
          opacity: hovered ? 1 : 0,
          filter: 'blur(4px)',
          animation: hovered ? 'spin 4s linear infinite' : 'none',
        }}
      />

      {/* Recommended badge with pulse */}
      {isRecommended && !isDone && !isIP && (
        <div className="absolute -top-3.5 -right-3 z-20">
          <div
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #f97316, #ef4444)',
              color: '#1c1917',
              boxShadow: '0 4px 20px rgba(249,115,22,0.55), 0 0 30px rgba(249,115,22,0.3)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            <Star className="w-3 h-3 fill-current" />
            Up Next
          </div>
        </div>
      )}

      {/* Done corner badge */}
      {isDone && (
        <div className="absolute -top-2 -left-2 z-20">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              boxShadow: '0 4px 16px rgba(34,197,94,0.5)',
            }}
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Top gradient accent line */}
      <div
        className="absolute top-0 left-3 right-3 h-[2px] rounded-full transition-all duration-300"
        style={{
          background: isDone
            ? 'linear-gradient(90deg, transparent, #22c55e, #4ade80, #22c55e, transparent)'
            : isIP
              ? 'linear-gradient(90deg, transparent, #eab308, #fde047, #eab308, transparent)'
              : `linear-gradient(90deg, transparent, ${gradient.accent}, transparent)`,
          opacity: hovered ? 1 : 0.5,
          transform: hovered ? 'scaleX(1.05)' : 'scaleX(1)',
        }}
      />

      {/* Corner decorative dots */}
      <div className="absolute top-2.5 right-2.5 flex gap-[3px] opacity-30">
        <div className="w-1 h-1 rounded-full" style={{ background: gradient.accent }} />
        <div className="w-1 h-1 rounded-full" style={{ background: gradient.accent, opacity: 0.6 }} />
        <div className="w-1 h-1 rounded-full" style={{ background: gradient.accent, opacity: 0.3 }} />
      </div>

      {/* Row 1: Icon + Title + XP */}
      <div className="flex items-start gap-3 w-full">
        {/* Tech icon with ring */}
        <div className="relative shrink-0">
          {/* Outer ring */}
          <svg className="absolute -inset-1.5 w-[52px] h-[52px] pointer-events-none" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="24" fill="none" stroke={isDone ? '#22c55e' : isIP ? '#eab308' : gradient.ring}
              strokeWidth="1" opacity={hovered ? 0.4 : 0.15} strokeDasharray="4 4"
              style={{ animation: hovered ? 'spin 8s linear infinite' : 'none' }}
            />
            {/* Orbiting dot */}
            {(isDone || isIP || hovered) && (
              <circle r="2" fill={isDone ? '#4ade80' : isIP ? '#fde047' : gradient.accent} opacity="0.7">
                <animateMotion dur="3s" repeatCount="indefinite" path="M 26 2 A 24 24 0 1 1 25.99 2" />
              </circle>
            )}
          </svg>

          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
            style={{
              background: isDone
                ? 'linear-gradient(135deg, rgba(34,197,94,0.20), rgba(16,185,129,0.10))'
                : isIP
                  ? 'linear-gradient(135deg, rgba(234,179,8,0.20), rgba(245,158,11,0.10))'
                  : `linear-gradient(135deg, ${techBg}, ${techBg.replace('0.15', '0.08')})`,
              border: `1.5px solid ${isDone ? 'rgba(34,197,94,0.40)' : isIP ? 'rgba(234,179,8,0.40)' : `${techColor}40`}`,
              boxShadow: `0 0 24px ${isDone ? 'rgba(34,197,94,0.15)' : isIP ? 'rgba(234,179,8,0.15)' : `${techColor}15`}`,
            }}
          >
            {isDone ? (
              <CheckCircle2 className="w-5.5 h-5.5 text-emerald-400" />
            ) : isIP ? (
              <Clock className="w-5.5 h-5.5 text-yellow-300 animate-pulse" />
            ) : isSkipped ? (
              <SkipForward className="w-5.5 h-5.5 text-slate-400" />
            ) : (
              <TechIcon className="w-5.5 h-5.5" style={{ color: techColor }} />
            )}
          </div>

          {isIP && (
            <div className="absolute -inset-2 rounded-xl border-2 border-yellow-400/20 animate-ping" style={{ animationDuration: '2.5s' }} />
          )}

          {/* Difficulty dot on icon corner */}
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
            style={{
              background: diff.dot,
              borderColor: 'rgba(15,23,42,0.9)',
              boxShadow: `0 0 8px ${diff.dot}70`,
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-extrabold leading-tight block truncate tracking-tight">{node.title}</span>
          <div className="flex items-center gap-2 mt-1">
            {node.timeEstimate && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/55">
                <Timer className="w-2.5 h-2.5" />
                {node.timeEstimate}
              </span>
            )}
            {/* XP badge */}
            <span
              className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-[1px] rounded"
              style={{
                background: isDone ? 'rgba(34,197,94,0.15)' : `rgba(${gradient.glow},0.10)`,
                color: isDone ? '#4ade80' : gradient.accent,
                border: `1px solid ${isDone ? 'rgba(34,197,94,0.25)' : `rgba(${gradient.glow},0.15)`}`,
              }}
            >
              <Sparkles className="w-2 h-2" />
              {isDone ? `+${xp}` : xp} XP
            </span>
          </div>
        </div>

        {/* Status micro-icon */}
        <div className="shrink-0 mt-0.5">
          {isDone ? (
            <Award className="w-4.5 h-4.5 text-emerald-400/80" />
          ) : isIP ? (
            <Flame className="w-4.5 h-4.5 text-yellow-400/80 animate-pulse" />
          ) : (
            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-all duration-200" />
          )}
        </div>
      </div>

      {/* Row 2: Description */}
      <p className="text-[10px] leading-[1.6] text-muted-foreground/50 mt-2.5 pl-[60px] pr-1 line-clamp-2">
        {descPreview}
      </p>

      {/* Row 3: Tags */}
      <div className="flex items-center gap-1.5 mt-3 pl-[60px] flex-wrap">
        {/* Difficulty badge with icon */}
        <span
          className="flex items-center gap-1 text-[8px] font-bold px-2 py-[3px] rounded-md leading-tight tracking-wider uppercase"
          style={{ background: diff.bg, color: diff.text, border: `1px solid ${diff.border}` }}
        >
          <DiffIcon className="w-2 h-2" />
          {diff.label}
        </span>

        {/* Section badge */}
        <span
          className="text-[8px] font-semibold px-2 py-[3px] rounded-md leading-tight"
          style={{
            background: `rgba(${gradient.glow},0.10)`,
            color: gradient.accent,
            border: `1px solid rgba(${gradient.glow},0.20)`,
          }}
        >
          {node.section}
        </span>

        {isAlt && (
          <span className="text-[8px] font-bold px-2 py-[3px] rounded-md bg-purple-500/12 text-purple-300 border border-purple-500/25 uppercase tracking-wider">
            Alt
          </span>
        )}

        {prereqCount > 0 && (
          <span className="text-[8px] font-semibold px-2 py-[3px] rounded-md bg-sky-500/10 text-sky-300/70 border border-sky-500/20">
            {prereqCount} prereq
          </span>
        )}
      </div>

      {/* Row 4: Bottom meta */}
      <div className="flex items-center justify-between mt-3 pl-[60px] pr-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
            <BookOpen className="w-2.5 h-2.5" />
            {resourceCount} resources
          </span>
        </div>

        {/* Status progress bar */}
        <div className="flex items-center gap-1.5">
          <div className="relative w-8 h-1.5 rounded-full overflow-hidden" style={{ background: `rgba(${statusGlow},0.10)` }}>
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
              style={{
                width: isDone ? '100%' : isIP ? '50%' : isSkipped ? '100%' : '0%',
                background: isDone
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : isIP
                    ? 'linear-gradient(90deg, #eab308, #fde047)'
                    : isSkipped
                      ? '#64748b'
                      : 'transparent',
                boxShadow: isDone ? '0 0 8px rgba(34,197,94,0.5)' : isIP ? '0 0 8px rgba(234,179,8,0.5)' : 'none',
              }}
            />
          </div>
          <CircleDot
            className="w-2.5 h-2.5 transition-colors duration-300"
            style={{
              color: isDone ? '#22c55e' : isIP ? '#eab308' : isSkipped ? '#64748b' : `rgba(${gradient.glow},0.25)`,
            }}
          />
        </div>
      </div>

      {/* Bottom accent line on hover */}
      <div
        className="absolute bottom-0 left-6 right-6 h-[1.5px] rounded-full transition-all duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${statusGlow},0.3), transparent)`,
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'scaleX(1)' : 'scaleX(0.5)',
        }}
      />

      {/* Hover tooltip */}
      {hovered && !dimmed && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-[56px] z-50 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] leading-[1.4] pointer-events-none"
          style={{
            background: 'rgba(15,23,42,0.96)',
            border: `1px solid rgba(${statusGlow},0.15)`,
            color: '#94a3b8',
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(${statusGlow},0.08)`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <ArrowRight className="w-2.5 h-2.5" style={{ color: gradient.accent }} />
          Click to explore details
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style={{ background: 'rgba(15,23,42,0.96)', borderTop: `1px solid rgba(${statusGlow},0.15)`, borderLeft: `1px solid rgba(${statusGlow},0.15)` }} />
        </div>
      )}
    </button>
  );
}

export default memo(RoadmapFlowNodeCard);
