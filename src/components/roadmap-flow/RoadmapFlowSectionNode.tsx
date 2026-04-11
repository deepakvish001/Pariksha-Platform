import { memo } from 'react';
import {
  Globe, FileCode, Paintbrush, Code2, GitBranch, Package, Wrench,
  Atom, TestTube, Shield, Server, Database, Plug, Zap, Terminal,
  Container, RefreshCw, Cloud, Rocket, Gauge, Users, Briefcase,
} from 'lucide-react';

const sectionIcons: Record<string, React.ReactNode> = {
  'Internet Basics': <Globe className="w-5 h-5" />,
  'HTML': <FileCode className="w-5 h-5" />,
  'CSS': <Paintbrush className="w-5 h-5" />,
  'JavaScript': <Code2 className="w-5 h-5" />,
  'Version Control': <GitBranch className="w-5 h-5" />,
  'Package Managers': <Package className="w-5 h-5" />,
  'Build Tools': <Wrench className="w-5 h-5" />,
  'React': <Atom className="w-5 h-5" />,
  'Testing': <TestTube className="w-5 h-5" />,
  'Web Security': <Shield className="w-5 h-5" />,
  'Node.js': <Server className="w-5 h-5" />,
  'Databases': <Database className="w-5 h-5" />,
  'APIs': <Plug className="w-5 h-5" />,
  'Caching': <Zap className="w-5 h-5" />,
  'DevOps': <Terminal className="w-5 h-5" />,
  'Containerization': <Container className="w-5 h-5" />,
  'CI/CD': <RefreshCw className="w-5 h-5" />,
  'Cloud Services': <Cloud className="w-5 h-5" />,
  'Deployment': <Rocket className="w-5 h-5" />,
  'Performance': <Gauge className="w-5 h-5" />,
  'Soft Skills': <Users className="w-5 h-5" />,
  'Career': <Briefcase className="w-5 h-5" />,
};

interface Props {
  data: {
    title: string;
    sectionColor: string;
  };
}

function RoadmapFlowSectionNode({ data }: Props) {
  const icon = sectionIcons[data.title] || <Code2 className="w-5 h-5" />;

  return (
    <div
      className="relative flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-sm text-white shadow-xl whitespace-nowrap"
      style={{
        background: `linear-gradient(135deg, ${data.sectionColor}ee, ${data.sectionColor}aa)`,
        boxShadow: `0 6px 24px -6px ${data.sectionColor}60, 0 0 0 1px ${data.sectionColor}30`,
      }}
    >
      {/* Left dot */}
      <span
        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full ring-2 ring-background"
        style={{ background: data.sectionColor }}
      />
      {/* Right dot */}
      <span
        className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full ring-2 ring-background"
        style={{ background: data.sectionColor }}
      />

      <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
        {icon}
      </span>
      {data.title}
    </div>
  );
}

export default memo(RoadmapFlowSectionNode);
