import { useCallback, useMemo } from 'react';
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
  const getStatus = useCallback((id: string): NodeStatus => progress[id] || 'pending', [progress]);

  const nodes = useMemo(() => {
    const searchLower = search.toLowerCase();
    return flowNodes.map((n) => {
      const isTopic = n.type === 'roadmapNode';
      const status = isTopic ? getStatus(n.id) : 'pending';
      let dimmed = false;
      if (isTopic) {
        if (search && !n.data.title.toLowerCase().includes(searchLower)) dimmed = true;
        if (sectionFilter !== 'all' && n.data.section !== sectionFilter) dimmed = true;
        if (statusFilter !== 'all' && status !== statusFilter) dimmed = true;
      }
      return { ...n, data: { ...n.data, status, dimmed } };
    });
  }, [progress, search, sectionFilter, statusFilter, getStatus]);

  const handleNodeClick = useCallback((nodeId: string) => {
    const nodeData = roadmapNodesData.find((nd) => nd.id === nodeId);
    if (nodeData) onNodeClick(nodeData);
  }, [onNodeClick]);

  // Calculate canvas dimensions
  const canvasDimensions = useMemo(() => {
    let maxX = 0, maxY = 0;
    nodes.forEach((n) => {
      const right = n.position.x + 200;
      const bottom = n.position.y + 50;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    });
    return { width: maxX + 60, height: maxY + 80 };
  }, [nodes]);

  // Build SVG paths for edges
  const svgPaths = useMemo(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    return flowEdges.map((edge) => {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) return null;

      const isSection = src.type === 'sectionNode';
      const srcW = isSection ? 180 : 180;
      const srcH = isSection ? 40 : 36;
      const tgtW = tgt.type === 'sectionNode' ? 180 : 180;
      const tgtH = tgt.type === 'sectionNode' ? 40 : 36;

      const x1 = src.position.x + srcW / 2;
      const y1 = src.position.y + srcH;
      const x2 = tgt.position.x + tgtW / 2;
      const y2 = tgt.position.y;

      // Simple curved path
      const midY = (y1 + y2) / 2;
      const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

      return (
        <path
          key={edge.id}
          d={d}
          fill="none"
          stroke={edge.style?.stroke || '#525252'}
          strokeWidth={edge.style?.strokeWidth || 1.5}
          opacity={edge.style?.opacity || 1}
          strokeDasharray={edge.animated ? '5 5' : undefined}
        />
      );
    });
  }, [nodes]);

  return (
    <div className="relative w-full rounded-xl border border-border overflow-auto bg-background">
      <div
        className="relative mx-auto"
        style={{ width: canvasDimensions.width, height: canvasDimensions.height }}
      >
        {/* SVG connections layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={canvasDimensions.width}
          height={canvasDimensions.height}
        >
          {svgPaths}
        </svg>

        {/* Nodes layer */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute"
            style={{ left: node.position.x, top: node.position.y }}
          >
            {node.type === 'sectionNode' ? (
              <RoadmapFlowSectionNode data={node.data} />
            ) : (
              <div onClick={() => handleNodeClick(node.id)}>
                <RoadmapFlowNode data={node.data as any} />
              </div>
            )}
          </div>
        ))}
      </div>

      <RoadmapFlowLegend />
    </div>
  );
}
