import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Target, 
  Clock, 
  Sparkles,
  TrendingUp,
  Layout,
  Server,
  Layers,
  Container,
  Smartphone,
  Brain,
  BarChart3,
  Flame,
  Award,
} from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import RoadmapTreeNodeEnhanced from "./RoadmapTreeNodeEnhanced";
import RoadmapNodeDetail from "./RoadmapNodeDetail";
import RoadmapToolbar from "./RoadmapToolbar";
import RoadmapMiniMap from "./RoadmapMiniMap";
import RoadmapCertificate from "./RoadmapCertificate";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoadmapConfetti } from "@/hooks/useRoadmapConfetti";
import { useAuth } from "@/contexts/AuthContext";
import type { RoadmapTree as TreeType, RoadmapTreeNode as NodeType } from "@/data/roadmapTreesData";

// Icon mapping for roadmap types
const roadmapIcons: Record<string, React.ElementType> = {
  Layout, Server, Layers, Container, Smartphone, Brain, BarChart3,
};

interface RoadmapTreeProps {
  tree: TreeType;
  progress: Record<string, { completed: boolean; inProgress: boolean }>;
  onNodeComplete: (nodeId: string) => void;
  onNodeInProgress?: (nodeId: string) => void;
  userName?: string;
}

// Flatten tree nodes helper
const flattenNodes = (nodes: NodeType[]): NodeType[] => {
  const result: NodeType[] = [];
  const traverse = (nodeList: NodeType[]) => {
    for (const node of nodeList) {
      result.push(node);
      if (node.children) traverse(node.children);
    }
  };
  traverse(nodes);
  return result;
};

// Find next recommended node (first incomplete node on the main path)
const findNextRecommendedNode = (
  nodes: NodeType[],
  progress: Record<string, { completed: boolean; inProgress: boolean }>
): string | null => {
  for (const node of nodes) {
    if (!progress[node.id]?.completed) {
      return node.id;
    }
    if (node.children) {
      const childResult = findNextRecommendedNode(node.children, progress);
      if (childResult) return childResult;
    }
  }
  return null;
};

// Build progress path (all nodes leading to the next recommended)
const buildProgressPath = (
  nodes: NodeType[],
  targetId: string,
  progress: Record<string, { completed: boolean; inProgress: boolean }>
): Set<string> => {
  const path = new Set<string>();
  
  const traverse = (nodeList: NodeType[], ancestors: string[]): boolean => {
    for (const node of nodeList) {
      const currentPath = [...ancestors, node.id];
      
      // Include all completed nodes and nodes leading to target
      if (progress[node.id]?.completed) {
        currentPath.forEach(id => path.add(id));
      }
      
      if (node.id === targetId) {
        currentPath.forEach(id => path.add(id));
        return true;
      }
      
      if (node.children) {
        if (traverse(node.children, currentPath)) {
          return true;
        }
      }
    }
    return false;
  };
  
  traverse(nodes, []);
  return path;
};

const RoadmapTree: React.FC<RoadmapTreeProps> = ({
  tree,
  progress,
  onNodeComplete,
  onNodeInProgress,
  userName = "Learner",
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const treeRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isMobile = useIsMobile();
  const { celebrateTopic, trackProgress, resetCelebrations } = useRoadmapConfetti();
  const prevProgressRef = useRef<Record<string, { completed: boolean; inProgress: boolean }>>({});
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Auto-expand first level on mount and reset confetti celebrations
  useEffect(() => {
    const firstLevelIds = tree.nodes.map(n => n.id);
    setExpandedNodes(new Set(firstLevelIds));
    resetCelebrations();
  }, [tree.id, resetCelebrations]);

  // Track progress changes and trigger confetti
  useEffect(() => {
    const prevProgress = prevProgressRef.current;
    const allNodesList = flattenNodes(tree.nodes);
    
    // Check if any node was newly completed
    let wasCompleted = false;
    for (const node of allNodesList) {
      const wasCompletedBefore = prevProgress[node.id]?.completed;
      const isCompletedNow = progress[node.id]?.completed;
      if (!wasCompletedBefore && isCompletedNow) {
        wasCompleted = true;
        break;
      }
    }

    // Calculate current percentage
    const completedCount = allNodesList.filter(n => progress[n.id]?.completed).length;
    const currentPercentage = Math.round((completedCount / allNodesList.length) * 100) || 0;

    // If a node was completed, trigger celebrations
    if (wasCompleted) {
      const celebrated = trackProgress(currentPercentage);
      if (!celebrated) {
        // Small celebration for individual topic
        celebrateTopic();
      }
    }

    // Update ref
    prevProgressRef.current = progress;
  }, [progress, tree.nodes, trackProgress, celebrateTopic]);

  // Calculate all flattened nodes
  const allNodes = useMemo(() => flattenNodes(tree.nodes), [tree.nodes]);

  // Find next recommended node and build progress path
  const { nextRecommendedId, progressPath } = useMemo(() => {
    const nextId = findNextRecommendedNode(tree.nodes, progress);
    const path = nextId ? buildProgressPath(tree.nodes, nextId, progress) : new Set<string>();
    return { nextRecommendedId: nextId, progressPath: path };
  }, [tree.nodes, progress]);

  // Filter nodes based on search and filters
  const { filteredNodeIds, matchCount } = useMemo(() => {
    if (!searchQuery && difficultyFilter === "all" && statusFilter === "all") {
      return { filteredNodeIds: new Set(allNodes.map(n => n.id)), matchCount: allNodes.length };
    }

    const matchingIds = new Set<string>();
    
    allNodes.forEach(node => {
      const matchesSearch = !searchQuery || 
        node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDifficulty = difficultyFilter === "all" || node.difficulty === difficultyFilter;
      
      const nodeProgress = progress[node.id];
      let matchesStatus = true;
      if (statusFilter === "completed") matchesStatus = nodeProgress?.completed || false;
      else if (statusFilter === "in-progress") matchesStatus = nodeProgress?.inProgress || false;
      else if (statusFilter === "not-started") matchesStatus = !nodeProgress?.completed && !nodeProgress?.inProgress;
      
      if (matchesSearch && matchesDifficulty && matchesStatus) {
        matchingIds.add(node.id);
      }
    });

    return { filteredNodeIds: matchingIds, matchCount: matchingIds.size };
  }, [allNodes, searchQuery, difficultyFilter, statusFilter, progress]);

  // Auto-expand to show matching nodes
  React.useEffect(() => {
    if (searchQuery || difficultyFilter !== "all" || statusFilter !== "all") {
      // Find parent nodes that need to be expanded to show matches
      const nodesToExpand = new Set<string>();
      
      const findParents = (nodes: NodeType[], parents: string[] = []) => {
        nodes.forEach(node => {
          if (filteredNodeIds.has(node.id)) {
            parents.forEach(p => nodesToExpand.add(p));
          }
          if (node.children) {
            findParents(node.children, [...parents, node.id]);
          }
        });
      };
      
      findParents(tree.nodes);
      setExpandedNodes(prev => new Set([...prev, ...nodesToExpand]));
    }
  }, [searchQuery, difficultyFilter, statusFilter, filteredNodeIds, tree.nodes]);

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleNodeClick = useCallback((node: NodeType) => {
    setSelectedNode(node);
    setDetailOpen(true);
  }, []);

  const handleComplete = useCallback((nodeId: string) => {
    onNodeComplete(nodeId);
  }, [onNodeComplete]);

  // Handle mini-map node click - scroll to and expand node
  const handleMiniMapNodeClick = useCallback((nodeId: string) => {
    // Find node and its ancestors to expand
    const findAncestors = (nodes: NodeType[], targetId: string, ancestors: string[] = []): string[] | null => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return ancestors;
        }
        if (node.children) {
          const result = findAncestors(node.children, targetId, [...ancestors, node.id]);
          if (result) return result;
        }
      }
      return null;
    };

    const ancestors = findAncestors(tree.nodes, nodeId, []);
    if (ancestors) {
      // Expand all ancestors
      setExpandedNodes(prev => {
        const next = new Set(prev);
        ancestors.forEach(id => next.add(id));
        next.add(nodeId);
        return next;
      });

      // Scroll to node after a short delay to allow expansion
      setTimeout(() => {
        const nodeElement = nodeRefs.current.get(nodeId);
        if (nodeElement) {
          nodeElement.scrollIntoView({ behavior: "smooth", block: "center" });
          // Brief highlight effect
          nodeElement.classList.add("ring-2", "ring-primary", "ring-offset-2");
          setTimeout(() => {
            nodeElement.classList.remove("ring-2", "ring-primary", "ring-offset-2");
          }, 1500);
        }
      }, 100);
    }
  }, [tree.nodes]);

  // Check if node should be visible based on filters
  const isNodeVisible = useCallback((node: NodeType): boolean => {
    if (!searchQuery && difficultyFilter === "all" && statusFilter === "all") return true;
    
    // Node is visible if it matches OR any of its descendants match
    if (filteredNodeIds.has(node.id)) return true;
    
    if (node.children) {
      return node.children.some(child => isNodeVisible(child));
    }
    
    return false;
  }, [filteredNodeIds, searchQuery, difficultyFilter, statusFilter]);

  // Calculate completed children for a node
  const getChildProgress = useCallback((node: NodeType): { completed: number; total: number } => {
    if (!node.children) return { completed: 0, total: 0 };
    let completed = 0;
    let total = 0;
    const countRecursive = (nodes: NodeType[]) => {
      for (const n of nodes) {
        total++;
        if (progress[n.id]?.completed) completed++;
        if (n.children) countRecursive(n.children);
      }
    };
    countRecursive(node.children);
    return { completed, total };
  }, [progress]);

  // Render tree recursively
  const renderNode = useCallback((node: NodeType, depth: number = 0, isLastChild: boolean = false): React.ReactNode => {
    if (!isNodeVisible(node)) return null;

    const isExpanded = expandedNodes.has(node.id);
    const nodeProgress = progress[node.id] || { completed: false, inProgress: false };
    const isOnProgressPath = progressPath.has(node.id);
    const isHighlighted = filteredNodeIds.has(node.id) && (searchQuery || difficultyFilter !== "all" || statusFilter !== "all");
    
    const visibleChildren = node.children?.filter(child => isNodeVisible(child)) || [];
    const childProgress = getChildProgress(node);
    
    return (
      <div 
        key={node.id} 
        className="relative"
        ref={(el) => {
          if (el) nodeRefs.current.set(node.id, el);
        }}
      >
        <RoadmapTreeNodeEnhanced
          node={node}
          depth={depth}
          isExpanded={isExpanded}
          isCompleted={nodeProgress.completed}
          isInProgress={nodeProgress.inProgress}
          isOnProgressPath={isOnProgressPath && node.id === nextRecommendedId}
          isHighlighted={Boolean(isHighlighted)}
          hasLockedPrerequisites={false}
          completedChildren={childProgress.completed}
          totalChildren={childProgress.total}
          onToggle={() => toggleExpand(node.id)}
          onClick={() => handleNodeClick(node)}
          onComplete={() => handleComplete(node.id)}
        />
        
        <AnimatePresence>
          {isExpanded && visibleChildren.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden relative"
            >
              {/* Vertical continuation line for children */}
              <div 
                className="absolute w-0.5 bg-border"
                style={{
                  left: depth * 32 + 16,
                  top: 0,
                  bottom: 28,
                }}
              />
              {visibleChildren.map((child, index) => 
                renderNode(child, depth + 1, index === visibleChildren.length - 1)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [expandedNodes, progress, progressPath, nextRecommendedId, filteredNodeIds, searchQuery, difficultyFilter, statusFilter, toggleExpand, handleNodeClick, handleComplete, isNodeVisible, getChildProgress]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = allNodes.filter(n => progress[n.id]?.completed).length;
    
    return {
      total: allNodes.length,
      completed,
      percentage: Math.round((completed / allNodes.length) * 100) || 0,
    };
  }, [allNodes, progress]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex gap-4">
        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0" ref={treeRef}>
          {/* Enhanced Progress Header */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "relative overflow-hidden rounded-2xl border-2",
              "bg-gradient-to-br from-card via-card to-muted/30"
            )}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }} />
            </div>

            <div className="relative p-5 space-y-4">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Colorful Icon */}
                  <div className={cn(
                    "h-14 w-14 rounded-xl flex items-center justify-center shadow-lg",
                    `bg-gradient-to-br ${tree.color}`
                  )}>
                    {(() => {
                      const IconComponent = roadmapIcons[tree.icon] || Layout;
                      return <IconComponent className="h-7 w-7 text-white" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{tree.title}</h3>
                    <p className="text-sm text-muted-foreground">{tree.description}</p>
                  </div>
                </div>

                {/* Progress Circle */}
                <div className="text-center">
                  <div className="relative">
                    <svg className="h-16 w-16 -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        className="fill-none stroke-muted stroke-[4]"
                      />
                      <motion.circle
                        cx="32"
                        cy="32"
                        r="28"
                        className="fill-none stroke-primary stroke-[4]"
                        strokeLinecap="round"
                        strokeDasharray={176}
                        initial={{ strokeDashoffset: 176 }}
                        animate={{ strokeDashoffset: 176 - (176 * stats.percentage) / 100 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{stats.percentage}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Trophy className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <Target className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="font-semibold text-primary">{stats.total - stats.completed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Time</p>
                    <p className="font-semibold text-amber-600 dark:text-amber-400">
                      {Math.ceil((stats.total - stats.completed) * 0.5)}w
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <TrendingUp className="h-4 w-4 text-violet-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Topics</p>
                    <p className="font-semibold text-violet-600 dark:text-violet-400">{stats.total}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar + Certificate Button */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Learning Progress</span>
                  <div className="flex items-center gap-3">
                    <span>{stats.completed} of {stats.total} topics mastered</span>
                    <RoadmapCertificate
                      roadmapTitle={tree.title}
                      roadmapIcon={tree.icon === "Layout" ? "📐" : tree.icon === "Server" ? "🖥️" : tree.icon === "Layers" ? "📚" : "🎯"}
                      completedCount={stats.completed}
                      totalCount={stats.total}
                      percentage={stats.percentage}
                      userName={userName}
                      trigger={
                        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          <Award className="h-3.5 w-3.5" />
                          Certificate
                        </button>
                      }
                    />
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Next Step Hint */}
              {nextRecommendedId && stats.percentage < 100 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20"
                >
                  <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="text-sm">
                    <span className="text-muted-foreground">Next up: </span>
                    <span className="font-medium text-primary">
                      {allNodes.find(n => n.id === nextRecommendedId)?.title}
                    </span>
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Search & Filter Toolbar */}
          <RoadmapToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            difficultyFilter={difficultyFilter}
          onDifficultyChange={setDifficultyFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          matchCount={matchCount}
          totalCount={allNodes.length}
        />

          {/* Tree Visualization */}
          <div className="relative pl-2">
            {/* Nodes */}
            <div className="space-y-1">
              {tree.nodes.map((node, index) => renderNode(node, 0, index === tree.nodes.length - 1))}
            </div>
          </div>

          {/* No Results */}
          {matchCount === 0 && (searchQuery || difficultyFilter !== "all" || statusFilter !== "all") && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No topics found matching your filters.</p>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setDifficultyFilter("all");
                  setStatusFilter("all");
                }}
                className="text-primary hover:underline mt-2"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Node Detail Panel */}
          <RoadmapNodeDetail
          node={selectedNode}
          open={detailOpen}
          onOpenChange={setDetailOpen}
            isCompleted={selectedNode ? progress[selectedNode.id]?.completed || false : false}
            onComplete={() => selectedNode && handleComplete(selectedNode.id)}
          />
        </div>

        {/* Mini Map - Hidden on mobile */}
        {!isMobile && (
          <div className="w-56 flex-shrink-0">
            <RoadmapMiniMap
              nodes={tree.nodes}
              progress={progress}
              nextRecommendedId={nextRecommendedId}
              expandedNodes={expandedNodes}
              onNodeClick={handleMiniMapNodeClick}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default RoadmapTree;
