import { memo } from 'react';
import {
  Globe, FileCode, Paintbrush, Code2, GitBranch, Package, Wrench,
  Atom, TestTube, Shield, Server, Database, Plug, Zap, Terminal,
  Container, RefreshCw, Cloud, Rocket, Gauge, Users, Briefcase,
} from 'lucide-react';

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
      className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg text-center whitespace-nowrap"
      style={{
        background: `linear-gradient(135deg, ${data.sectionColor}, ${data.sectionColor}cc)`,
        boxShadow: `0 4px 20px -4px ${data.sectionColor}50`,
      }}
    >
      <span className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
        {icon}
      </span>
      {data.title}
    </div>
  );
}

export default memo(RoadmapFlowSectionNode);
