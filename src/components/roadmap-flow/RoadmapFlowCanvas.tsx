import { useMemo } from 'react';
import RoadmapFlowNode from './RoadmapFlowNode';
import RoadmapFlowSectionNode from './RoadmapFlowSectionNode';
import RoadmapFlowLegend from './RoadmapFlowLegend';
import { flowNodes, flowEdges, type NodeStatus, type RoadmapNodeData, roadmapNodesData } from '@/data/fullStackRoadmapData';

interface Props {
  progress: Record<string, NodeStatus>;
  search: string;
  sectionFilter: string;
  statusFilter: string;
  onNodeClick: (nodeData: RoadmapNodeData) => void;
}

export default function RoadmapFlowCanvas({ progress, search, sectionFilter, statusFilter, onNodeClick }: Props) {
  const getStatus = (id: string): NodeStatus => progress[id] || 'pending';

  const { nodes, canvasHeight } = useMemo(() => {
    const searchLower = search.toLowerCase();
    let maxY = 0;

    const mapped = flowNodes.map((n) => {
      const isTopic = n.type === 'roadmapNode';
      const status = isTopic ? getStatus(n.id) : 'pending';

      let dimmed = false;
      if (isTopic) {
        if (search && !n.data.title.toLowerCase().includes(searchLower)) dimmed = true;
        if (sectionFilter !== 'all' && n.data.section !== sectionFilter) dimmed = true;
        if (statusFilter !== 'all' && status !== statusFilter) dimmed = true;
      }

      const bottom = n.position.y + (n.type === 'sectionNode' ? 40 : 36);
      if (bottom > maxY) maxY = bottom;

      return {
        ...n,
        data: { ...n.data, status, dimmed },
      };
    });

    return { nodes: mapped, canvasHeight: maxY + 80 };
  }, [progress, search, sectionFilter, statusFilter]);

  // Build SVG lines for edges
  const svgLines = useMemo(() => {
    const nodeMap = new Map(flowNodes.map((n) => [n.id, n]));
    
    return flowEdges.map((edge) => {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) return null;

      const srcW = src.type === 'sectionNode' ? 180 : 180;
      const srcH = src.type === 'sectionNode' ? 40 : 36;
      const tgtW = tgt.type === 'sectionNode' ? 180 : 180;

      const x1 = src.position.x + srcW / 2;
      const y1 = src.position.y + srcH;
      const x2 = tgt.position.x + tgtW / 2;
      const y2 = tgt.position.y;

      return (
        <path
          key={edge.id}
          d={`M ${x1} ${y1} C ${x1} ${y1 + 20}, ${x2} ${y2 - 20}, ${x2} ${y2}`}
          fill="none"
          stroke={edge.style?.stroke || '#525252'}
          strokeWidth={edge.style?.strokeWidth || 1.5}
          opacity={edge.style?.opacity || 1}
        />
      );
    });
  }, []);

  const handleClick = (nodeId: string) => {
    const nodeData = roadmapNodesData.find((nd) => nd.id === nodeId);
    if (nodeData) onNodeClick(nodeData);
  };

  return (
    <div className="relative w-full overflow-x-auto">
      <div className="relative mx-auto" style={{ width: 800, minHeight: canvasHeight }}>
        {/* SVG connector lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={800}
          height={canvasHeight}
        >
          {svgLines}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute"
            style={{ left: node.position.x, top: node.position.y }}
          >
            {node.type === 'sectionNode' ? (
              <RoadmapFlowSectionNode data={node.data} />
            ) : (
              <div onClick={() => handleClick(node.id)}>
                <RoadmapFlowNode
                  data={node.data}
                  selected={false}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <RoadmapFlowLegend />
    </div>
  );
}
