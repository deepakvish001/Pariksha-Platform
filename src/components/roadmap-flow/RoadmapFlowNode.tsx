import { memo } from 'react';
import {
  Globe, FileCode, Paintbrush, Code2, GitBranch, Package, Wrench,
  Atom, TestTube, Shield, Server, Database, Plug, Zap, Terminal,
  Container, RefreshCw, Cloud, Rocket, Gauge, Users, Briefcase,
  CheckCircle2, Clock, SkipForward, Star,
} from 'lucide-react';
import type { NodeStatus } from '@/data/fullStackRoadmapData';

const sectionIcons: Record<string, React.ReactNode> = {
  'Internet Basics': <Globe className="w-4 h-4" />,
  'HTML': <FileCode className="w-4 h-4" />,
  'CSS': <Paintbrush className="w-4 h-4" />,
  'JavaScript': <Code2 className="w-4 h-4" />,
  'Version Control': <GitBranch className="w-4 h-4" />,
  'Package Managers': <Package className="w-4 h-4" />,
  'Build Tools': <Wrench className="w-4 h-4" />,
  'React': <Atom className="w-4 h-4" />,
  'Testing': <TestTube className="w-4 h-4" />,
  'Web Security': <Shield className="w-4 h-4" />,
  'Node.js': <Server className="w-4 h-4" />,
  'Databases': <Database className="w-4 h-4" />,
  'APIs': <Plug className="w-4 h-4" />,
  'Caching': <Zap className="w-4 h-4" />,
  'DevOps': <Terminal className="w-4 h-4" />,
  'Containerization': <Container className="w-4 h-4" />,
  'CI/CD': <RefreshCw className="w-4 h-4" />,
  'Cloud Services': <Cloud className="w-4 h-4" />,
  'Deployment': <Rocket className="w-4 h-4" />,
  'Performance': <Gauge className="w-4 h-4" />,
  'Soft Skills': <Users className="w-4 h-4" />,
  'Career': <Briefcase className="w-4 h-4" />,
};

const difficultyConfig = {
  Beginner: { label: 'Beginner', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  Intermediate: { label: 'Medium', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  Advanced: { label: 'Hard', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/25' },
};

interface Props {
  data: {
    id: string;
    title: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    sectionColor: string;
    section: string;
    nodeType: string;
    isAlternative?: boolean;
    status?: NodeStatus;
    dimmed?: boolean;
    order?: number;
    isLeft?: boolean;
  };
  selected?: boolean;
  highlighted?: boolean;
}

const statusIcon: Record<string, React.ReactNode> = {
  done: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  'in-progress': <Clock className="w-4 h-4 text-yellow-400 shrink-0" />,
  skipped: <SkipForward className="w-4 h-4 text-muted-foreground shrink-0" />,
};

function RoadmapFlowNode({ data, selected, highlighted }: Props) {
  const status = data.status || 'pending';
  const diff = difficultyConfig[data.difficulty] || difficultyConfig.Beginner;
  const isDone = status === 'done';
  const isInProgress = status === 'in-progress';
  const isSkipped = status === 'skipped';
  const icon = sectionIcons[data.section] || <Code2 className="w-4 h-4" />;

  const borderColor = isDone
    ? '#22c55e'
    : isInProgress
    ? '#eab308'
    : isSkipped
    ? '#525252'
    : data.isAlternative
    ? '#a78bfa'
    : data.sectionColor;

  return (
    <div
      className={`
        group relative flex flex-col gap-1.5 px-3.5 py-3 rounded-xl border backdrop-blur-sm
        cursor-pointer transition-all duration-200
        hover:shadow-2xl hover:scale-[1.04]
        ${isDone ? 'bg-emerald-950/40' : isInProgress ? 'bg-yellow-950/30' : isSkipped ? 'bg-muted/20 opacity-50' : 'bg-card/90'}
        ${selected ? 'ring-2 ring-primary shadow-xl scale-[1.04]' : ''}
        ${highlighted ? 'ring-2 ring-blue-400/70 shadow-lg shadow-blue-500/20 scale-[1.02]' : ''}
        ${data.dimmed ? 'opacity-15 pointer-events-none' : ''}
      `}
      style={{
        borderColor,
        borderWidth: (status !== 'pending' || highlighted) ? 2 : 1,
        width: 230,
        boxShadow: highlighted
          ? `0 0 20px ${data.sectionColor}30, 0 4px 16px rgba(0,0,0,0.3)`
          : status !== 'pending'
          ? `0 2px 12px ${borderColor}15`
          : undefined,
      }}
    >
      {/* Order badge */}
      {data.order && (
        <span
          className="absolute -top-3 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg ring-2 ring-background"
          style={{
            background: `linear-gradient(135deg, ${data.sectionColor}, ${data.sectionColor}bb)`,
            [data.isLeft ? 'right' : 'left']: -8,
          }}
        >
          {data.order}
        </span>
      )}

      {/* Connector dot (towards spine) */}
      <span
        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-background"
        style={{
          background: borderColor,
          [data.isLeft ? 'right' : 'left']: -6,
        }}
      />

      {/* Top row: icon + title + status */}
      <div className="flex items-center gap-2">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: `${data.sectionColor}18`, color: data.sectionColor }}
        >
          {icon}
        </span>
        <span className="flex-1 truncate text-[13px] font-semibold text-foreground leading-tight">
          {data.title}
        </span>
        {statusIcon[status] && <span className="shrink-0">{statusIcon[status]}</span>}
      </div>

      {/* Tags row */}
      <div className="flex items-center gap-1.5 pl-9">
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${diff.cls}`}>
          {diff.label}
        </span>
        {data.isAlternative && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-violet-500/25 bg-violet-500/15 text-violet-400 font-medium flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5" /> Alt
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(RoadmapFlowNode);
