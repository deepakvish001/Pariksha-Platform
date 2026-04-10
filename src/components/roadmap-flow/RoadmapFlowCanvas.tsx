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

const SECTION_W = 200;
const SECTION_H = 42;
const NODE_W = 180;
const NODE_H = 36;

export default function RoadmapFlowCanvas({ progress, search, sectionFilter, statusFilter, onNodeClick }: Props) {
  const getStatus = (id: string): NodeStatus => progress[id] || 'pending';

  const { nodes, canvasHeight, canvasWidth } = useMemo(() => {
    const searchLower = search.toLowerCase();
    let maxY = 0;
    let maxX = 0;

    const mapped = flowNodes.map((n) => {
      const isTopic = n.type === 'roadmapNode';
      const status = isTopic ? getStatus(n.id) : 'pending';

      let dimmed = false;
      if (isTopic) {
        if (search && !n.data.title.toLowerCase().includes(searchLower)) dimmed = true;
        if (sectionFilter !== 'all' && n.data.section !== sectionFilter) dimmed = true;
        if (statusFilter !== 'all' && status !== statusFilter) dimmed = true;
      }

      const w = n.type === 'sectionNode' ? SECTION_W : NODE_W;
      const h = n.type === 'sectionNode' ? SECTION_H : NODE_H;
      const bottom = n.position.y + h;
      const right = n.position.x + w;
      if (bottom > maxY) maxY = bottom;
      if (right > maxX) maxX = right;

      return { ...n, data: { ...n.data, status, dimmed } };
    });

    return { nodes: mapped, canvasHeight: maxY + 80, canvasWidth: Math.max(maxX + 40, 800) };
  }, [progress, search, sectionFilter, statusFilter]);

  // Build SVG connections: roadmap.sh style with straight lines
  const svgElements = useMemo(() => {
    const nodeMap = new Map(flowNodes.map((n) => [n.id, n]));
    const elements: React.ReactNode[] = [];

    flowEdges.forEach((edge) => {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) return;

      const srcW = src.type === 'sectionNode' ? SECTION_W : NODE_W;
      const srcH = src.type === 'sectionNode' ? SECTION_H : NODE_H;
      const tgtW = tgt.type === 'sectionNode' ? SECTION_W : NODE_W;
      const tgtH = tgt.type === 'sectionNode' ? SECTION_H : NODE_H;

      const srcCx = src.position.x + srcW / 2;
      const srcCy = src.position.y + srcH / 2;
      const tgtCx = tgt.position.x + tgtW / 2;
      const tgtCy = tgt.position.y + tgtH / 2;

      const isSpine = src.type === 'sectionNode' && tgt.type === 'sectionNode';
      const isBranch = src.type === 'sectionNode' && tgt.type === 'roadmapNode';

      const strokeColor = edge.style?.stroke || '#525252';
      const strokeWidth = edge.style?.strokeWidth || 1.5;
      const opacity = edge.style?.opacity || 1;

      if (isSpine) {
        // Vertical spine line: from bottom of source to top of target
        const x = srcCx;
        const y1 = src.position.y + srcH;
        const y2 = tgt.position.y;
        elements.push(
          <line
            key={edge.id}
            x1={x} y1={y1} x2={x} y2={y2}
            stroke={strokeColor} strokeWidth={strokeWidth + 0.5} opacity={opacity}
            strokeDasharray="none"
          />
        );
      } else if (isBranch) {
        // Horizontal branch: from section center to node
        const spineX = srcCx;
        const nodeY = tgtCy;
        const nodeEdgeX = tgtCx < spineX
          ? tgt.position.x + tgtW  // node is left, connect to right edge
          : tgt.position.x;         // node is right, connect to left edge

        // Vertical segment from spine to branch Y, then horizontal to node
        elements.push(
          <g key={edge.id} opacity={opacity}>
            {/* Small dot on spine at branch point */}
            <circle cx={spineX} cy={nodeY} r={3} fill={strokeColor} />
            {/* Horizontal line from spine to node */}
            <line
              x1={spineX} y1={nodeY} x2={nodeEdgeX} y2={nodeY}
              stroke={strokeColor} strokeWidth={strokeWidth}
            />
          </g>
        );
      }
    });

    return elements;
  }, []);

  const handleClick = (nodeId: string) => {
    const nodeData = roadmapNodesData.find((nd) => nd.id === nodeId);
    if (nodeData) onNodeClick(nodeData);
  };

  return (
    <div className="relative w-full overflow-x-auto">
      <div className="relative mx-auto" style={{ width: canvasWidth, minHeight: canvasHeight }}>
        {/* SVG connector lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={canvasWidth}
          height={canvasHeight}
        >
          {svgElements}
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
                <RoadmapFlowNode data={node.data} selected={false} />
              </div>
            )}
          </div>
        ))}
      </div>

      <RoadmapFlowLegend />
    </div>
  );
}
