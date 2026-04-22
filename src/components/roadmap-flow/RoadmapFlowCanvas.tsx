import { useCallback, useMemo, useState } from 'react';
import RoadmapFlowNode from './RoadmapFlowNode';
import RoadmapFlowSectionNode from './RoadmapFlowSectionNode';
import RoadmapFlowLegend from './RoadmapFlowLegend';
import {
  flowNodes as fsFlowNodes,
  flowEdges as fsFlowEdges,
  roadmapNodesData as fsRoadmapNodesData,
  type NodeStatus,
  type RoadmapNodeData,
  SPINE_X as FS_SPINE_X,
  NODE_W as FS_NODE_W,
  NODE_H as FS_NODE_H,
  SECTION_W as FS_SECTION_W,
  SECTION_H as FS_SECTION_H,
} from '@/data/fullStackRoadmapData';

interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}
interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated: boolean;
  style: Record<string, any>;
  meta?: { srcX: number; srcY: number; tgtX: number; tgtY: number; spineX: number; color: string };
}

interface Props {
  progress: Record<string, NodeStatus>;
  search: string;
  sectionFilter: string;
  statusFilter: string;
  onNodeClick: (nodeData: RoadmapNodeData) => void;
  /** Optional overrides — when provided, render an arbitrary roadmap. */
  flowNodes?: FlowNode[];
  flowEdges?: FlowEdge[];
  topics?: RoadmapNodeData[];
  layout?: {
    SPINE_X: number;
    NODE_W: number;
    NODE_H: number;
    SECTION_W: number;
    SECTION_H: number;
  };
}

export default function RoadmapFlowCanvas({
  progress,
  search,
  sectionFilter,
  statusFilter,
  onNodeClick,
  flowNodes: propsFlowNodes,
  flowEdges: propsFlowEdges,
  topics: propsTopics,
  layout: propsLayout,
}: Props) {
  // Resolve which dataset to render — either passed-in (generic) or Full Stack default.
  const flowNodesData = propsFlowNodes ?? fsFlowNodes;
  const flowEdgesData = propsFlowEdges ?? fsFlowEdges;
  const topicsData = propsTopics ?? (fsRoadmapNodesData as unknown as RoadmapNodeData[]);
  const SPINE_X = propsLayout?.SPINE_X ?? FS_SPINE_X;
  const NODE_W = propsLayout?.NODE_W ?? FS_NODE_W;
  const NODE_H = propsLayout?.NODE_H ?? FS_NODE_H;
  const SECTION_W = propsLayout?.SECTION_W ?? FS_SECTION_W;
  const SECTION_H = propsLayout?.SECTION_H ?? FS_SECTION_H;

  const getStatus = useCallback((id: string): NodeStatus => progress[id] || 'pending', [progress]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const nodes = useMemo(() => {
    const searchLower = search.toLowerCase();
    return flowNodesData.map((n) => {
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
  }, [progress, search, sectionFilter, statusFilter, getStatus, flowNodesData]);

  // Path highlighting
  const highlightedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const set = new Set<string>();
    for (const nd of topicsData) {
      set.add(nd.id);
      if (nd.id === hoveredNodeId) break;
    }
    return set;
  }, [hoveredNodeId, topicsData]);

  const highlightedEdgeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const set = new Set<string>();
    for (const edge of flowEdgesData) {
      const srcInPath = highlightedNodeIds.has(edge.source) || edge.source.startsWith('section-');
      const tgtInPath = highlightedNodeIds.has(edge.target) || edge.target.startsWith('section-');
      if (srcInPath && tgtInPath) set.add(edge.id);
    }
    return set;
  }, [hoveredNodeId, highlightedNodeIds, flowEdgesData]);

  const handleNodeClick = useCallback((nodeId: string) => {
    const nodeData = topicsData.find((nd) => nd.id === nodeId);
    if (nodeData) onNodeClick(nodeData);
  }, [onNodeClick, topicsData]);

  const canvasDimensions = useMemo(() => {
    let maxX = 0, maxY = 0;
    nodes.forEach((n) => {
      const w = n.type === 'sectionNode' ? SECTION_W : NODE_W;
      const h = n.type === 'sectionNode' ? SECTION_H : NODE_H;
      if (n.position.x + w > maxX) maxX = n.position.x + w;
      if (n.position.y + h > maxY) maxY = n.position.y + h;
    });
    return { width: maxX + 80, height: maxY + 120 };
  }, [nodes, SECTION_W, NODE_W, SECTION_H, NODE_H]);

  const svgContent = useMemo(() => {
    const isHovering = hoveredNodeId !== null;

    let spineMinY = Infinity, spineMaxY = 0;
    nodes.forEach((n) => {
      if (n.type === 'sectionNode') {
        const cy = n.position.y + SECTION_H / 2;
        if (cy < spineMinY) spineMinY = cy;
        if (cy > spineMaxY) spineMaxY = cy;
      }
    });

    const paths = flowEdgesData.map((edge) => {
      if (!edge.meta) return null;
      const { srcX, srcY, tgtX, tgtY, spineX, color } = edge.meta;
      const isHighlighted = highlightedEdgeIds.has(edge.id);

      let d: string;
      if (srcX === spineX && tgtX === spineX) {
        d = `M ${srcX} ${srcY} L ${tgtX} ${tgtY}`;
      } else if (srcX === spineX) {
        d = `M ${srcX} ${srcY} L ${srcX} ${tgtY + NODE_H / 2} L ${tgtX > spineX ? tgtX : tgtX + NODE_W} ${tgtY + NODE_H / 2}`;
      } else if (tgtX === spineX) {
        const srcEdgeX = srcX < spineX ? srcX + NODE_W : srcX;
        d = `M ${srcEdgeX < spineX ? srcX + NODE_W : srcX} ${srcY} L ${spineX} ${srcY} L ${spineX} ${tgtY}`;
      } else {
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
  }, [nodes, hoveredNodeId, highlightedEdgeIds, flowEdgesData, SPINE_X, SECTION_H, NODE_W, NODE_H]);

  return (
    <div className="relative w-full rounded-xl border border-border overflow-auto bg-background">
      <div
        className="relative mx-auto"
        style={{ width: canvasDimensions.width, height: canvasDimensions.height }}
      >
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

          {flowEdgesData.map((edge) => {
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
