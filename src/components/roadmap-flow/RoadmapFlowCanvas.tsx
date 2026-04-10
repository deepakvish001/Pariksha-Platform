import { useMemo } from 'react';
import { buildFlowElements, getNodeById, roadmapNodesData, sectionColors, type NodeStatus, type RoadmapNodeData } from '@/data/fullStackRoadmapData';
import RoadmapFlowNodeCard from './RoadmapFlowNodeCard';
import RoadmapFlowLegendBar from './RoadmapFlowLegendBar';
import { Flag, Trophy, ChevronRight, Milestone } from 'lucide-react';

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

const sectionGradients: Record<string, { from: string; to: string; glow: string }> = {
  'Internet Fundamentals': { from: '#475569', to: '#64748b', glow: '100,116,139' },
  'Frontend Development': { from: '#2563eb', to: '#3b82f6', glow: '59,130,246' },
  'Testing': { from: '#0d9488', to: '#14b8a6', glow: '20,184,166' },
  'Backend Development': { from: '#16a34a', to: '#22c55e', glow: '34,197,94' },
  'Web Security': { from: '#dc2626', to: '#ef4444', glow: '239,68,68' },
  'DevOps & Deployment': { from: '#d97706', to: '#f59e0b', glow: '245,158,11' },
};

const sectionToKey: Record<string, string> = {
  'Internet Fundamentals': 'Internet',
  'Frontend Development': 'Frontend',
  'Testing': 'Testing',
  'Backend Development': 'Backend',
  'Web Security': 'Security',
  'DevOps & Deployment': 'DevOps',
};

export default function RoadmapFlowCanvas({ progress, search, sectionFilter, statusFilter, onNodeClick }: Props) {
  const { nodes, edges } = useMemo(() => buildFlowElements(), []);

  const getStatus = (id: string): NodeStatus => progress[id] || 'pending';

  const recommendedIds = useMemo(() => {
    const set = new Set<string>();
    roadmapNodesData.forEach(n => {
      if (progress[n.id] && progress[n.id] !== 'pending') return;
      if (!n.prerequisites || n.prerequisites.length === 0) return;
      const allDone = n.prerequisites.every(p => progress[p] === 'done');
      if (allDone) set.add(n.id);
    });
    return set;
  }, [progress]);

  const sectionStats = useMemo(() => {
    const stats: Record<string, { total: number; done: number }> = {};
    roadmapNodesData.forEach(n => {
      if (!stats[n.section]) stats[n.section] = { total: 0, done: 0 };
      stats[n.section].total++;
      if (progress[n.id] === 'done') stats[n.section].done++;
    });
    return stats;
  }, [progress]);

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
      maxX = Math.max(maxX, n.position.x + 280);
      maxY = Math.max(maxY, n.position.y + 140);
    });
    return { width: maxX + 100, height: maxY + 100 };
  }, [nodes]);

  return (
    <div className="relative w-full overflow-x-auto">
      <style>{`
        @keyframes flowDash {
          to { stroke-dashoffset: -24; }
        }
        @keyframes flowGlow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.4; }
        }
        @keyframes flowParticle {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        .flow-edge { animation: flowDash 1.8s linear infinite; }
        .flow-edge-glow { animation: flowGlow 3s ease-in-out infinite; }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        @keyframes float-dot {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.06; }
        }
        @keyframes section-shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>

      <div className="relative mx-auto" style={{ width: canvasW, height: canvasH, minWidth: 1100 }}>
        {/* Enhanced dot grid background with cross pattern */}
        <svg className="absolute inset-0 pointer-events-none z-0" width={canvasW} height={canvasH}>
          <defs>
            <pattern id="dotGrid2" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="0.8" fill="white" opacity="0.035" />
            </pattern>
            <pattern id="crossGrid" width="96" height="96" patternUnits="userSpaceOnUse">
              <line x1="48" y1="44" x2="48" y2="52" stroke="white" strokeWidth="0.5" opacity="0.02" />
              <line x1="44" y1="48" x2="52" y2="48" stroke="white" strokeWidth="0.5" opacity="0.02" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotGrid2)" />
          <rect width="100%" height="100%" fill="url(#crossGrid)" />
        </svg>

        {/* SVG edges with enhanced animations */}
        <svg className="absolute inset-0 pointer-events-none z-[1]" width={canvasW} height={canvasH}>
          <defs>
            <linearGradient id="spineGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="25%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="75%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <filter id="edgeGlow2" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker id="arrowHead" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 6 L 0 11 z" fill="#3b82f6" opacity="0.4" />
            </marker>
            {/* Particle glow filter */}
            <filter id="particleGlow">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>

          {edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isInvisibleSrc = sourceNode.data?.invisible;
            const isInvisibleTgt = targetNode.data?.invisible;
            const sW = isInvisibleSrc ? 2 : (sourceNode.type === 'section' ? 360 : sourceNode.type === 'checkpoint' ? 330 : 240);
            const sH = isInvisibleSrc ? 2 : (sourceNode.type === 'section' ? 95 : sourceNode.type === 'checkpoint' ? 60 : 130);
            const tW = isInvisibleTgt ? 2 : (targetNode.type === 'section' ? 360 : targetNode.type === 'checkpoint' ? 330 : 240);

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
                {/* Wide glow layer */}
                <path
                  d={d} fill="none"
                  stroke={isSpine ? 'url(#spineGrad2)' : strokeColor}
                  strokeWidth={isSpine ? 8 : 5}
                  opacity={0.04}
                  className="flow-edge-glow"
                  filter="url(#edgeGlow2)"
                />
                {/* Main line */}
                <path
                  d={d} fill="none"
                  stroke={isSpine ? 'url(#spineGrad2)' : strokeColor}
                  strokeWidth={isSpine ? 2 : 1.5}
                  strokeDasharray={isDashed ? '5 5' : isSpine ? undefined : '8 6'}
                  strokeLinecap="round"
                  opacity={isSpine ? 0.5 : 0.25}
                  className={isDashed || !isSpine ? 'flow-edge' : undefined}
                  markerEnd={!isSpine ? 'url(#arrowHead)' : undefined}
                />
                {/* Flowing particles on spine */}
                {isSpine && (
                  <>
                    {/* Primary particle */}
                    <circle r="3" fill="#3b82f6" opacity="0.8" filter="url(#particleGlow)">
                      <animateMotion dur="2.8s" repeatCount="indefinite" path={d} />
                    </circle>
                    <circle r="8" fill="#3b82f6" opacity="0.06">
                      <animateMotion dur="2.8s" repeatCount="indefinite" path={d} />
                    </circle>
                    {/* Secondary particle offset */}
                    <circle r="2" fill="#8b5cf6" opacity="0.6" filter="url(#particleGlow)">
                      <animateMotion dur="3.5s" repeatCount="indefinite" path={d} begin="1.2s" />
                    </circle>
                    {/* Tertiary particle */}
                    <circle r="1.5" fill="#06b6d4" opacity="0.5">
                      <animateMotion dur="4s" repeatCount="indefinite" path={d} begin="2.5s" />
                    </circle>
                  </>
                )}
                {/* Branch connector particles */}
                {!isSpine && !isDashed && (
                  <circle r="2" fill={strokeColor} opacity="0.5">
                    <animateMotion dur="2s" repeatCount="indefinite" path={d} />
                  </circle>
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
            const grad = sectionGradients[node.data.label] || { from: '#3b82f6', to: '#6366f1', glow: '99,102,241' };
            const sKey = sectionToKey[node.data.label];
            const stats = sKey ? sectionStats[sKey] : null;
            const pct = stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
            const isComplete = pct === 100;

            return (
              <div key={node.id} className="absolute z-10" style={{ left: node.position.x, top: node.position.y, width: 360 }}>
                <div
                  className="relative px-6 py-5 rounded-2xl overflow-hidden group"
                  style={{
                    background: `linear-gradient(145deg, ${grad.from}15, ${grad.to}08, rgba(15,23,42,0.6))`,
                    border: `1.5px solid ${isComplete ? '#22c55e30' : `${grad.to}25`}`,
                    backdropFilter: 'blur(20px)',
                    boxShadow: `0 12px 48px rgba(0,0,0,0.35), 0 0 36px ${grad.to}06, inset 0 1px 0 rgba(255,255,255,0.04)`,
                  }}
                >
                  {/* Shimmer effect */}
                  <div
                    className="absolute inset-0 pointer-events-none overflow-hidden"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, ${grad.to}06 50%, transparent 100%)`,
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 6s ease-in-out infinite',
                    }}
                  />
                  {/* Left accent bar */}
                  <div
                    className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                    style={{ background: `linear-gradient(180deg, ${grad.from}, ${grad.to}, ${grad.from}80)` }}
                  />
                  {/* Top accent line */}
                  <div
                    className="absolute top-0 left-6 right-6 h-[1.5px] rounded-full"
                    style={{ background: `linear-gradient(90deg, transparent, ${grad.to}40, transparent)` }}
                  />

                  <div className="flex items-center justify-between relative">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{
                          background: `linear-gradient(135deg, ${grad.from}25, ${grad.to}10)`,
                          border: `1px solid ${grad.to}20`,
                        }}
                      >
                        {isComplete ? '✅' : emoji}
                      </div>
                      <div>
                        <h3 className="text-[15px] font-extrabold text-foreground tracking-tight leading-tight">{node.data.label}</h3>
                        {node.data.subtitle && (
                          <p className="text-[11px] text-muted-foreground/60 font-medium mt-0.5">{node.data.subtitle}</p>
                        )}
                      </div>
                    </div>
                    {/* Section progress */}
                    {stats && (
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] font-bold" style={{ color: isComplete ? '#4ade80' : grad.to }}>
                          {stats.done}/{stats.total}
                        </span>
                        <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${pct}%`,
                              background: isComplete
                                ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                                : `linear-gradient(90deg, ${grad.from}, ${grad.to})`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          if (node.type === 'checkpoint') {
            return (
              <div key={node.id} className="absolute z-10" style={{ left: node.position.x, top: node.position.y, width: 330 }}>
                <div
                  className="relative flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold overflow-hidden group"
                  style={{
                    background: 'linear-gradient(145deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))',
                    border: '1px solid rgba(99,102,241,0.12)',
                    color: '#e2e8f0',
                    boxShadow: '0 6px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  {/* Left gradient bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500 rounded-l-xl" />
                  
                  <div className="relative">
                    <Milestone className="w-4 h-4 text-indigo-400 shrink-0" />
                  </div>
                  <span className="text-center flex-1 text-[12px] tracking-tight font-semibold">{node.data.label}</span>
                  <Trophy className="w-3.5 h-3.5 text-yellow-500/25 shrink-0" />
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
                isRecommended={recommendedIds.has(node.id)}
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
