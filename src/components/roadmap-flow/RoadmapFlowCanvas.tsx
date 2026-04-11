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

const SECTION_W = 180;
const SECTION_H = 40;
const NODE_W = 200;
const NODE_H = 38;

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
      const w = n.type === 'sectionNode' ? SECTION_W : NODE_W;
      const h = n.type === 'sectionNode' ? SECTION_H : NODE_H;
      const right = n.position.x + w;
      const bottom = n.position.y + h;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    });
    return { width: maxX + 80, height: maxY + 100 };
  }, [nodes]);

  // Build SVG paths for edges — zig-zag connections
  const svgPaths = useMemo(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    return flowEdges.map((edge) => {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) return null;

      const srcIsSection = src.type === 'sectionNode';
      const tgtIsSection = tgt.type === 'sectionNode';
      const srcW = srcIsSection ? SECTION_W : NODE_W;
      const srcH = srcIsSection ? SECTION_H : NODE_H;
      const tgtW = tgtIsSection ? SECTION_W : NODE_W;

      const srcCx = src.position.x + srcW / 2;
      const srcBottom = src.position.y + srcH;
      const tgtCx = tgt.position.x + tgtW / 2;
      const tgtTop = tgt.position.y;

      // For zig-zag: go down from source center, then across to target center
      const midY = (srcBottom + tgtTop) / 2;
      const d = `M ${srcCx} ${srcBottom} C ${srcCx} ${midY}, ${tgtCx} ${midY}, ${tgtCx} ${tgtTop}`;

      return (
        <path
          key={edge.id}
          d={d}
          fill="none"
          stroke={edge.style?.stroke || '#525252'}
          strokeWidth={edge.style?.strokeWidth || 1.5}
          opacity={edge.style?.opacity || 1}
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
