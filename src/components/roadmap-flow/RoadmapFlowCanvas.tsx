import { useCallback, useMemo, useState } from 'react';
import RoadmapFlowNode from './RoadmapFlowNode';
import RoadmapFlowSectionNode from './RoadmapFlowSectionNode';
import RoadmapFlowLegend from './RoadmapFlowLegend';
import {
  flowNodes, flowEdges, type NodeStatus, type RoadmapNodeData, roadmapNodesData,
  SPINE_X, NODE_W, NODE_H, SECTION_W, SECTION_H,
} from '@/data/fullStackRoadmapData';

interface Props {
  progress: Record<string, NodeStatus>;
  search: string;
  sectionFilter: string;
  statusFilter: string;
  onNodeClick: (nodeData: RoadmapNodeData) => void;
}

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

  // Path highlighting
  const highlightedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const set = new Set<string>();
    for (const nd of roadmapNodesData) {
      set.add(nd.id);
      if (nd.id === hoveredNodeId) break;
    }
    return set;
  }, [hoveredNodeId]);

  const highlightedEdgeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const set = new Set<string>();
    for (const edge of flowEdges) {
      const srcInPath = highlightedNodeIds.has(edge.source) || edge.source.startsWith('section-');
      const tgtInPath = highlightedNodeIds.has(edge.target) || edge.target.startsWith('section-');
      if (srcInPath && tgtInPath) set.add(edge.id);
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
    return { width: maxX + 80, height: maxY + 120 };
  }, [nodes]);

  // Build SVG elbow paths
  const svgContent = useMemo(() => {
    const isHovering = hoveredNodeId !== null;

    // Draw the vertical spine line
    let spineMinY = Infinity, spineMaxY = 0;
    nodes.forEach((n) => {
      if (n.type === 'sectionNode') {
        const cy = n.position.y + SECTION_H / 2;
        if (cy < spineMinY) spineMinY = cy;
        if (cy > spineMaxY) spineMaxY = cy;
      }
    });

    const paths = flowEdges.map((edge) => {
      if (!edge.meta) return null;
      const { srcX, srcY, tgtX, tgtY, spineX, color } = edge.meta;
      const isHighlighted = highlightedEdgeIds.has(edge.id);

      // Build elbow path: source → down to midY → horizontal to spine → down → horizontal to target → down to target
      const midY = (srcY + tgtY) / 2;

      let d: string;
      if (srcX === spineX && tgtX === spineX) {
        // Both on spine — straight line
        d = `M ${srcX} ${srcY} L ${tgtX} ${tgtY}`;
      } else if (srcX === spineX) {
        // Source on spine, target on a branch
        d = `M ${srcX} ${srcY} L ${srcX} ${tgtY + NODE_H / 2} L ${tgtX > spineX ? tgtX : tgtX + NODE_W} ${tgtY + NODE_H / 2}`;
      } else if (tgtX === spineX) {
        // Source on branch, target on spine
        const srcEdgeX = srcX < spineX ? srcX + NODE_W : srcX;
        d = `M ${srcEdgeX < spineX ? srcX + NODE_W : srcX} ${srcY} L ${spineX} ${srcY} L ${spineX} ${tgtY}`;
      } else {
        // Both on branches — go through spine with rounded elbow
        const srcEdgeX = srcX < spineX ? srcX + NODE_W / 2 + NODE_W / 2 : srcX + NODE_W / 2 - NODE_W / 2;
        const tgtEdgeX = tgtX < spineX ? tgtX + NODE_W / 2 + NODE_W / 2 : tgtX + NODE_W / 2 - NODE_W / 2;
        // Simplified: go down from src bottom center, then to spine, down, then to target
        const srcCx = srcX < spineX ? srcX + NODE_W : srcX;
        const tgtCxEdge = tgtX < spineX ? tgtX + NODE_W : tgtX;

        d = `M ${srcX + NODE_W / 2} ${srcY + NODE_H} L ${srcX + NODE_W / 2} ${srcY + NODE_H + 8} L ${spineX} ${srcY + NODE_H + 8} L ${spineX} ${tgtY - 8} L ${tgtX + NODE_W / 2} ${tgtY - 8} L ${tgtX + NODE_W / 2} ${tgtY}`;
      }

      return (
        <path
          key={edge.id}
          d={d}
          fill="none"
          stroke={isHighlighted ? '#60a5fa' : color}
          strokeWidth={isHighlighted ? 3 : 2}
          opacity={isHovering ? (isHighlighted ? 1 : 0.1) : 0.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
          filter={isHighlighted ? 'url(#pathGlow)' : undefined}
        />
      );
    });

    // Spine dotted line
    const spineLine = spineMinY < spineMaxY ? (
      <line
        x1={SPINE_X}
        y1={spineMinY}
        x2={SPINE_X}
        y2={spineMaxY}
        stroke="#333"
        strokeWidth={1}
        strokeDasharray="4 6"
        opacity={0.4}
      />
    ) : null;

    return { paths, spineLine };
  }, [nodes, hoveredNodeId, highlightedEdgeIds]);

  return (
    <div className="relative w-full rounded-xl border border-border overflow-auto bg-background">
      <div
        className="relative mx-auto"
        style={{ width: canvasDimensions.width, height: canvasDimensions.height }}
      >
        {/* SVG layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={canvasDimensions.width}
          height={canvasDimensions.height}
        >
          <defs>
            <filter id="pathGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {svgContent.spineLine}
          {svgContent.paths}

          {/* Small circles at each node connection point on the spine */}
          {flowEdges.map((edge) => {
            if (!edge.meta) return null;
            const isHighlighted = highlightedEdgeIds.has(edge.id);
            const isHovering = hoveredNodeId !== null;
            return (
              <circle
                key={`dot-${edge.id}`}
                cx={SPINE_X}
                cy={edge.meta.srcY + (edge.meta.tgtY - edge.meta.srcY) / 2}
                r={isHighlighted ? 4 : 3}
                fill={isHighlighted ? '#60a5fa' : edge.meta.color}
                opacity={isHovering ? (isHighlighted ? 1 : 0.1) : 0.4}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const isHovering = hoveredNodeId !== null;
          const isInPath = highlightedNodeIds.has(node.id);

          return (
            <div
              key={node.id}
              className={`absolute transition-all duration-300 ${
                isHovering && !isInPath && node.type !== 'sectionNode' ? 'opacity-15 scale-[0.97]' : ''
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
