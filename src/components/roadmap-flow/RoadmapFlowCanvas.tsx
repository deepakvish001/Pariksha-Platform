import { useMemo } from 'react';
import { buildFlowElements, getNodeById, isUpNext, sectionColors, sectionIcons, type NodeStatus, type RoadmapNodeData } from '@/data/fullStackRoadmapData';
import RoadmapFlowNodeCard from './RoadmapFlowNodeCard';
import RoadmapFlowLegendBar from './RoadmapFlowLegendBar';

interface Props {
  progress: Record<string, NodeStatus>;
  search: string;
  sectionFilter: string;
  statusFilter: string;
  onNodeClick: (nodeData: RoadmapNodeData) => void;
}

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
      <div className="relative mx-auto" style={{ width: canvasW, height: canvasH, minWidth: 800 }}>

        {/* Gradient Spine */}
        <div
          className="absolute z-0"
          style={{
            left: 399,
            top: 0,
            width: 3,
            height: canvasH,
          }}
        >
          <div className="w-full h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 opacity-50 rounded-full" />
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 opacity-20 blur-lg rounded-full" />
        </div>

        {/* SVG edges */}
        <svg
          className="absolute inset-0 pointer-events-none z-[1]"
          width={canvasW}
          height={canvasH}
        >
          <defs>
            <linearGradient id="edge-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
            </linearGradient>
            <filter id="edge-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const sW = sourceNode.data?.invisible ? 2 : 200;
            const sH = sourceNode.data?.invisible ? 2 : 52;
            const tW = targetNode.data?.invisible ? 2 : (targetNode.type === 'section' ? 280 : targetNode.type === 'checkpoint' ? 260 : 200);
            const tH = targetNode.data?.invisible ? 2 : (targetNode.type === 'section' ? 64 : 52);

            const sx = sourceNode.position.x + sW / 2;
            const sy = sourceNode.position.y + sH;
            const tx = targetNode.position.x + tW / 2;
            const ty = targetNode.position.y;

            const isDashed = edge.animated || edge.style?.strokeDasharray;
            const midY = sy + (ty - sy) / 2;
            const d = `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;

            // Check if edge connects done nodes
            const sourceStatus = getStatus(edge.source);
            const targetStatus = getStatus(edge.target);
            const bothDone = sourceStatus === 'done' && targetStatus === 'done';

            return (
              <path
                key={edge.id}
                d={d}
                fill="none"
                stroke={bothDone ? '#22c55e' : (edge.style?.stroke || 'url(#edge-gradient)')}
                strokeWidth={edge.style?.strokeWidth || 2}
                strokeDasharray={isDashed ? '6 4' : undefined}
                opacity={bothDone ? 0.6 : 0.4}
                filter={bothDone ? undefined : 'url(#edge-glow)'}
              />
            );
          })}
        </svg>

        {/* Render nodes */}
        {nodes.map((node) => {
          if (node.data?.invisible) return null;

          if (node.type === 'section') {
            const sectionName = node.data.label as string;
            const matchingSection = Object.keys(sectionColors).find(s => sectionName.toLowerCase().includes(s.toLowerCase()));
            const color = matchingSection ? sectionColors[matchingSection] : '#3b82f6';
            const icon = matchingSection ? sectionIcons[matchingSection] : '📦';

            return (
              <div
                key={node.id}
                className="absolute z-10"
                style={{ left: node.position.x, top: node.position.y, width: 280 }}
                id={`section-${matchingSection?.toLowerCase() || 'unknown'}`}
              >
                <div
                  className="px-5 py-3.5 rounded-2xl text-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                    border: `2px solid ${color}40`,
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  {/* Glow accent */}
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-8 rounded-full blur-xl"
                    style={{ background: color, opacity: 0.15 }}
                  />
                  <div className="flex items-center justify-center gap-2 mb-0.5">
                    <span className="text-lg">{icon}</span>
                    <h3 className="text-base font-extrabold text-foreground">{node.data.label}</h3>
                  </div>
                  {node.data.subtitle && (
                    <p className="text-[11px] text-muted-foreground">{node.data.subtitle}</p>
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
                style={{ left: node.position.x, top: node.position.y, width: 260 }}
              >
                <div
                  className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#c7d2fe',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(99,102,241,0.1)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                  <span className="text-center flex-1">{node.data.label}</span>
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
                isUpNext={isUpNext(node.id, progress)}
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
