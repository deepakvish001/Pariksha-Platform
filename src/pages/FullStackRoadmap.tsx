import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { ReactFlowProvider } from '@xyflow/react';
import RoadmapFlowCanvas from '@/components/roadmap-flow/RoadmapFlowCanvas';
import RoadmapFlowDetailPanel from '@/components/roadmap-flow/RoadmapFlowDetailPanel';
import RoadmapFlowProgressBar from '@/components/roadmap-flow/RoadmapFlowProgressBar';
import RoadmapFlowSearchBar from '@/components/roadmap-flow/RoadmapFlowSearchBar';
import { useRoadmapFlowProgress } from '@/hooks/useRoadmapFlowProgress';
import type { RoadmapNodeData } from '@/data/fullStackRoadmapData';

export default function FullStackRoadmap() {
  const { getStatus, setStatus, resetAll, stats, progress } = useRoadmapFlowProgress();
  const [selectedNode, setSelectedNode] = useState<RoadmapNodeData | null>(null);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleNodeClick = useCallback((node: RoadmapNodeData) => {
    setSelectedNode(node);
  }, []);

  const handleStatusChange = useCallback((status: 'done' | 'in-progress' | 'skipped' | 'pending') => {
    if (selectedNode) setStatus(selectedNode.id, status);
  }, [selectedNode, setStatus]);

  return (
    <>
      <Helmet>
        <title>Full Stack Developer Roadmap | PlacementPro</title>
        <meta name="description" content="Interactive full stack developer roadmap with progress tracking. Learn web development step by step." />
      </Helmet>

      <div className="flex flex-col h-[calc(100vh-4rem)] gap-3 p-2 sm:p-4">
        <div className="space-y-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Full Stack Developer Roadmap</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Click any topic to learn more and track your progress</p>
          </div>
          <RoadmapFlowProgressBar stats={stats} onReset={resetAll} />
          <RoadmapFlowSearchBar
            search={search}
            onSearchChange={setSearch}
            sectionFilter={sectionFilter}
            onSectionFilterChange={setSectionFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </div>

        <div className="flex-1 min-h-0">
          <ReactFlowProvider>
            <RoadmapFlowCanvas
              progress={progress}
              search={search}
              sectionFilter={sectionFilter}
              statusFilter={statusFilter}
              onNodeClick={handleNodeClick}
            />
          </ReactFlowProvider>
        </div>

        <RoadmapFlowDetailPanel
          node={selectedNode}
          status={selectedNode ? getStatus(selectedNode.id) : 'pending'}
          onStatusChange={handleStatusChange}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </>
  );
}
