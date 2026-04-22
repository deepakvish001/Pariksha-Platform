import { useState, useCallback, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import RoadmapFlowCanvas from '@/components/roadmap-flow/RoadmapFlowCanvas';
import RoadmapFlowDetailPanel from '@/components/roadmap-flow/RoadmapFlowDetailPanel';
import RoadmapFlowProgressBar from '@/components/roadmap-flow/RoadmapFlowProgressBar';
import RoadmapFlowSearchBar from '@/components/roadmap-flow/RoadmapFlowSearchBar';
import { useRoadmapFlowProgress } from '@/hooks/useRoadmapFlowProgress';
import type { RoadmapNodeData } from '@/data/fullStackRoadmapData';
import {
  flowNodes as fsFlowNodes,
  flowEdges as fsFlowEdges,
  roadmapNodesData as fsTopics,
  sections as fsSections,
} from '@/data/fullStackRoadmapData';
import { getRoadmapFlow } from '@/data/genericRoadmapFlowData';

const LAST_ROADMAP_KEY = 'last-opened-roadmap-id';

interface FlowDataset {
  id: string;
  title: string;
  description: string;
  flowNodes: any[];
  flowEdges: any[];
  topics: RoadmapNodeData[];
  sections: string[];
}

// Resolve which dataset to render. Defaults to the rich Full Stack curated dataset
// when the route is /dashboard/roadmap/fullstack (no roadmapId param).
function useFlowDataset(roadmapId: string | undefined): FlowDataset | null {
  return useMemo(() => {
    const id = roadmapId ?? 'fullstack';
    if (id === 'fullstack') {
      return {
        id: 'fullstack',
        title: 'Full Stack Developer Roadmap',
        description:
          'Interactive full stack developer roadmap with progress tracking. Learn web development step by step.',
        flowNodes: fsFlowNodes,
        flowEdges: fsFlowEdges,
        topics: fsTopics,
        sections: fsSections,
      };
    }
    const generic = getRoadmapFlow(id);
    if (!generic) return null;
    return {
      id: generic.id,
      title: generic.title,
      description: generic.description,
      flowNodes: generic.flowNodes,
      flowEdges: generic.flowEdges,
      topics: generic.topics as RoadmapNodeData[],
      sections: generic.sections,
    };
  }, [roadmapId]);
}

export default function FullStackRoadmap() {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const dataset = useFlowDataset(roadmapId);

  const totalNodes = dataset?.topics.length ?? 0;
  const { getStatus, setStatus, resetAll, stats, progress } =
    useRoadmapFlowProgress({
      roadmapId: dataset?.id ?? 'fullstack',
      totalNodes,
    });

  const [selectedNode, setSelectedNode] = useState<RoadmapNodeData | null>(null);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Remember last opened roadmap so the sidebar link can restore it.
  useEffect(() => {
    if (!dataset) return;
    try {
      localStorage.setItem(LAST_ROADMAP_KEY, dataset.id);
    } catch {
      /* ignore */
    }
  }, [dataset?.id]);

  // Reset filters/selection on roadmap switch
  useEffect(() => {
    setSelectedNode(null);
    setSearch('');
    setSectionFilter('all');
    setStatusFilter('all');
  }, [roadmapId]);

  const handleNodeClick = useCallback((node: RoadmapNodeData) => {
    setSelectedNode(node);
  }, []);

  const handleStatusChange = useCallback(
    (status: 'done' | 'in-progress' | 'skipped' | 'pending') => {
      if (selectedNode) setStatus(selectedNode.id, status);
    },
    [selectedNode, setStatus]
  );

  if (!dataset) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold">Roadmap not found</h1>
          <Link
            to="/dashboard/roadmaps"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Roadmaps
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{dataset.title} | Byteskill</title>
        <meta name="description" content={dataset.description} />
      </Helmet>

      <div className="flex flex-col gap-3 p-2 sm:p-4">
        <div className="space-y-3">
          {/* Back button */}
          <Link
            to="/dashboard/roadmaps"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Roadmaps
          </Link>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{dataset.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Click any topic to learn more and track your progress
            </p>
          </div>
          <RoadmapFlowProgressBar stats={stats} onReset={resetAll} />
          <RoadmapFlowSearchBar
            search={search}
            onSearchChange={setSearch}
            sectionFilter={sectionFilter}
            onSectionFilterChange={setSectionFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sections={dataset.sections}
          />
        </div>

        <RoadmapFlowCanvas
          progress={progress}
          search={search}
          sectionFilter={sectionFilter}
          statusFilter={statusFilter}
          onNodeClick={handleNodeClick}
          flowNodes={dataset.flowNodes}
          flowEdges={dataset.flowEdges}
          topics={dataset.topics}
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
