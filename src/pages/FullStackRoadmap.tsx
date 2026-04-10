import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Sparkles, ArrowDown } from 'lucide-react';
import RoadmapFlowCanvas from '@/components/roadmap-flow/RoadmapFlowCanvas';
import RoadmapFlowDetailPanel from '@/components/roadmap-flow/RoadmapFlowDetailPanel';
import RoadmapFlowProgressBar from '@/components/roadmap-flow/RoadmapFlowProgressBar';
import RoadmapFlowSearchBar from '@/components/roadmap-flow/RoadmapFlowSearchBar';
import RoadmapFlowSectionNav from '@/components/roadmap-flow/RoadmapFlowSectionNav';
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

  const handleSectionJump = useCallback((section: string) => {
    const el = document.getElementById(`section-${section.toLowerCase()}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <>
      <Helmet>
        <title>Full Stack Developer Roadmap | Byteskill</title>
        <meta name="description" content="Interactive full stack developer roadmap with progress tracking. Learn web development step by step." />
      </Helmet>

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3 h-3" />
            Interactive Roadmap
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/50 bg-clip-text text-transparent">
            Full Stack Developer
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Step by step guide to becoming a modern full stack developer in 2026.
            Click any topic to view resources, mark progress, and track your journey.
          </p>
        </div>

        {/* Progress */}
        <RoadmapFlowProgressBar stats={stats} onReset={resetAll} />

        {/* Tip banner */}
        <div className="flex items-center justify-center gap-2 text-xs rounded-xl px-4 py-2.5 bg-primary/5 border border-primary/10">
          <ArrowDown className="w-3 h-3 text-primary animate-bounce" />
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">Click any topic</span> to view resources and track progress •
            <span className="text-blue-400"> ⭐ Up Next</span> shows recommended topics •
            <span className="text-violet-400"> ◇ Dashed</span> = alternative
          </span>
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

        {/* Canvas */}
        <RoadmapFlowCanvas
          progress={progress}
          search={search}
          sectionFilter={sectionFilter}
          statusFilter={statusFilter}
          onNodeClick={handleNodeClick}
        />

        {/* Section Nav */}
        <RoadmapFlowSectionNav
          progress={progress}
          activeSection={sectionFilter}
          onSectionClick={handleSectionJump}
        />

        {/* Detail Panel */}
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
