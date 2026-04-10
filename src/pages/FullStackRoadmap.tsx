import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Sparkles, Map, BookOpen, Clock, Target, ChevronDown } from 'lucide-react';
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

  return (
    <>
      <Helmet>
        <title>Full Stack Developer Roadmap | Byteskill</title>
        <meta name="description" content="Interactive full stack developer roadmap with progress tracking. Learn web development step by step." />
      </Helmet>

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* Hero Header */}
        <div className="relative text-center space-y-3 py-4 overflow-hidden">
          {/* Background orbs */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/8 border border-primary/15 text-xs text-primary mb-3">
              <Map className="w-3 h-3" />
              <span className="font-medium">Interactive Roadmap</span>
              <span className="text-primary/50">•</span>
              <span className="text-muted-foreground">2026 Edition</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-br from-foreground via-foreground/80 to-foreground/50 bg-clip-text text-transparent tracking-tight">
              Full Stack Developer
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-lg mx-auto">
              Step by step guide to becoming a modern full stack developer
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs text-muted-foreground mt-4">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">{stats.total} Topics</span>
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium">7 Sections</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-medium">~6 Months</span>
            </span>
          </div>
        </div>

        {/* Progress */}
        <RoadmapFlowProgressBar stats={stats} onReset={resetAll} />

        {/* Instruction Banner */}
        <div className="relative flex items-center justify-center gap-3 text-xs rounded-xl px-5 py-3 bg-gradient-to-r from-primary/5 via-primary/8 to-purple-500/5 border border-primary/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/3 to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
          <Sparkles className="w-4 h-4 text-primary shrink-0 relative" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
            <span className="text-foreground/80 font-medium">Click any topic</span>
            <span className="text-muted-foreground sm:ml-1"> to view resources, track progress & see estimated time</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-primary/40 animate-bounce shrink-0 relative" />
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

        {/* Detail Panel */}
        <RoadmapFlowDetailPanel
          node={selectedNode}
          status={selectedNode ? getStatus(selectedNode.id) : 'pending'}
          onStatusChange={handleStatusChange}
          onClose={() => setSelectedNode(null)}
        />

        {/* Floating Section Navigator */}
        <RoadmapFlowSectionNav
          sectionFilter={sectionFilter}
          onSectionFilterChange={setSectionFilter}
        />
      </div>
    </>
  );
}
