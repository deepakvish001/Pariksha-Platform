import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Sparkles, Map, BookOpen, Clock, Target, ChevronDown, Zap, Layers, GraduationCap } from 'lucide-react';
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
        <div className="relative text-center space-y-3 py-6 overflow-hidden">
          {/* Background orbs */}
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-indigo-500/3 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-xs text-primary mb-3">
              <Map className="w-3 h-3" />
              <span className="font-semibold">Interactive Roadmap</span>
              <span className="text-primary/40">•</span>
              <span className="text-muted-foreground">2026 Edition</span>
              <Zap className="w-3 h-3 text-yellow-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-br from-foreground via-foreground/80 to-foreground/50 bg-clip-text text-transparent tracking-tight leading-tight">
              Full Stack Developer
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl mx-auto">
              Master frontend, backend, testing, security & DevOps — step by step
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 text-xs text-muted-foreground mt-4 flex-wrap">
            <StatChip icon={<Target className="w-3.5 h-3.5 text-primary" />} label={`${stats.total} Topics`} />
            <StatChip icon={<Layers className="w-3.5 h-3.5 text-indigo-400" />} label="6 Sections" />
            <StatChip icon={<BookOpen className="w-3.5 h-3.5 text-emerald-400" />} label="100+ Resources" />
            <StatChip icon={<Clock className="w-3.5 h-3.5 text-yellow-400" />} label="~6 Months" />
            <StatChip icon={<GraduationCap className="w-3.5 h-3.5 text-purple-400" />} label="Beginner → Pro" />
          </div>
        </div>

        {/* Progress */}
        <RoadmapFlowProgressBar stats={stats} onReset={resetAll} />

        {/* Instruction Banner */}
        <div
          className="relative flex items-center justify-center gap-3 text-xs rounded-xl px-5 py-3.5 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04), rgba(6,182,212,0.04))',
            border: '1px solid rgba(99,102,241,0.1)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/3 to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
          <Sparkles className="w-4 h-4 text-primary shrink-0 relative" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
            <span className="text-foreground/80 font-semibold">Click any topic</span>
            <span className="text-muted-foreground sm:ml-1">to view resources, track progress & see prerequisites</span>
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

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/20 border border-border/30">
      {icon}
      <span className="font-medium">{label}</span>
    </span>
  );
}
