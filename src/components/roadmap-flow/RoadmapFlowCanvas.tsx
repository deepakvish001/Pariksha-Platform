import { useMemo } from 'react';
import { buildFlowElements, getNodeById, roadmapNodesData, sectionColors, type NodeStatus, type RoadmapNodeData } from '@/data/fullStackRoadmapData';
import RoadmapFlowNodeCard from './RoadmapFlowNodeCard';
import RoadmapFlowLegendBar from './RoadmapFlowLegendBar';
import { Trophy, Milestone, ChevronRight, Flame, Sparkles } from 'lucide-react';

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
      if (n.prerequisites.every(p => progress[p] === 'done')) set.add(n.id);
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
      maxX = Math.max(maxX, n.position.x + 300);
      maxY = Math.max(maxY, n.position.y + 160);
    });
    return { width: maxX + 120, height: maxY + 120 };
  }, [nodes]);

  return (
    <div className="relative w-full overflow-x-auto">
      <style>{`
        @keyframes flowDash { to { stroke-dashoffset: -24; } }
        @keyframes flowGlow { 0%, 100% { opacity: 0.08; } 50% { opacity: 0.35; } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.3); opacity: 0; } 100% { transform: scale(0.8); opacity: 0; } }
        @keyframes float-y { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes section-shine { 0% { left: -100%; } 100% { left: 200%; } }
        @keyframes orbit { 0% { transform: rotate(0deg) translateX(6px) rotate(0deg); } 100% { transform: rotate(360deg) translateX(6px) rotate(-360deg); } }
      `}</style>

      <div className="relative mx-auto" style={{ width: canvasW, height: canvasH, minWidth: 1100 }}>
        {/* Enhanced animated grid background */}
        <svg className="absolute inset-0 pointer-events-none z-0" width={canvasW} height={canvasH}>
          <defs>
            <pattern id="dotGrid3" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="14" cy="14" r="0.6" fill="white" opacity="0.04" />
            </pattern>
            <pattern id="crossGrid2" width="84" height="84" patternUnits="userSpaceOnUse">
              <line x1="42" y1="38" x2="42" y2="46" stroke="white" strokeWidth="0.4" opacity="0.025" />
              <line x1="38" y1="42" x2="46" y2="42" stroke="white" strokeWidth="0.4" opacity="0.025" />
            </pattern>
            <radialGradient id="centerGlow" cx="50%" cy="30%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotGrid3)" />
          <rect width="100%" height="100%" fill="url(#crossGrid2)" />
          <rect width="100%" height="100%" fill="url(#centerGlow)" />
        </svg>

        {/* SVG edges with rich animated connections */}
        <svg className="absolute inset-0 pointer-events-none z-[1]" width={canvasW} height={canvasH}>
          <defs>
            <linearGradient id="spineGrad3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="20%" stopColor="#6366f1" />
              <stop offset="40%" stopColor="#3b82f6" />
              <stop offset="60%" stopColor="#06b6d4" />
              <stop offset="80%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <filter id="edgeGlow3" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="particleGlow2">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>
            <marker id="arrowHead2" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 2 L 10 6 L 0 10 z" fill="#3b82f6" opacity="0.3" />
            </marker>
          </defs>

          {edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isInvisibleSrc = sourceNode.data?.invisible;
            const isInvisibleTgt = targetNode.data?.invisible;
            const sW = isInvisibleSrc ? 2 : (sourceNode.type === 'section' ? 380 : sourceNode.type === 'checkpoint' ? 350 : 250);
            const sH = isInvisibleSrc ? 2 : (sourceNode.type === 'section' ? 100 : sourceNode.type === 'checkpoint' ? 60 : 140);
            const tW = isInvisibleTgt ? 2 : (targetNode.type === 'section' ? 380 : targetNode.type === 'checkpoint' ? 350 : 250);

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
                <path d={d} fill="none"
                  stroke={isSpine ? 'url(#spineGrad3)' : strokeColor}
                  strokeWidth={isSpine ? 10 : 6}
                  opacity={0.04}
                  className="flow-edge-glow" filter="url(#edgeGlow3)"
                />
                {/* Main line */}
                <path d={d} fill="none"
                  stroke={isSpine ? 'url(#spineGrad3)' : strokeColor}
                  strokeWidth={isSpine ? 2.5 : 1.5}
                  strokeDasharray={isDashed ? '5 5' : isSpine ? undefined : '8 6'}
                  strokeLinecap="round"
                  opacity={isSpine ? 0.55 : 0.25}
                  className={isDashed || !isSpine ? 'flow-edge' : undefined}
                  markerEnd={!isSpine ? 'url(#arrowHead2)' : undefined}
                />
                {/* Spine particles */}
                {isSpine && (
                  <>
                    <circle r="3.5" fill="#6366f1" opacity="0.85" filter="url(#particleGlow2)">
                      <animateMotion dur="2.5s" repeatCount="indefinite" path={d} />
                    </circle>
                    <circle r="10" fill="#6366f1" opacity="0.04">
                      <animateMotion dur="2.5s" repeatCount="indefinite" path={d} />
                    </circle>
                    <circle r="2.5" fill="#3b82f6" opacity="0.7" filter="url(#particleGlow2)">
                      <animateMotion dur="3.2s" repeatCount="indefinite" path={d} begin="0.8s" />
                    </circle>
                    <circle r="2" fill="#06b6d4" opacity="0.6">
                      <animateMotion dur="4s" repeatCount="indefinite" path={d} begin="1.6s" />
                    </circle>
                    <circle r="1.5" fill="#22c55e" opacity="0.5">
                      <animateMotion dur="5s" repeatCount="indefinite" path={d} begin="2.8s" />
                    </circle>
                  </>
                )}
                {/* Branch particles */}
                {!isSpine && !isDashed && (
                  <>
                    <circle r="2" fill={strokeColor} opacity="0.5">
                      <animateMotion dur="2s" repeatCount="indefinite" path={d} />
                    </circle>
                    <circle r="1" fill={strokeColor} opacity="0.3">
                      <animateMotion dur="2.8s" repeatCount="indefinite" path={d} begin="1s" />
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
            const grad = sectionGradients[node.data.label] || { from: '#3b82f6', to: '#6366f1', glow: '99,102,241' };
            const sKey = sectionToKey[node.data.label];
            const stats = sKey ? sectionStats[sKey] : null;
            const pct = stats && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
            const isComplete = pct === 100;

            return (
              <div key={node.id} className="absolute z-10" style={{ left: node.position.x, top: node.position.y, width: 380 }}>
                <div
                  className="relative px-6 py-5 rounded-2xl overflow-hidden group cursor-default"
                  style={{
                    background: isComplete
                      ? 'linear-gradient(145deg, rgba(34,197,94,0.12), rgba(16,185,129,0.06), rgba(15,23,42,0.6))'
                      : `linear-gradient(145deg, ${grad.from}15, ${grad.to}08, rgba(15,23,42,0.6))`,
                    border: `1.5px solid ${isComplete ? '#22c55e30' : `${grad.to}25`}`,
                    backdropFilter: 'blur(20px)',
                    boxShadow: `0 12px 48px rgba(0,0,0,0.35), 0 0 36px ${isComplete ? 'rgba(34,197,94,0.08)' : `${grad.to}06`}, inset 0 1px 0 rgba(255,255,255,0.04)`,
                  }}
                >
                  {/* Shimmer */}
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
                    style={{ background: isComplete ? 'linear-gradient(180deg, #22c55e, #4ade80, #22c55e80)' : `linear-gradient(180deg, ${grad.from}, ${grad.to}, ${grad.from}80)` }}
                  />
                  {/* Top accent line */}
                  <div
                    className="absolute top-0 left-6 right-6 h-[1.5px] rounded-full"
                    style={{ background: `linear-gradient(90deg, transparent, ${isComplete ? '#22c55e40' : `${grad.to}40`}, transparent)` }}
                  />

                  <div className="flex items-center justify-between relative">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
                        style={{
                          background: isComplete
                            ? 'rgba(34,197,94,0.12)'
                            : `linear-gradient(135deg, ${grad.from}25, ${grad.to}10)`,
                          border: `1.5px solid ${isComplete ? 'rgba(34,197,94,0.3)' : `${grad.to}20`}`,
                          boxShadow: `0 0 16px ${isComplete ? 'rgba(34,197,94,0.1)' : `${grad.to}08`}`,
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
                        <div className="flex items-center gap-1.5">
                          {isComplete && <Sparkles className="w-3 h-3 text-emerald-400" />}
                          <span className="text-[11px] font-bold" style={{ color: isComplete ? '#4ade80' : grad.to }}>
                            {stats.done}/{stats.total}
                          </span>
                        </div>
                        <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${pct}%`,
                              background: isComplete
                                ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                                : `linear-gradient(90deg, ${grad.from}, ${grad.to})`,
                              boxShadow: pct > 0 ? `0 0 8px ${isComplete ? 'rgba(34,197,94,0.3)' : `${grad.to}30`}` : 'none',
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground/40 font-medium">{pct}% complete</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          if (node.type === 'checkpoint') {
            return (
              <div key={node.id} className="absolute z-10" style={{ left: node.position.x, top: node.position.y, width: 350 }}>
                <div
                  className="relative flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-bold overflow-hidden group"
                  style={{
                    background: 'linear-gradient(145deg, rgba(15,23,42,0.9), rgba(30,41,59,0.7))',
                    border: '1px solid rgba(99,102,241,0.15)',
                    color: '#e2e8f0',
                    boxShadow: '0 6px 28px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.04), inset 0 1px 0 rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500 rounded-l-xl" />
                  <div className="relative">
                    <Milestone className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                  </div>
                  <span className="text-center flex-1 text-[12px] tracking-tight font-semibold">{node.data.label}</span>
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
