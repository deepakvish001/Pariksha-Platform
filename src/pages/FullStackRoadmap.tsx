import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
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

      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 space-y-4">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">Full Stack Developer</h1>
          <p className="text-sm text-muted-foreground mt-1">Step by step guide to becoming a modern full stack developer in 2026</p>
        </div>

        <RoadmapFlowProgressBar stats={stats} onReset={resetAll} />

        <div className="flex items-center justify-center gap-2 text-xs border border-border rounded-lg px-4 py-2.5 bg-card/50">
          <span className="text-primary">✦</span>
          <span className="text-muted-foreground">Click any topic to start tracking</span>
        </div>

        <RoadmapFlowSearchBar
          search={search}
          onSearchChange={setSearch}
          sectionFilter={sectionFilter}
          onSectionFilterChange={setSectionFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <RoadmapFlowCanvas
          progress={progress}
          search={search}
          sectionFilter={sectionFilter}
          statusFilter={statusFilter}
          onNodeClick={handleNodeClick}
        />

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
