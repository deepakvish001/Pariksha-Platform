import { useMemo } from 'react';
import { buildFlowElements, getNodeById, type NodeStatus, type RoadmapNodeData } from '@/data/fullStackRoadmapData';
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

  // Calculate canvas bounds
  const { width: canvasW, height: canvasH } = useMemo(() => {
    let maxX = 0, maxY = 0;
    nodes.forEach(n => {
      maxX = Math.max(maxX, n.position.x + 200);
      maxY = Math.max(maxY, n.position.y + 60);
    });
    return { width: maxX + 40, height: maxY + 40 };
  }, [nodes]);

  return (
    <div className="relative w-full overflow-x-auto">
      <div className="relative mx-auto" style={{ width: canvasW, height: canvasH, minWidth: 800 }}>
        {/* SVG edges */}
        <svg
          className="absolute inset-0 pointer-events-none z-0"
          width={canvasW}
          height={canvasH}
        >
          {edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const sW = sourceNode.data?.invisible ? 2 : 180;
            const sH = sourceNode.data?.invisible ? 2 : 44;
            const tW = targetNode.data?.invisible ? 2 : (targetNode.type === 'section' ? 280 : targetNode.type === 'checkpoint' ? 260 : 180);
            const tH = targetNode.data?.invisible ? 2 : (targetNode.type === 'section' ? 60 : 44);

            const sx = sourceNode.position.x + sW / 2;
            const sy = sourceNode.position.y + sH;
            const tx = targetNode.position.x + tW / 2;
            const ty = targetNode.position.y;

            const strokeColor = edge.style?.stroke || '#3b82f6';
            const isDashed = edge.animated || edge.style?.strokeDasharray;
            const midY = sy + (ty - sy) / 2;

            // Smoothstep path
            const d = `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;

            return (
              <path
                key={edge.id}
                d={d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={edge.style?.strokeWidth || 2}
                strokeDasharray={isDashed ? '6 4' : undefined}
                opacity={0.5}
              />
            );
          })}
        </svg>

        {/* Render nodes */}
        {nodes.map((node) => {
          if (node.data?.invisible) return null;

          if (node.type === 'section') {
            return (
              <div
                key={node.id}
                className="absolute"
                style={{ left: node.position.x, top: node.position.y, width: 280 }}
              >
                <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/20 backdrop-blur-sm text-center">
                  <h3 className="text-base font-bold text-foreground">{node.data.label}</h3>
                  {node.data.subtitle && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{node.data.subtitle}</p>
                  )}
                </div>
              </div>
            );
          }

          if (node.type === 'checkpoint') {
            return (
              <div
                key={node.id}
                className="absolute"
                style={{ left: node.position.x, top: node.position.y, width: 260 }}
              >
                <div
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    border: '1px solid rgba(148,163,184,0.15)',
                    color: '#e2e8f0',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  <span className="text-blue-400">⚑</span>
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
