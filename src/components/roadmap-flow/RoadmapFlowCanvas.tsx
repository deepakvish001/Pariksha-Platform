import { useMemo } from 'react';
import { buildFlowElements, getNodeById, type NodeStatus, type RoadmapNodeData } from '@/data/fullStackRoadmapData';
import RoadmapFlowNodeCard from './RoadmapFlowNodeCard';
import RoadmapFlowLegendBar from './RoadmapFlowLegendBar';
import { Flag, Sparkles } from 'lucide-react';

interface Props {
  progress: Record<string, NodeStatus>;
  search: string;
  sectionFilter: string;
  statusFilter: string;
  onNodeClick: (nodeData: RoadmapNodeData) => void;
}

// Section icon mapping
const sectionIcons: Record<string, string> = {
  'Internet Fundamentals': '🌐',
  'Frontend Development': '🎨',
  'Testing': '🧪',
  'Backend Development': '⚙️',
  'Web Security': '🛡️',
  'DevOps & Deployment': '🚀',
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
      maxX = Math.max(maxX, n.position.x + 220);
      maxY = Math.max(maxY, n.position.y + 80);
    });
    return { width: maxX + 60, height: maxY + 60 };
  }, [nodes]);

  return (
    <div className="relative w-full overflow-x-auto">
      {/* CSS for animated edges */}
      <style>{`
        @keyframes flowDash {
          to { stroke-dashoffset: -20; }
        }
        @keyframes flowGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        .flow-edge {
          animation: flowDash 1.5s linear infinite;
        }
        .flow-edge-glow {
          animation: flowGlow 2s ease-in-out infinite;
        }
        @keyframes pulseNode {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.3); }
          50% { box-shadow: 0 0 0 6px rgba(59,130,246,0); }
        }
        @keyframes shimmerCheckpoint {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <div className="relative mx-auto" style={{ width: canvasW, height: canvasH, minWidth: 900 }}>
        {/* Background grid pattern */}
        <svg className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" width={canvasW} height={canvasH}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* SVG edges with animations */}
        <svg className="absolute inset-0 pointer-events-none z-[1]" width={canvasW} height={canvasH}>
          <defs>
            {/* Gradient for main spine */}
            <linearGradient id="spineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="edgeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Arrow marker */}
            <marker id="arrowBlue" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" opacity="0.6" />
            </marker>
          </defs>

          {edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isInvisibleSrc = sourceNode.data?.invisible;
            const isInvisibleTgt = targetNode.data?.invisible;
            const sW = isInvisibleSrc ? 2 : (sourceNode.type === 'section' ? 300 : sourceNode.type === 'checkpoint' ? 280 : 190);
            const sH = isInvisibleSrc ? 2 : (sourceNode.type === 'section' ? 70 : sourceNode.type === 'checkpoint' ? 52 : 56);
            const tW = isInvisibleTgt ? 2 : (targetNode.type === 'section' ? 300 : targetNode.type === 'checkpoint' ? 280 : 190);
            const tH = isInvisibleTgt ? 2 : (targetNode.type === 'section' ? 70 : 56);

            const sx = sourceNode.position.x + sW / 2;
            const sy = sourceNode.position.y + sH;
            const tx = targetNode.position.x + tW / 2;
            const ty = targetNode.position.y;

            const strokeColor = edge.style?.stroke || '#3b82f6';
            const isDashed = edge.animated || edge.style?.strokeDasharray;
            const midY = sy + (ty - sy) / 2;

            // Check if this is a spine edge (vertical) vs branch edge
            const isSpine = Math.abs(sx - tx) < 50;
            const d = `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;

            return (
              <g key={edge.id}>
                {/* Glow layer */}
                <path
                  d={d}
                  fill="none"
                  stroke={isSpine ? 'url(#spineGrad)' : strokeColor}
                  strokeWidth={isSpine ? 4 : 3}
                  opacity={0.08}
                  className="flow-edge-glow"
                  filter="url(#edgeGlow)"
                />
                {/* Main line */}
                <path
                  d={d}
                  fill="none"
                  stroke={isSpine ? 'url(#spineGrad)' : strokeColor}
                  strokeWidth={isSpine ? 2.5 : 1.5}
                  strokeDasharray={isDashed ? '6 4' : isSpine ? undefined : '8 4'}
                  strokeLinecap="round"
                  opacity={isSpine ? 0.6 : 0.4}
                  className={isDashed || !isSpine ? 'flow-edge' : undefined}
                  markerEnd={!isSpine ? 'url(#arrowBlue)' : undefined}
                />
                {/* Animated flowing dot on spine */}
                {isSpine && (
                  <>
                    <circle r="2.5" fill="#3b82f6" opacity="0.8">
                      <animateMotion dur="3s" repeatCount="indefinite" path={d} />
                    </circle>
                    <circle r="5" fill="#3b82f6" opacity="0.15">
                      <animateMotion dur="3s" repeatCount="indefinite" path={d} />
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
            return (
              <div
                key={node.id}
                className="absolute z-10"
                style={{ left: node.position.x, top: node.position.y, width: 300 }}
              >
                <div
                  className="relative px-6 py-4 rounded-2xl text-center overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))',
                    border: '1.5px solid rgba(59,130,246,0.2)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Shimmer overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmerCheckpoint 4s ease-in-out infinite',
                    }}
                  />
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">{emoji}</span>
                    <h3 className="text-base font-extrabold text-foreground tracking-tight">{node.data.label}</h3>
                  </div>
                  {node.data.subtitle && (
                    <p className="text-[11px] text-muted-foreground mt-1 font-medium">{node.data.subtitle}</p>
                  )}
                </div>
              </div>
            );
          }

          if (node.type === 'checkpoint') {
            return (
              <div
                key={node.id}
                className="absolute z-10"
                style={{ left: node.position.x, top: node.position.y, width: 280 }}
              >
                <div
                  className="relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    color: '#e2e8f0',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Pulsing left accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-blue-500 via-purple-500 to-blue-500" />
                  <Flag className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-center flex-1 text-[13px]">{node.data.label}</span>
                  <Sparkles className="w-3 h-3 text-blue-500/40 shrink-0" />
                </div>
              </div>
            );
          }

          // Topic node
          const nodeData = getNodeById(node.id);
          if (!nodeData) return null;

          return (
            <div
              key={node.id}
              className="absolute z-10"
              style={{ left: node.position.x, top: node.position.y }}
            >
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
