import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  type NodeTypes,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { buildFlowElements, getNodeById, type NodeStatus, type RoadmapNodeData } from '@/data/fullStackRoadmapData';
import RoadmapFlowTopicNode from './RoadmapFlowTopicNode';
import RoadmapFlowSectionNode from './RoadmapFlowSectionNode';
import RoadmapFlowCheckpointNode from './RoadmapFlowCheckpointNode';

interface Props {
  progress: Record<string, NodeStatus>;
  search: string;
  sectionFilter: string;
  statusFilter: string;
  onNodeClick: (nodeData: RoadmapNodeData) => void;
}

const nodeTypes: NodeTypes = {
  topic: RoadmapFlowTopicNode,
  section: RoadmapFlowSectionNode,
  checkpoint: RoadmapFlowCheckpointNode,
};

export default function RoadmapFlowCanvas({ progress, search, sectionFilter, statusFilter, onNodeClick }: Props) {
  const { nodes: rawNodes, edges: rawEdges } = useMemo(() => buildFlowElements(), []);

  // Enrich nodes with status & dimming
  const enrichedNodes = useMemo(() => {
    return rawNodes.map((n) => {
      if (n.data.invisible) {
        return { ...n, style: { width: 2, height: 2, opacity: 0, pointerEvents: 'none' as const } };
      }
      const status = progress[n.id] || 'pending';
      const nodeData = getNodeById(n.id);
      let dimmed = false;
      if (nodeData) {
        if (search && !nodeData.title.toLowerCase().includes(search.toLowerCase())) dimmed = true;
        if (sectionFilter !== 'all' && nodeData.section !== sectionFilter) dimmed = true;
        if (statusFilter !== 'all' && status !== statusFilter) dimmed = true;
      }
      return {
        ...n,
        data: { ...n.data, status, dimmed },
      };
    });
  }, [rawNodes, progress, search, sectionFilter, statusFilter]);

  const [nodes] = useNodesState(enrichedNodes as any);
  const [edges] = useEdgesState(rawEdges as any);

  const handleNodeClick = useCallback((_: any, node: any) => {
    if (node.data?.invisible || node.type === 'section' || node.type === 'checkpoint') return;
    const data = getNodeById(node.id);
    if (data) onNodeClick(data);
  }, [onNodeClick]);

  return (
    <div className="w-full border border-border rounded-xl overflow-hidden bg-background" style={{ height: '75vh', minHeight: 500 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        connectionMode={ConnectionMode.Loose}
        defaultViewport={{ x: 50, y: 20, zoom: 0.85 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        zoomOnScroll={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background color="hsl(var(--border))" gap={30} size={1} />
      </ReactFlow>
    </div>
  );
}
