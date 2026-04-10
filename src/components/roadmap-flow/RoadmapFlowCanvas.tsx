import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
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

const { nodes: rawNodes, edges: staticEdges } = buildFlowElements();

export default function RoadmapFlowCanvas({ progress, search, sectionFilter, statusFilter, onNodeClick }: Props) {
  const nodes = useMemo(() => {
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
      return { ...n, data: { ...n.data, status, dimmed } };
    });
  }, [progress, search, sectionFilter, statusFilter]);

  const handleNodeClick = useCallback((_: any, node: any) => {
    if (node.data?.invisible || node.type === 'section' || node.type === 'checkpoint') return;
    const data = getNodeById(node.id);
    if (data) onNodeClick(data);
  }, [onNodeClick]);

  return (
    <div className="w-full border border-border/50 rounded-2xl overflow-hidden bg-background/50 backdrop-blur-sm" style={{ height: '80vh', minHeight: 600 }}>
      <ReactFlow
        nodes={nodes as any}
        edges={staticEdges as any}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
      >
        <Background color="hsl(var(--border))" gap={24} size={1} />
        <Controls
          showInteractive={false}
          className="!bg-card !border-border !rounded-lg !shadow-lg"
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'section') return 'hsl(var(--primary))';
            if (node.type === 'checkpoint') return '#1e293b';
            const status = (node.data as any)?.status;
            if (status === 'done') return '#22c55e';
            if (status === 'in-progress') return '#eab308';
            return (node.data as any)?.sectionColor || '#3b82f6';
          }}
          className="!bg-card/90 !border-border !rounded-lg"
          maskColor="rgba(0,0,0,0.7)"
        />
      </ReactFlow>
    </div>
  );
}
