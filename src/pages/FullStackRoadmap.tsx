import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Sparkles } from 'lucide-react';
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
        <title>Full Stack Developer Roadmap | Byteskill</title>
        <meta name="description" content="Interactive full stack developer roadmap with progress tracking. Learn web development step by step." />
      </Helmet>

      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* Hero header */}
        <div className="relative text-center py-8 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-card/80 to-background">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl" />
          </div>
          <div className="relative z-10 space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
              Full Stack Developer
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              Step by step guide to becoming a modern full stack developer in 2026
            </p>
          </div>
        </div>

        {/* Progress */}
        <RoadmapFlowProgressBar stats={stats} onReset={resetAll} />

        {/* Tip bar */}
        <div className="flex items-center justify-center gap-2 text-xs rounded-xl px-4 py-3 bg-primary/5 border border-primary/10">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-muted-foreground">Click any topic to view resources and track your progress</span>
        </div>

        {/* Filters */}
        <RoadmapFlowSearchBar
          search={search}
          onSearchChange={setSearch}
          sectionFilter={sectionFilter}
          onSectionFilterChange={setSectionFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Roadmap canvas */}
        <RoadmapFlowCanvas
          progress={progress}
          search={search}
          sectionFilter={sectionFilter}
          statusFilter={statusFilter}
          onNodeClick={handleNodeClick}
        />

        {/* Detail panel */}
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
