import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import RoadmapFlowNode from './RoadmapFlowNode';
import RoadmapFlowSectionNode from './RoadmapFlowSectionNode';
import RoadmapFlowLegend from './RoadmapFlowLegend';
import { flowNodes, flowEdges, type NodeStatus, type RoadmapNodeData, roadmapNodesData } from '@/data/fullStackRoadmapData';

const nodeTypes: NodeTypes = {
  roadmapNode: RoadmapFlowNode as any,
  sectionNode: RoadmapFlowSectionNode as any,
};

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
      
      return {
        ...n,
        data: { ...n.data, status, dimmed },
      };
    });
  }, [progress, search, sectionFilter, statusFilter, getStatus]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'sectionNode') return;
    const nodeData = roadmapNodesData.find((nd) => nd.id === node.id);
    if (nodeData) onNodeClick(nodeData);
  }, [onNodeClick]);

  return (
    <div className="relative w-full h-full rounded-xl border border-border overflow-hidden bg-background">
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        className="!bg-background"
      >
        <Background gap={24} size={1} className="!bg-background" />
        <Controls className="!bg-card !border-border !shadow-md [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground" />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'sectionNode') return n.data?.sectionColor as string || '#525252';
            const s = progress[n.id];
            if (s === 'done') return '#22c55e';
            if (s === 'in-progress') return '#eab308';
            if (s === 'skipped') return '#525252';
            return (n.data?.sectionColor as string) || '#3b82f6';
          }}
          className="!bg-card !border-border"
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>
      <RoadmapFlowLegend />
    </div>
  );
}
