import { memo } from 'react';
import {
  Globe, FileCode, Paintbrush, Code2, GitBranch, Package, Wrench,
  Atom, TestTube, Shield, Server, Database, Plug, Zap, Terminal,
  Container, RefreshCw, Cloud, Rocket, Gauge, Users, Briefcase,
  CheckCircle2, Clock, SkipForward, Star, BookOpen, Video, FileText,
} from 'lucide-react';
import type { NodeStatus } from '@/data/fullStackRoadmapData';

// Section → icon mapping
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
  Beginner: { label: 'Beginner', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Intermediate: { label: 'Medium', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  Advanced: { label: 'Hard', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
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

  const borderColor = isDone
    ? '#22c55e'
    : isInProgress
    ? '#eab308'
    : isSkipped
    ? '#525252'
    : data.isAlternative
    ? '#a78bfa'
    : data.sectionColor;

  const icon = sectionIcons[data.section] || <Code2 className="w-4 h-4" />;

  return (
    <div
      className={`
        relative flex flex-col gap-1 px-3 py-2.5 rounded-xl border
        cursor-pointer transition-all duration-200
        hover:shadow-xl hover:scale-[1.03]
        ${isDone ? 'bg-emerald-500/5' : isInProgress ? 'bg-yellow-500/5' : isSkipped ? 'bg-muted/30 opacity-50' : 'bg-card/80 backdrop-blur-sm'}
        ${selected ? 'ring-2 ring-primary shadow-xl scale-[1.03]' : ''}
        ${highlighted ? 'ring-2 ring-primary/60 shadow-lg shadow-primary/10' : ''}
        ${data.dimmed ? 'opacity-15 pointer-events-none' : ''}
      `}
      style={{
        borderColor,
        borderWidth: status !== 'pending' || highlighted ? 2 : 1,
        width: 220,
      }}
    >
      {/* Order badge */}
      {data.order && (
        <span
          className="absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md ring-2 ring-background"
          style={{ background: `linear-gradient(135deg, ${data.sectionColor}, ${data.sectionColor}dd)` }}
        >
          {data.order}
        </span>
      )}

      {/* Top row: icon + title + status */}
      <div className="flex items-center gap-2">
        <span
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ background: `${data.sectionColor}20`, color: data.sectionColor }}
        >
          {icon}
        </span>
        <span className="flex-1 truncate text-[13px] font-semibold text-foreground leading-tight">
          {data.title}
        </span>
        {statusIcon[status] && <span className="shrink-0">{statusIcon[status]}</span>}
      </div>

      {/* Bottom row: tags */}
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${diff.bg} ${diff.text} ${diff.border}`}>
          {diff.label}
        </span>
        {data.isAlternative && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/15 text-violet-400 font-medium flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5" /> Alt
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(RoadmapFlowNode);
