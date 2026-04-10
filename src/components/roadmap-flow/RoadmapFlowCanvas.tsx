import { useMemo } from 'react';
import { buildFlowElements, getNodeById, sectionColors, type NodeStatus, type RoadmapNodeData } from '@/data/fullStackRoadmapData';
import RoadmapFlowNodeCard from './RoadmapFlowNodeCard';
import RoadmapFlowLegendBar from './RoadmapFlowLegendBar';
import { Flag, Sparkles, Trophy } from 'lucide-react';

interface Props {
  progress: Record<string, NodeStatus>;
  search: string;
  sectionFilter: string;
  statusFilter: string;
  onNodeClick: (nodeData: RoadmapNodeData) => void;
}

const sectionIcons: Record<string, string> = {
  'Internet Fundamentals': '🌐',
  'Frontend Development': '🎨',
  'Testing': '🧪',
  'Backend Development': '⚙️',
  'Web Security': '🛡️',
  'DevOps & Deployment': '🚀',
};

const sectionGradients: Record<string, { from: string; to: string }> = {
  'Internet Fundamentals': { from: '#475569', to: '#64748b' },
  'Frontend Development': { from: '#2563eb', to: '#3b82f6' },
  'Testing': { from: '#0d9488', to: '#14b8a6' },
  'Backend Development': { from: '#16a34a', to: '#22c55e' },
  'Web Security': { from: '#dc2626', to: '#ef4444' },
  'DevOps & Deployment': { from: '#d97706', to: '#f59e0b' },
};

export default function RoadmapFlowCanvas({ progress, search, sectionFilter, statusFilter, onNodeClick }: Props) {
  const { nodes, edges } = useMemo(() => buildFlowElements(), []);

  const getStatus = (id: string): NodeStatus => progress[id] || 'pending';

  const isDimmed = (id: string) => {
    const node = getNodeById(id);
    if (!node) return false;
    const status = getStatus(id);
    if (search && !node.title.toLowerCase().includes(search.toLowerCase())) return true;
    if (sectionFilter !== 'all' && node.section !== sectionFilter) return true;
    if (statusFilter !== 'all' && status !== statusFilter) return true;
    return false;
  };

  const { width: canvasW, height: canvasH } = useMemo(() => {
    let maxX = 0, maxY = 0;
    nodes.forEach(n => {
      maxX = Math.max(maxX, n.position.x + 230);
      maxY = Math.max(maxY, n.position.y + 90);
    });
    return { width: maxX + 60, height: maxY + 60 };
  }, [nodes]);

  return (
    <div className="relative w-full overflow-x-auto">
      <style>{`
        @keyframes flowDash {
          to { stroke-dashoffset: -24; }
        }
        @keyframes flowGlow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
        .flow-edge { animation: flowDash 2s linear infinite; }
        .flow-edge-glow { animation: flowGlow 3s ease-in-out infinite; }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0; }
          100% { transform: scale(0.8); opacity: 0; }
        }
      `}</style>

      <div className="relative mx-auto" style={{ width: canvasW, height: canvasH, minWidth: 950 }}>
        {/* Subtle dot grid */}
        <svg className="absolute inset-0 pointer-events-none z-0 opacity-[0.04]" width={canvasW} height={canvasH}>
          <defs>
            <pattern id="dotGrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotGrid)" />
        </svg>

        {/* SVG edges */}
        <svg className="absolute inset-0 pointer-events-none z-[1]" width={canvasW} height={canvasH}>
          <defs>
            <linearGradient id="spineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="30%" stopColor="#8b5cf6" />
              <stop offset="60%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="edgeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" opacity="0.5" />
            </marker>
          </defs>

          {edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isInvisibleSrc = sourceNode.data?.invisible;
            const isInvisibleTgt = targetNode.data?.invisible;
            const sW = isInvisibleSrc ? 2 : (sourceNode.type === 'section' ? 320 : sourceNode.type === 'checkpoint' ? 290 : 200);
            const sH = isInvisibleSrc ? 2 : (sourceNode.type === 'section' ? 76 : sourceNode.type === 'checkpoint' ? 52 : 68);
            const tW = isInvisibleTgt ? 2 : (targetNode.type === 'section' ? 320 : targetNode.type === 'checkpoint' ? 290 : 200);

            const sx = sourceNode.position.x + sW / 2;
            const sy = sourceNode.position.y + sH;
            const tx = targetNode.position.x + tW / 2;
            const ty = targetNode.position.y;

            const strokeColor = edge.style?.stroke || '#3b82f6';
            const isDashed = edge.animated || edge.style?.strokeDasharray;
            const midY = sy + (ty - sy) / 2;
            const isSpine = Math.abs(sx - tx) < 50;
            const d = `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;

            return (
              <g key={edge.id}>
                {/* Wide glow */}
                <path
                  d={d} fill="none"
                  stroke={isSpine ? 'url(#spineGrad)' : strokeColor}
                  strokeWidth={isSpine ? 6 : 4}
                  opacity={0.06}
                  className="flow-edge-glow"
                  filter="url(#edgeGlow)"
                />
                {/* Main line */}
                <path
                  d={d} fill="none"
                  stroke={isSpine ? 'url(#spineGrad)' : strokeColor}
                  strokeWidth={isSpine ? 2.5 : 1.5}
                  strokeDasharray={isDashed ? '6 4' : isSpine ? undefined : '10 5'}
                  strokeLinecap="round"
                  opacity={isSpine ? 0.65 : 0.35}
                  className={isDashed || !isSpine ? 'flow-edge' : undefined}
                  markerEnd={!isSpine ? 'url(#arrow)' : undefined}
                />
                {/* Flowing particles on spine */}
                {isSpine && (
                  <>
                    <circle r="2.5" fill="#3b82f6" opacity="0.8">
                      <animateMotion dur="3s" repeatCount="indefinite" path={d} />
                    </circle>
                    <circle r="6" fill="#3b82f6" opacity="0.1">
                      <animateMotion dur="3s" repeatCount="indefinite" path={d} />
                    </circle>
                    <circle r="2" fill="#8b5cf6" opacity="0.6">
                      <animateMotion dur="4.5s" repeatCount="indefinite" path={d} begin="1.5s" />
                    </circle>
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Render nodes */}
        {nodes.map((node) => {
          if (node.data?.invisible) return null;

          if (node.type === 'section') {
            const emoji = sectionIcons[node.data.label] || '📦';
            const grad = sectionGradients[node.data.label] || { from: '#3b82f6', to: '#6366f1' };
            return (
              <div key={node.id} className="absolute z-10" style={{ left: node.position.x, top: node.position.y, width: 320 }}>
                <div
                  className="relative px-6 py-4 rounded-2xl text-center overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${grad.from}18, ${grad.to}0a)`,
                    border: `1.5px solid ${grad.to}30`,
                    backdropFilter: 'blur(16px)',
                    boxShadow: `0 8px 40px rgba(0,0,0,0.3), 0 0 30px ${grad.to}08, inset 0 1px 0 rgba(255,255,255,0.05)`,
                  }}
                >
                  {/* Shimmer */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, ${grad.to}08 50%, transparent 100%)`,
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 5s ease-in-out infinite',
                    }}
                  />
                  {/* Left colored accent */}
                  <div
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                    style={{ background: `linear-gradient(180deg, ${grad.from}, ${grad.to})` }}
                  />
                  <div className="flex items-center justify-center gap-2.5 relative">
                    <span className="text-xl">{emoji}</span>
                    <h3 className="text-base font-extrabold text-foreground tracking-tight">{node.data.label}</h3>
                  </div>
                  {node.data.subtitle && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 font-medium relative">{node.data.subtitle}</p>
                  )}
                </div>
              </div>
            );
          }

          if (node.type === 'checkpoint') {
            return (
              <div key={node.id} className="absolute z-10" style={{ left: node.position.x, top: node.position.y, width: 290 }}>
                <div
                  className="relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.8))',
                    border: '1px solid rgba(59,130,246,0.15)',
                    color: '#e2e8f0',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-blue-500 via-purple-500 to-cyan-500" />
                  <div className="relative">
                    <Flag className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="absolute inset-0 rounded-full" style={{ animation: 'pulse-ring 2s ease-out infinite' }}>
                      <Flag className="w-4 h-4 text-blue-400 opacity-40" />
                    </div>
                  </div>
                  <span className="text-center flex-1 text-[13px] tracking-tight">{node.data.label}</span>
                  <Trophy className="w-3.5 h-3.5 text-yellow-500/30 shrink-0" />
                </div>
              </div>
            );
          }

          const nodeData = getNodeById(node.id);
          if (!nodeData) return null;

          return (
            <div key={node.id} className="absolute z-10" style={{ left: node.position.x, top: node.position.y }}>
              <RoadmapFlowNodeCard
                node={nodeData}
                status={getStatus(node.id)}
                dimmed={isDimmed(node.id)}
                onClick={() => onNodeClick(nodeData)}
              />
            </div>
          );
        })}
      </div>

      <RoadmapFlowLegendBar />
    </div>
  );
}
