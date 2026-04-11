import { useCallback, useMemo, useState } from 'react';
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
const SECTION_H = 44;
const NODE_W = 220;
const NODE_H = 58;

export default function RoadmapFlowCanvas({ progress, search, sectionFilter, statusFilter, onNodeClick }: Props) {
  const getStatus = useCallback((id: string): NodeStatus => progress[id] || 'pending', [progress]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

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

  // Build the path highlight set: all nodes from start up to (and including) the hovered node
  const highlightedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const set = new Set<string>();
    // Walk through topic nodes in order until we hit the hovered one
    for (const nd of roadmapNodesData) {
      set.add(nd.id);
      if (nd.id === hoveredNodeId) break;
    }
    return set;
  }, [hoveredNodeId]);

  // Build highlighted edge set
  const highlightedEdgeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const set = new Set<string>();
    for (const edge of flowEdges) {
      if (highlightedNodeIds.has(edge.source) || highlightedNodeIds.has(edge.target)) {
        // Only include edges where BOTH endpoints are in the path
        const srcInPath = highlightedNodeIds.has(edge.source) || edge.source.startsWith('section-');
        const tgtInPath = highlightedNodeIds.has(edge.target) || edge.target.startsWith('section-');
        if (srcInPath && tgtInPath) set.add(edge.id);
      }
    }
    return set;
  }, [hoveredNodeId, highlightedNodeIds]);

  const handleNodeClick = useCallback((nodeId: string) => {
    const nodeData = roadmapNodesData.find((nd) => nd.id === nodeId);
    if (nodeData) onNodeClick(nodeData);
  }, [onNodeClick]);

  const canvasDimensions = useMemo(() => {
    let maxX = 0, maxY = 0;
    nodes.forEach((n) => {
      const w = n.type === 'sectionNode' ? SECTION_W : NODE_W;
      const h = n.type === 'sectionNode' ? SECTION_H : NODE_H;
      if (n.position.x + w > maxX) maxX = n.position.x + w;
      if (n.position.y + h > maxY) maxY = n.position.y + h;
    });
    return { width: maxX + 80, height: maxY + 100 };
  }, [nodes]);

  // Build SVG paths
  const svgPaths = useMemo(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const isHovering = hoveredNodeId !== null;

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

      const midY = (srcBottom + tgtTop) / 2;
      const d = `M ${srcCx} ${srcBottom} C ${srcCx} ${midY}, ${tgtCx} ${midY}, ${tgtCx} ${tgtTop}`;

      const isHighlighted = highlightedEdgeIds.has(edge.id);
      const baseStroke = edge.style?.stroke || '#525252';

      return (
        <path
          key={edge.id}
          d={d}
          fill="none"
          stroke={isHighlighted ? '#60a5fa' : baseStroke}
          strokeWidth={isHighlighted ? 3 : (edge.style?.strokeWidth || 1.5)}
          opacity={isHovering ? (isHighlighted ? 1 : 0.15) : (edge.style?.opacity || 0.7)}
          className="transition-all duration-300"
          strokeLinecap="round"
        />
      );
    });
  }, [nodes, hoveredNodeId, highlightedEdgeIds]);

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
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {svgPaths}
        </svg>

        {/* Nodes layer */}
        {nodes.map((node) => {
          const isHovering = hoveredNodeId !== null;
          const isInPath = highlightedNodeIds.has(node.id);
          const isSectionInPath = node.type === 'sectionNode' && isHovering;

          return (
            <div
              key={node.id}
              className={`absolute transition-opacity duration-300 ${
                isHovering && !isInPath && node.type !== 'sectionNode' ? 'opacity-20' : ''
              }`}
              style={{ left: node.position.x, top: node.position.y }}
              onMouseEnter={() => {
                if (node.type === 'roadmapNode') setHoveredNodeId(node.id);
              }}
              onMouseLeave={() => setHoveredNodeId(null)}
            >
              {node.type === 'sectionNode' ? (
                <RoadmapFlowSectionNode data={node.data} />
              ) : (
                <div onClick={() => handleNodeClick(node.id)}>
                  <RoadmapFlowNode
                    data={node.data as any}
                    highlighted={isHovering && isInPath}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <RoadmapFlowLegend />
    </div>
  );
}
